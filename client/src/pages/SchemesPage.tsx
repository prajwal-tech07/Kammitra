import { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";

// ── Types ───────────────────────────────────────────────────
interface Scheme {
  _id: string;
  name_en: string;
  name_hi: string;
  short_desc: string;
  eligibility: string[];
  docs_needed: string[];
  apply_link: string;
  who_for: string[];
  status: string;
  last_updated: string;
  matched?: boolean;
}

interface SchemeNews {
  _id: string;
  title: string;
  summary: string;
  link: string;
  pubDate: string;
  priority: "high" | "low";
  source: string;
}

interface SchemeApplication {
  _id: string;
  workerId: string;
  schemeId: Scheme;
  referenceNo: string;
  status: "applied" | "approved" | "rejected";
  createdAt: string;
}

// ── Quiz state ──────────────────────────────────────────────
interface QuizAnswers {
  area: "" | "rural" | "urban";
  age: "" | "18-40" | "41-60" | "60+";
  docs: "" | "both" | "aadhaar_only" | "none";
}

// ── Skeleton card ──────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="animate-pulse bg-white shadow-md rounded-2xl p-4 space-y-3">
      <div className="h-5 w-3/4 rounded bg-gray-200" />
      <div className="h-4 w-1/2 rounded bg-gray-200" />
      <div className="h-4 w-full rounded bg-gray-100" />
      <div className="h-4 w-5/6 rounded bg-gray-100" />
    </div>
  );
}

function SchemesPage() {
  const { user, token } = useAuth();
  const { t, i18n } = useTranslation();

  // ── State ──────────────────────────────────────────────
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [news, setNews] = useState<SchemeNews[]>([]);
  const [applications, setApplications] = useState<SchemeApplication[]>([]);

  const [loading, setLoading] = useState(false);
  const [schemesFetched, setSchemesFetched] = useState(false);

  // Quiz
  const [quiz, setQuiz] = useState<QuizAnswers>({
    area: "",
    age: "",
    docs: "",
  });
  const [quizDone, setQuizDone] = useState(false);

  // Apply modal
  const [applyScheme, setApplyScheme] = useState<Scheme | null>(null);
  const [refNo, setRefNo] = useState("");
  const [applying, setApplying] = useState(false);
  const [applySuccess, setApplySuccess] = useState<string | null>(null);

  // News carousel
  const carouselRef = useRef<HTMLDivElement>(null);
  const [newsIdx, setNewsIdx] = useState(0);

  // ── Fetch news on mount (schemes are fetched on quiz submit) ──
  useEffect(() => {
    fetch("/api/schemes/news/latest")
      .then((r) => r.json())
      .then((d) => setNews(Array.isArray(d) ? d : d.news ?? []))
      .catch(() => {});
  }, []);

  // ── Fetch user applications ────────────────────────────
  useEffect(() => {
    if (!user || !token) return;
    fetch(`/api/schemes/my-applications?workerId=${user._id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => setApplications(Array.isArray(d) ? d : d.applications ?? []))
      .catch(() => {});
  }, [user, token, applySuccess]);

  // ── Quiz submit → fetch schemes ───────────────────────
  const handleQuizSubmit = async () => {
    setLoading(true);
    setQuizDone(true);
    try {
      const url = user ? `/api/schemes?workerId=${user._id}` : "/api/schemes";
      const res = await fetch(url);
      const data = await res.json();
      setSchemes(Array.isArray(data) ? data : data.schemes ?? []);
      setSchemesFetched(true);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  };

  // ── Apply for scheme ──────────────────────────────────
  const handleApply = async () => {
    if (!applyScheme || !refNo.trim() || !user) return;
    setApplying(true);
    try {
      const res = await fetch("/api/schemes/apply", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workerId: user._id,
          schemeId: applyScheme._id,
          referenceNo: refNo.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setApplySuccess(applyScheme.name_en);
        setApplyScheme(null);
        setRefNo("");
        setTimeout(() => setApplySuccess(null), 4000);
      } else {
        alert(data.error || "Failed to save");
      }
    } catch {
      alert("Network error");
    } finally {
      setApplying(false);
    }
  };

  // ── News carousel scroll ──────────────────────────────
  const scrollNews = (dir: "left" | "right") => {
    if (!carouselRef.current) return;
    const w = carouselRef.current.offsetWidth;
    const next = dir === "left" ? Math.max(0, newsIdx - 1) : Math.min(news.length - 1, newsIdx + 1);
    setNewsIdx(next);
    carouselRef.current.scrollTo({ left: next * (w * 0.85 + 16), behavior: "smooth" });
  };

  const schemeName = (s: Scheme) =>
    i18n.language === "hi" && s.name_hi ? s.name_hi : s.name_en;

  const appliedSchemeIds = new Set(
    applications.map((a) =>
      typeof a.schemeId === "object" ? a.schemeId._id : a.schemeId
    )
  );

  const hasMatched = schemes.some((s) => s.matched);
  const matchedSchemes = schemes.filter((s) => s.matched);
  const generalSchemes = schemes.filter((s) => !s.matched);

  // ── Render ──────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-10">
      {/* ─── HEADER ─────────────────────────────────────── */}
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-extrabold">
          {t("schemes.pageTitle")}
        </h1>
        <p className="text-gray-500 mt-2">
          {t("schemes.pageSubtitle")}
        </p>
      </div>

      {/* ─── SUCCESS TOAST ──────────────────────────────── */}
      {applySuccess && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-5 py-3 rounded-xl shadow-lg animate-bounce">
          ✅ Application saved for {applySuccess}!
        </div>
      )}

      {/* ═══ SECTION 1 — QUIZ ═══════════════════════════ */}
      <section className="bg-white rounded-2xl shadow-md p-6">
        <h2 className="text-lg font-bold text-emerald-700 mb-4">
          {t("schemes.findForYou")}
        </h2>

        <div className="space-y-5">
          {/* Q1: Area */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t("schemes.q1_label")}
            </label>
            <div className="flex gap-3">
              {(["rural", "urban"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setQuiz({ ...quiz, area: v })}
                  className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                    quiz.area === v
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {v === "rural" ? "🏡 " : "🏙️ "}
                  {t(`schemes.q1_${v}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Q2: Age */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t("schemes.q2_label")}
            </label>
            <div className="flex gap-3">
              {(["18-40", "41-60", "60+"] as const).map((v) => {
                const key = v.replace("+", "_plus").replace("-", "_");
                return (
                  <button
                    key={v}
                    onClick={() => setQuiz({ ...quiz, age: v })}
                    className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                      quiz.age === v
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {t(`schemes.q2_${key}`)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Q3: Documents */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t("schemes.q3_label")}
            </label>
            <div className="flex flex-wrap gap-3">
              {(["both", "aadhaar_only", "none"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setQuiz({ ...quiz, docs: v })}
                  className={`flex-1 min-w-[100px] py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                    quiz.docs === v
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {t(`schemes.q3_${v}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleQuizSubmit}
            disabled={!quiz.area || !quiz.age || !quiz.docs}
            className="w-full py-3 rounded-xl bg-emerald-500 text-white font-bold text-base
                       hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed
                       transition-all shadow-md"
          >
            {t("schemes.findSchemes")}
          </button>

          {quizDone && (
            <p className="text-sm text-emerald-600 text-center animate-pulse">
              {hasMatched
                ? t("schemes.showingPersonalized")
                : t("schemes.showingAll")}
            </p>
          )}
        </div>
      </section>

      {/* ═══ SECTION 2 — NEWS CAROUSEL ═══════════════════ */}
      <section>
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          {t("schemes.latestNews")}
        </h2>

        {news.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-md p-6 text-center text-gray-400">
            {t("schemes.noNews")}
          </div>
        ) : (
          <div className="relative">
            {/* Arrows */}
            {news.length > 1 && (
              <>
                <button
                  onClick={() => scrollNews("left")}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10
                             bg-white shadow-lg rounded-full w-8 h-8 flex items-center justify-center
                             text-gray-600 hover:text-emerald-600 border"
                >
                  ‹
                </button>
                <button
                  onClick={() => scrollNews("right")}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10
                             bg-white shadow-lg rounded-full w-8 h-8 flex items-center justify-center
                             text-gray-600 hover:text-emerald-600 border"
                >
                  ›
                </button>
              </>
            )}

            <div
              ref={carouselRef}
              className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2"
              style={{ scrollbarWidth: "none" }}
            >
              {news.map((n) => (
                <div
                  key={n._id}
                  className="flex-shrink-0 w-[85%] sm:w-[80%] snap-start bg-white rounded-2xl shadow-md p-5 border-l-4
                             border-emerald-400"
                >
                  <div className="flex items-start gap-2 mb-2">
                    {n.priority === "high" && (
                      <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
                        🔴 {t("schemes.highPriority")}
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-gray-800 text-sm leading-snug mb-1">
                    {n.title}
                  </h3>
                  <p className="text-gray-500 text-xs mb-3 line-clamp-2">
                    {n.summary}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      {new Date(n.pubDate).toLocaleDateString()}
                    </span>
                    <a
                      href={n.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-600 text-xs font-semibold hover:underline"
                    >
                      {t("schemes.readMore")}
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {/* Dots */}
            {news.length > 1 && (
              <div className="flex justify-center gap-1.5 mt-3">
                {news.map((_, i) => (
                  <span
                    key={i}
                    className={`w-2 h-2 rounded-full transition-all ${
                      i === newsIdx ? "bg-emerald-500 w-4" : "bg-gray-300"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* ═══ SECTION 3 — SCHEMES (matched first, then general) ═══ */}
      <section>
        {!schemesFetched && !loading ? (
          <div className="bg-white rounded-2xl shadow-md p-8 text-center text-gray-400">
            <p className="text-3xl mb-2">🔍</p>
            <p className="font-semibold">{t("schemes.fillQuizFirst")}</p>
          </div>
        ) : loading ? (
          <div className="space-y-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : schemes.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-md p-8 text-center text-gray-400">
            {t("schemes.noSchemes")}
          </div>
        ) : (
          <div className="space-y-8">
            {/* ── Matched schemes for your skills ── */}
            {hasMatched && (
              <div>
                <h2 className="text-lg font-bold text-emerald-700 mb-4 flex items-center gap-2">
                  ⭐ {t("schemes.matchedSchemes")}
                </h2>
                <div className="space-y-4">
                  {matchedSchemes.map((s) => (
                    <div
                      key={s._id}
                      className="bg-white rounded-2xl shadow-md p-5 hover:shadow-lg transition-shadow border-l-4 border-emerald-400"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-bold text-gray-800 text-base leading-snug">
                          {schemeName(s)}
                        </h3>
                        <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                          ⭐ {t("schemes.matchBadge")}
                        </span>
                      </div>
                      <p className="text-gray-500 text-sm mb-3">{s.short_desc}</p>
                      <div className="mb-3">
                        <p className="text-xs font-semibold text-gray-600 mb-1">{t("schemes.eligibility")}:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {s.eligibility.map((e, i) => (
                            <span key={i} className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">{e}</span>
                          ))}
                        </div>
                      </div>
                      <div className="mb-4">
                        <p className="text-xs font-semibold text-gray-600 mb-1">{t("schemes.docsNeeded")}:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {s.docs_needed.map((d, i) => (
                            <span key={i} className="bg-orange-50 text-orange-700 text-xs px-2 py-0.5 rounded-full">📄 {d}</span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <a href={s.apply_link} target="_blank" rel="noopener noreferrer"
                          className="flex-1 text-center py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-colors shadow-md">
                          {t("schemes.applyNow")}
                        </a>
                        {user && token ? (
                          appliedSchemeIds.has(s._id) ? (
                            <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-3 py-2 rounded-xl">✅ {t("schemes.applied")}</span>
                          ) : (
                            <button onClick={() => setApplyScheme(s)}
                              className="px-4 py-2.5 rounded-xl border-2 border-emerald-500 text-emerald-600 text-sm font-semibold hover:bg-emerald-50 transition-colors">
                              📝 {t("schemes.saveApplication")}
                            </button>
                          )
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── General / All schemes ── */}
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-4">
                {t("schemes.allSchemes")}
              </h2>
              <div className="space-y-4">
                {(hasMatched ? generalSchemes : schemes).map((s) => (
                  <div
                    key={s._id}
                    className="bg-white rounded-2xl shadow-md p-5 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-gray-800 text-base leading-snug">
                        {schemeName(s)}
                      </h3>
                    </div>
                    <p className="text-gray-500 text-sm mb-3">{s.short_desc}</p>
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-gray-600 mb-1">{t("schemes.eligibility")}:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {s.eligibility.map((e, i) => (
                          <span key={i} className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">{e}</span>
                        ))}
                      </div>
                    </div>
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-600 mb-1">{t("schemes.docsNeeded")}:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {s.docs_needed.map((d, i) => (
                          <span key={i} className="bg-orange-50 text-orange-700 text-xs px-2 py-0.5 rounded-full">📄 {d}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <a href={s.apply_link} target="_blank" rel="noopener noreferrer"
                        className="flex-1 text-center py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-colors shadow-md">
                        {t("schemes.applyNow")}
                      </a>
                      {user && token ? (
                        appliedSchemeIds.has(s._id) ? (
                          <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-3 py-2 rounded-xl">✅ {t("schemes.applied")}</span>
                        ) : (
                          <button onClick={() => setApplyScheme(s)}
                            className="px-4 py-2.5 rounded-xl border-2 border-emerald-500 text-emerald-600 text-sm font-semibold hover:bg-emerald-50 transition-colors">
                            📝 {t("schemes.saveApplication")}
                          </button>
                        )
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ═══ SECTION 4 — TRACK APPLICATIONS ═════════════ */}
      <section className="bg-white rounded-2xl shadow-md p-6">
        <h2 className="text-lg font-bold text-emerald-700 mb-4">
          {t("schemes.trackApplications")}
        </h2>

        {!user || !token ? (
          <p className="text-gray-400 text-center py-4">
            {t("schemes.loginToTrack")}
          </p>
        ) : applications.length === 0 ? (
          <div className="text-center py-6 text-gray-400">
            <p className="text-3xl mb-2">📋</p>
            <p className="font-semibold">{t("schemes.noApplications")}</p>
            <p className="text-sm mt-1">{t("schemes.noApplicationsHint")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {applications.map((a) => {
              const scheme =
                typeof a.schemeId === "object" ? a.schemeId : null;
              const statusColors: Record<string, string> = {
                applied: "bg-yellow-100 text-yellow-700 border-yellow-200",
                approved: "bg-green-100 text-green-700 border-green-200",
                rejected: "bg-red-100 text-red-700 border-red-200",
              };
              return (
                <div
                  key={a._id}
                  className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:bg-gray-50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm truncate">
                      {scheme ? schemeName(scheme) : "Scheme"}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {t("schemes.referenceNo")}: {a.referenceNo}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full border ${
                      statusColors[a.status] || ""
                    }`}
                  >
                    {t(`schemes.${a.status}`)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ═══ APPLY MODAL ═══════════════════════════════════ */}
      {applyScheme && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="font-bold text-lg text-gray-800">
              📝 {schemeName(applyScheme)}
            </h3>
            <p className="text-sm text-gray-500">
              {t("schemes.referenceNo")}
            </p>
            <input
              type="text"
              value={refNo}
              onChange={(e) => setRefNo(e.target.value)}
              placeholder={t("schemes.refPlaceholder")}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500
                         focus:outline-none text-sm"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setApplyScheme(null);
                  setRefNo("");
                }}
                className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold
                           hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={!refNo.trim() || applying}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white font-bold
                           hover:bg-emerald-600 disabled:opacity-40 transition-colors shadow-md"
              >
                {applying ? "..." : t("schemes.saveApplication")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SchemesPage;
