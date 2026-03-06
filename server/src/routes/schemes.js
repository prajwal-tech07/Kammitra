const express = require("express");
const auth = require("../middleware/auth");
const Scheme = require("../models/Scheme");
const SchemeNews = require("../models/SchemeNews");
const SchemeApplication = require("../models/SchemeApplication");
const WorkerProfile = require("../models/WorkerProfile");

const router = express.Router();

// ── Skill → who_for mapping ─────────────────────────────────
// Maps WorkerProfile skills to scheme who_for values
// (both use the same enum from the Job/WorkerProfile models)
const SKILL_MAP = {
  Cleaning: "Cleaning",
  "Shop Work": "Shop Work",
  Construction: "Construction",
  Plumbing: "Plumbing",
  Electrical: "Electrical",
  Driving: "Driving",
  Cooking: "Cooking",
  Babysitting: "Babysitting",
};

// ═════════════════════════════════════════════════════════════
// GET /api/schemes?workerId=abc (optional) — personalized ordering
//   If workerId given: skill-matched schemes first (matched:true), then general
//   If no workerId: return all active schemes
// ═════════════════════════════════════════════════════════════
router.get("/", async (req, res) => {
  try {
    const { workerId } = req.query;
    const allSchemes = await Scheme.find({ status: "active" })
      .sort({ last_updated: -1 })
      .lean();

    // No worker → return all as-is
    if (!workerId) {
      return res.json(allSchemes);
    }

    // Try to find worker profile for personalization
    const profile = await WorkerProfile.findOne({ userId: workerId }).lean();
    if (!profile || !profile.skills || profile.skills.length === 0) {
      return res.json(allSchemes);
    }

    const workerSkills = profile.skills.map((s) => SKILL_MAP[s] || s);

    // Separate into: skill-specific matches (who_for is narrow & overlaps worker skills)
    //                 and general schemes (who_for covers 6+ categories)
    const matched = [];
    const general = [];

    for (const scheme of allSchemes) {
      const isGeneral = scheme.who_for.length >= 6; // covers most worker types
      const hasOverlap = scheme.who_for.some((w) => workerSkills.includes(w));

      if (!isGeneral && hasOverlap) {
        // Skill-specific scheme that matches this worker
        const matchCount = scheme.who_for.filter((w) => workerSkills.includes(w)).length;
        matched.push({ ...scheme, matched: true, _score: matchCount });
      } else if (isGeneral) {
        general.push({ ...scheme, matched: false });
      } else if (!hasOverlap) {
        // Skill-specific but doesn't match → skip (not relevant)
        // We still include it at the end in case they want to browse
        general.push({ ...scheme, matched: false });
      }
    }

    // Sort matched by relevance score (most matching skills first)
    matched.sort((a, b) => b._score - a._score);
    const cleanMatched = matched.map(({ _score, ...rest }) => rest);

    // Combine: matched first, then general
    const result = [...cleanMatched, ...general];
    res.json(result);
  } catch (err) {
    console.error("GET /api/schemes error:", err.message);
    res.status(500).json({ error: "Failed to fetch schemes" });
  }
});

// ═════════════════════════════════════════════════════════════
// GET /api/schemes/eligible?workerId=abc123
//   Find worker profile → match who_for[] with worker skills[]
//   Return top 5 matching schemes
// ═════════════════════════════════════════════════════════════
router.get("/eligible", async (req, res) => {
  try {
    const { workerId } = req.query;
    if (!workerId) {
      return res.status(400).json({ error: "workerId query parameter is required" });
    }

    // Find worker profile
    const profile = await WorkerProfile.findOne({ userId: workerId }).lean();
    if (!profile) {
      return res.status(404).json({ error: "Worker profile not found" });
    }

    const workerSkills = (profile.skills || []).map((s) => SKILL_MAP[s] || s);

    if (workerSkills.length === 0) {
      // No skills set — return universal schemes (those that cover all workers)
      const universal = await Scheme.find({
        status: "active",
        who_for: { $size: { $gte: 6 } },
      })
        .sort({ last_updated: -1 })
        .limit(5)
        .lean();
      return res.json(universal);
    }

    // Find schemes where who_for overlaps with worker skills
    const schemes = await Scheme.find({
      status: "active",
      who_for: { $in: workerSkills },
    })
      .sort({ last_updated: -1 })
      .lean();

    // Score by overlap count (more matching skills = better match)
    const scored = schemes.map((scheme) => {
      const matches = scheme.who_for.filter((w) => workerSkills.includes(w)).length;
      return { ...scheme, _matchScore: matches };
    });

    // Sort by match score descending, take top 5
    scored.sort((a, b) => b._matchScore - a._matchScore);
    const top5 = scored.slice(0, 5);

    // Remove internal score before sending
    const result = top5.map(({ _matchScore, ...rest }) => rest);
    res.json(result);
  } catch (err) {
    console.error("GET /api/schemes/eligible error:", err.message);
    res.status(500).json({ error: "Failed to fetch eligible schemes" });
  }
});

// ═════════════════════════════════════════════════════════════
// GET /api/scheme-news/latest — return top 5 news ORDER BY pubDate DESC
// ═════════════════════════════════════════════════════════════
router.get("/news/latest", async (_req, res) => {
  try {
    const news = await SchemeNews.find()
      .sort({ priority: 1, pubDate: -1 })
      .limit(10)
      .lean();
    res.json(news);
  } catch (err) {
    console.error("GET /api/schemes/news/latest error:", err.message);
    res.status(500).json({ error: "Failed to fetch scheme news" });
  }
});

// ═════════════════════════════════════════════════════════════
// POST /api/schemes/apply — worker applies for a scheme
//   Body: { workerId, schemeId, referenceNo }
// ═════════════════════════════════════════════════════════════
router.post("/apply", auth, async (req, res) => {
  try {
    const { workerId, schemeId, referenceNo } = req.body;

    if (!workerId || !schemeId) {
      return res.status(400).json({ error: "workerId and schemeId are required" });
    }

    // Verify the scheme exists and is active
    const scheme = await Scheme.findById(schemeId).lean();
    if (!scheme) {
      return res.status(404).json({ error: "Scheme not found" });
    }
    if (scheme.status !== "active") {
      return res.status(400).json({ error: "This scheme is no longer active" });
    }

    // Check if already applied
    const existing = await SchemeApplication.findOne({ workerId, schemeId });
    if (existing) {
      return res.status(409).json({
        error: "Already applied to this scheme",
        application: existing,
      });
    }

    // Create application
    const application = await SchemeApplication.create({
      workerId,
      schemeId,
      referenceNo: referenceNo || "",
    });

    res.status(201).json({
      message: "Scheme application recorded successfully",
      application,
    });
  } catch (err) {
    console.error("POST /api/schemes/apply error:", err.message);
    res.status(500).json({ error: "Failed to record scheme application" });
  }
});

// ═════════════════════════════════════════════════════════════
// GET /api/schemes/my-applications?workerId=abc123
//   Return all scheme applications for a worker (bonus)
// ═════════════════════════════════════════════════════════════
router.get("/my-applications", async (req, res) => {
  try {
    const { workerId } = req.query;
    if (!workerId) {
      return res.status(400).json({ error: "workerId query parameter is required" });
    }

    const applications = await SchemeApplication.find({ workerId })
      .populate("schemeId", "name_en name_hi short_desc apply_link status")
      .sort({ createdAt: -1 })
      .lean();

    res.json(applications);
  } catch (err) {
    console.error("GET /api/schemes/my-applications error:", err.message);
    res.status(500).json({ error: "Failed to fetch scheme applications" });
  }
});

module.exports = router;
