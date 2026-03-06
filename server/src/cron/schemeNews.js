/**
 * RSS Cron Job — fetches live government scheme news every 6 hours.
 *
 * Sources:
 *   • Google News (3 targeted queries for Indian govt schemes)
 *   • PIB.gov.in (Press Information Bureau — official govt press releases)
 *   • Times of India (government policy section)
 *
 * Usage:
 *   require("./cron/schemeNews").start();   // in index.js after DB connect
 */
const cron = require("node-cron");
const RssParser = require("rss-parser");
const SchemeNews = require("../models/SchemeNews");

const parser = new RssParser({
  timeout: 20000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept: "application/rss+xml, application/xml, text/xml, */*",
  },
});

// ── Live RSS feed sources ───────────────────────────────────
const FEEDS = [
  // Google News — targeted queries for Indian government schemes
  {
    url: "https://news.google.com/rss/search?q=india+government+scheme+workers&hl=en-IN&gl=IN&ceid=IN:en",
    source: "Google News",
  },
  {
    url: "https://news.google.com/rss/search?q=sarkari+yojana+labour+worker&hl=en-IN&gl=IN&ceid=IN:en",
    source: "Google News",
  },
  {
    url: "https://news.google.com/rss/search?q=MGNREGA+OR+eshram+OR+ayushman+OR+pension+OR+ujjwala+india&hl=en-IN&gl=IN&ceid=IN:en",
    source: "Google News",
  },
  // PIB — official Press Information Bureau
  {
    url: "https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=3",
    source: "PIB India",
  },
  // Times of India — government section
  {
    url: "https://timesofindia.indiatimes.com/rssfeeds/1898055.cms",
    source: "Times of India",
  },
];

// ── Keywords that mark a news item as HIGH priority ─────────
const HIGH_KEYWORDS = [
  "mgnrega", "nrega", "mnrega",
  "pmjjby", "pmsby", "pmjdy",
  "ration", "food security",
  "pension", "atal pension",
  "ayushman", "pm-jay",
  "ujjwala", "gas connection",
  "awas", "housing", "pmay",
  "mudra", "loan",
  "skill india", "pmkvy", "कौशल",
  "e-shram", "eshram",
  "svanidhi", "street vendor",
  "minimum wage", "न्यूनतम मजदूरी",
  "labour", "labor", "workers", "श्रमिक", "मजदूर",
  "मनरेगा", "राशन", "पेंशन", "आवास", "बीमा",
];

// ── Keywords to check if a news item is relevant to schemes ─
const RELEVANCE_KEYWORDS = [
  ...HIGH_KEYWORDS,
  "scheme", "yojana", "योजना",
  "subsidy", "benefit", "welfare",
  "insurance", "coverage",
  "registration", "enrollment",
  "employment", "job card",
  "pm kisan", "jan dhan",
  "sarkari", "सरकारी",
  "budget", "allocation",
  "eligibility", "application",
  "direct benefit", "DBT",
  "nrlm", "aajeevika",
  "unorganized", "unorganised",
  "daily wage", "construction worker",
  "domestic worker", "gig worker",
];

/**
 * Check if a news item is relevant to government schemes / workers
 */
function isRelevant(title = "", summary = "") {
  const combined = `${title} ${summary}`.toLowerCase();
  return RELEVANCE_KEYWORDS.some((kw) => combined.includes(kw));
}

/**
 * Score priority: HIGH if title or summary contains any keyword
 */
function scorePriority(title = "", summary = "") {
  const combined = `${title} ${summary}`.toLowerCase();
  return HIGH_KEYWORDS.some((kw) => combined.includes(kw)) ? "high" : "low";
}

/**
 * Fetch a single RSS feed and return parsed items
 */
async function fetchFeed(feedConfig) {
  try {
    const feed = await parser.parseURL(feedConfig.url);
    return (feed.items || []).map((item) => ({
      title: (item.title || "").trim(),
      summary: (item.contentSnippet || item.content || "").substring(0, 200).trim(),
      link: (item.link || "").trim(),
      pubDate: item.pubDate ? new Date(item.pubDate) : new Date(),
      source: feedConfig.source,
    }));
  } catch (err) {
    console.warn(`⚠️  RSS fetch failed for ${feedConfig.source}: ${err.message}`);
    return [];
  }
}

/**
 * Main function: fetch all feeds, deduplicate, save to DB
 */
async function fetchSchemeNews() {
  console.log("📰 Fetching scheme news from RSS feeds...");

  let allItems = [];

  // Fetch all feeds concurrently
  const results = await Promise.allSettled(FEEDS.map(fetchFeed));
  for (const result of results) {
    if (result.status === "fulfilled") {
      allItems = allItems.concat(result.value);
    }
  }

  if (allItems.length === 0) {
    console.log("   No items fetched from any feed. Will retry next cycle.");
    return { saved: 0, skipped: 0 };
  }

  let saved = 0;
  let skipped = 0;

  for (const item of allItems) {
    if (!item.link || !item.title) {
      skipped++;
      continue;
    }

    // Only keep items relevant to government schemes / workers
    if (!isRelevant(item.title, item.summary)) {
      skipped++;
      continue;
    }

    try {
      // Deduplicate by link — only insert if link doesn't exist
      const exists = await SchemeNews.findOne({ link: item.link });
      if (exists) {
        skipped++;
        continue;
      }

      await SchemeNews.create({
        title: item.title,
        summary: item.summary,
        link: item.link,
        pubDate: item.pubDate,
        priority: scorePriority(item.title, item.summary),
        source: item.source,
      });
      saved++;
    } catch (err) {
      // Unique constraint violation = duplicate link, safe to ignore
      if (err.code === 11000) {
        skipped++;
      } else {
        console.warn(`   Error saving news item: ${err.message}`);
      }
    }
  }

  // Keep only the latest 100 news items
  const totalCount = await SchemeNews.countDocuments();
  if (totalCount > 100) {
    const oldest = await SchemeNews.find()
      .sort({ pubDate: -1 })
      .skip(100)
      .select("_id");
    if (oldest.length > 0) {
      const idsToDelete = oldest.map((doc) => doc._id);
      await SchemeNews.deleteMany({ _id: { $in: idsToDelete } });
      console.log(`   🗑️  Pruned ${idsToDelete.length} old news items (keeping 100)`);
    }
  }

  console.log(`   ✅ Scheme news: ${saved} saved, ${skipped} skipped/duplicate`);
  return { saved, skipped };
}

/**
 * Start the cron job — runs daily at 9:00 AM IST (3:30 UTC)
 */
function start() {
  // Run once on startup (non-blocking)
  setTimeout(() => {
    fetchSchemeNews().catch((err) =>
      console.error("❌ Initial scheme news fetch error:", err.message)
    );
  }, 5000);

  // Schedule: every 6 hours (0:00, 6:00, 12:00, 18:00 UTC)
  cron.schedule("0 */6 * * *", () => {
    fetchSchemeNews().catch((err) =>
      console.error("❌ Cron scheme news fetch error:", err.message)
    );
  });

  console.log("⏰ Scheme news cron scheduled (every 6 hours + on startup)");
}

module.exports = { start, fetchSchemeNews };
