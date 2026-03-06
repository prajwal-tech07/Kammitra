import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

// ── Types ───────────────────────────────────────────────────
interface WorkerProfile {
  skills: string[];
  availability: string;
  location: string;
  completedJobs: number;
  goodRatings: number;
  badRatings: number;
}

interface Job {
  _id: string;
  title: string;
  category: string;
  description: string;
  payAmount: number;
  payType: "per_day" | "per_month";
  location: string;
  status: string;
  createdAt: string;
}

const CATEGORIES = [
  "All",
  "Cleaning",
  "Shop Work",
  "Construction",
  "Plumbing",
  "Electrical",
  "Driving",
  "Cooking",
  "Babysitting",
];

const CATEGORY_ICONS: Record<string, string> = {
  Cleaning: "🧹",
  "Shop Work": "🏪",
  Construction: "🏗️",
  Plumbing: "🔧",
  Electrical: "⚡",
  Driving: "🚗",
  Cooking: "🍳",
  Babysitting: "👶",
};

// ── Skeleton card ──────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="animate-pulse bg-white shadow-md rounded-2xl p-4 space-y-3">
      <div className="h-5 w-3/4 rounded bg-gray-200" />
      <div className="h-4 w-1/3 rounded bg-gray-200" />
      <div className="h-4 w-full rounded bg-gray-100" />
      <div className="h-4 w-5/6 rounded bg-gray-100" />
      <div className="flex items-center justify-between pt-2">
        <div className="h-5 w-24 rounded bg-gray-200" />
        <div className="h-10 w-24 rounded-xl bg-gray-200" />
      </div>
    </div>
  );
}

function WorkerDashboard() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Profile
  const [profile, setProfile] = useState<WorkerProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Jobs
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);

  // Filters
  const [category, setCategory] = useState("All");
  const [payType, setPayType] = useState("all");
  const [search, setSearch] = useState("");

  // Applied jobs (persisted from backend)
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [applyingId, setApplyingId] = useState<string | null>(null);

  // Confirmation dialog
  const [confirmJob, setConfirmJob] = useState<Job | null>(null);
  const [applySuccess, setApplySuccess] = useState<string | null>(null);

  // ── Role guard: redirect non-workers to login ────────────
  useEffect(() => {
    if (!token || !user) {
      navigate("/login");
    } else if (user.role !== "worker") {
      navigate("/login");
    }
  }, [token, user, navigate]);

  // ── Fetch profile ────────────────────────────────────────
  useEffect(() => {
    if (!token || !user || user.role !== "worker") return;
    fetch("/api/worker/profile", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setProfile(data.profile))
      .catch(() => {})
      .finally(() => setLoadingProfile(false));
  }, [token]);

  // ── Fetch applied job IDs ────────────────────────────────
  useEffect(() => {
    if (!token) return;
    fetch("/api/worker/applied-ids", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.appliedJobIds) {
          setAppliedIds(new Set(data.appliedJobIds));
        }
      })
      .catch(() => {});
  }, [token]);

  // ── Fetch jobs ───────────────────────────────────────────
  const fetchJobs = useCallback(async () => {
    setLoadingJobs(true);
    try {
      const params = new URLSearchParams();
      if (category !== "All") params.set("category", category);
      if (payType !== "all") params.set("payType", payType);
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/jobs?${params.toString()}`);
      const data = await res.json();
      setJobs(data.jobs ?? []);
    } catch {
      setJobs([]);
    } finally {
      setLoadingJobs(false);
    }
  }, [category, payType, search]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // ── Handlers ─────────────────────────────────────────────
  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleApply = async (job: Job) => {
    setApplyingId(job._id);
    try {
      const res = await fetch(`/api/jobs/${job._id}/apply`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to apply");
        return;
      }

      setAppliedIds((prev) => new Set(prev).add(job._id));
      setConfirmJob(null);
      setApplySuccess(job.title);
      setTimeout(() => setApplySuccess(null), 4000);
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setApplyingId(null);
    }
  };

  const displayName = user?.name || user?.phone || "Worker";

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* ─── GREETING ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">
            {t("worker.dashboard.greeting", { name: displayName })}
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {t("worker.dashboard.subtitle")}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* My Applications link */}
          <Link
            to="/worker/applications"
            className="rounded-xl bg-blue-50 text-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-100 transition-colors"
          >
            {t("worker.dashboard.myApplications")}
          </Link>
          {/* Profile link */}
          <Link
            to="/worker/profile"
            className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            {t("worker.dashboard.profile")}
          </Link>
          {/* Completed jobs badge */}
          {!loadingProfile && profile && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-600 px-4 py-1.5 text-sm font-semibold">
              ✅ {t("worker.dashboard.jobsDone")}: {profile.completedJobs}
            </span>
          )}
          <button
            onClick={handleLogout}
            className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
          >
            {t("worker.dashboard.logout")}
          </button>
        </div>
      </div>

      {/* ─── PROFILE SUMMARY (collapsed) ──────────────────── */}
      {!loadingProfile && profile && (
        <div className="mb-6 bg-white shadow-md rounded-2xl p-4 flex flex-wrap items-center gap-3 text-sm">
          <span className="text-gray-500">{t("worker.dashboard.yourSkills")}:</span>
          {profile.skills.map((s) => (
            <span
              key={s}
              className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-0.5 text-emerald-700 font-medium"
            >
              {CATEGORY_ICONS[s] || "•"} {t(`skills.${s}`)}
            </span>
          ))}
          <span className="text-gray-400 ml-auto">
            📍 {profile.location} &middot; 🕐 {profile.availability}
          </span>
        </div>
      )}

      {/* ─── FILTERS ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Category */}
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
            {c === "All" ? t("worker.dashboard.allCategories") : `${CATEGORY_ICONS[c] || ""} ${t(`skills.${c}`)}`}
            </option>
          ))}
        </select>

        {/* Pay type */}
        <select
          value={payType}
          onChange={(e) => setPayType(e.target.value)}
          className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="all">{t("worker.dashboard.allPayTypes")}</option>
          <option value="per_day">{t("worker.dashboard.perDay")}</option>
          <option value="per_month">{t("worker.dashboard.perMonth")}</option>
        </select>

        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("worker.dashboard.searchPlaceholder")}
          className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* ─── JOB LIST ─────────────────────────────────────── */}
      {loadingJobs ? (
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-5xl mb-4">📭</p>
          <p className="text-xl font-semibold text-gray-600 mb-2">
            {t("worker.dashboard.noJobs")}
          </p>
          <p className="text-gray-400 text-sm">
            {t("worker.dashboard.noJobsHint")}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => {
            const applied = appliedIds.has(job._id);
            return (
              <div
                key={job._id}
                className="bg-white shadow-md rounded-2xl p-4 hover:shadow-lg transition-shadow"
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">
                      {job.title}
                    </h3>
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-0.5 text-xs font-medium text-gray-600 mt-1">
                      {CATEGORY_ICONS[job.category] || "📁"} {job.category}
                    </span>
                  </div>
                  <span className="shrink-0 text-right">
                    <span className="text-lg font-bold text-emerald-500">
                      ₹{job.payAmount.toLocaleString("en-IN")}
                    </span>
                    <span className="block text-xs text-gray-400">
                      {job.payType === "per_day" ? t("worker.dashboard.perDayLabel") : t("worker.dashboard.perMonthLabel")}
                    </span>
                  </span>
                </div>

                {/* Description */}
                {job.description && (
                  <p className="text-sm text-gray-500 mb-3 leading-relaxed">
                    {job.description}
                  </p>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">
                    📍 {job.location}
                  </span>
                  <button
                    onClick={() => setConfirmJob(job)}
                    disabled={applied}
                    className={`bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2.5 px-6 rounded-xl text-sm transition-colors ${
                      applied
                        ? "!bg-gray-100 !text-gray-400 cursor-default hover:!bg-gray-100"
                        : ""
                    }`}
                  >
                    {applied ? t("worker.dashboard.applied") : t("worker.dashboard.apply")}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {/* ─── SUCCESS TOAST ────────────────────────────────── */}
      {applySuccess && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white shadow-lg rounded-2xl px-6 py-4 border border-gray-100 flex items-center gap-3">
          <span className="text-2xl">🎉</span>
          <div>
            <p className="font-bold text-gray-800">{t("worker.dashboard.applySuccess")}</p>
            <p className="text-sm text-gray-400">
              {t("worker.dashboard.applySuccessHint", { title: applySuccess })}
            </p>
          </div>
        </div>
      )}

      {/* ─── CONFIRMATION DIALOG ──────────────────────────── */}
      {confirmJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md bg-white shadow-md rounded-2xl p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              {t("worker.dashboard.confirmTitle")}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {t("worker.dashboard.confirmMsg")}{" "}
              <span className="font-semibold text-gray-700">
                {confirmJob.title}
              </span>
              ?
            </p>
            <div className="rounded-xl bg-gray-50 p-3 mb-5 text-sm space-y-1">
              <p>
                <span className="text-gray-400">{t("worker.dashboard.confirmCategory")}</span>{" "}
                {CATEGORY_ICONS[confirmJob.category] || "📁"}{" "}
                {confirmJob.category}
              </p>
              <p>
                <span className="text-gray-400">{t("worker.dashboard.confirmPay")}</span> ₹
                {confirmJob.payAmount.toLocaleString("en-IN")}{" "}
                {confirmJob.payType === "per_day" ? t("worker.dashboard.perDayLabel") : t("worker.dashboard.perMonthLabel")}
              </p>
              <p>
                <span className="text-gray-400">{t("worker.dashboard.confirmLocation")}</span> 📍{" "}
                {confirmJob.location}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmJob(null)}
                className="flex-1 rounded-xl border border-gray-300 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                {t("worker.dashboard.cancel")}
              </button>
              <button
                onClick={() => handleApply(confirmJob)}
                disabled={applyingId === confirmJob._id}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-colors disabled:opacity-50"
              >
                {applyingId === confirmJob._id
                  ? t("worker.dashboard.applying")
                  : t("worker.dashboard.yes")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WorkerDashboard;
