import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

// ── Types ───────────────────────────────────────────────────
interface EmployerJob {
  _id: string;
  title: string;
  category: string;
  payAmount: number;
  payType: "per_day" | "per_month";
  location: string;
  status: string;
  rated: boolean;
  applicationCount: number;
  createdAt: string;
}

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

const STATUS_STYLES: Record<string, string> = {
  open: "bg-green-100 text-green-700 border-green-200",
  filled: "bg-gray-100 text-gray-500 border-gray-200",
};

// ── Skeleton ────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="animate-pulse bg-white shadow-md rounded-2xl p-4 space-y-3">
      <div className="h-5 w-3/4 rounded bg-gray-200" />
      <div className="h-4 w-1/3 rounded bg-gray-200" />
      <div className="flex items-center justify-between pt-2">
        <div className="h-5 w-24 rounded bg-gray-200" />
        <div className="h-5 w-20 rounded bg-gray-200" />
      </div>
    </div>
  );
}

function EmployerDashboard() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [jobs, setJobs] = useState<EmployerJob[]>([]);
  const [loading, setLoading] = useState(true);

  // Fill & Rate state
  const [fillingId, setFillingId] = useState<string | null>(null);
  const [ratingJob, setRatingJob] = useState<EmployerJob | null>(null);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // ── Role guard ────────────────────────────────────────────
  useEffect(() => {
    if (!token || !user) {
      navigate("/login");
    } else if (user.role !== "employer") {
      navigate("/login");
    }
  }, [token, user, navigate]);

  // ── Fetch employer's jobs ────────────────────────────────
  useEffect(() => {
    if (!token || !user || user.role !== "employer") return;
    fetch("/api/employer/jobs", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error("Unauthorized");
        return r.json();
      })
      .then((data) => setJobs(data.jobs ?? []))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, [token, user]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // ── Mark as Filled ────────────────────────────────────────
  const handleFill = async (job: EmployerJob) => {
    setFillingId(job._id);
    try {
      const res = await fetch(`/api/employer/jobs/${job._id}/fill`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || t("common.error"));
        return;
      }
      // Update local state
      setJobs((prev) =>
        prev.map((j) => (j._id === job._id ? { ...j, status: "filled" } : j))
      );
      // Open rating modal
      setRatingJob({ ...job, status: "filled" });
    } catch {
      alert(t("common.error"));
    } finally {
      setFillingId(null);
    }
  };

  // ── Rate Worker ───────────────────────────────────────────
  const handleRate = async (rating: "good" | "bad") => {
    if (!ratingJob) return;
    setRatingLoading(true);
    try {
      const res = await fetch(`/api/employer/jobs/${ratingJob._id}/rate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rating }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || t("common.error"));
        return;
      }
      // Update local state
      setJobs((prev) =>
        prev.map((j) =>
          j._id === ratingJob._id ? { ...j, status: "filled", rated: true } : j
        )
      );
      setRatingJob(null);
      setToast(
        rating === "good"
          ? t("employer.dashboard.ratingGoodToast")
          : t("employer.dashboard.ratingBadToast")
      );
      setTimeout(() => setToast(null), 3500);
    } catch {
      alert(t("common.error"));
    } finally {
      setRatingLoading(false);
    }
  };

  const displayName = user?.name || user?.phone || "Employer";

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* ─── HEADER ───────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            {t("employer.dashboard.welcome", { name: displayName })}
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {t("employer.dashboard.subtitle")}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to="/employer/post-job"
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-colors"
          >
            {t("employer.dashboard.postJob")}
          </Link>
          <Link
            to="/employer/profile"
            className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            {t("employer.dashboard.profile")}
          </Link>
          <button
            onClick={handleLogout}
            className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
          >
            {t("employer.dashboard.logout")}
          </button>
        </div>
      </div>

      {/* ─── STATS BAR ────────────────────────────────────── */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="bg-white shadow-md rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-emerald-500">{jobs.length}</p>
          <p className="text-xs text-gray-400 mt-1">{t("employer.dashboard.totalJobs")}</p>
        </div>
        <div className="bg-white shadow-md rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-green-600">
            {jobs.filter((j) => j.status === "open").length}
          </p>
          <p className="text-xs text-gray-400 mt-1">{t("employer.dashboard.open")}</p>
        </div>
        <div className="bg-white shadow-md rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-blue-500">
            {jobs.reduce((sum, j) => sum + j.applicationCount, 0)}
          </p>
          <p className="text-xs text-gray-400 mt-1">{t("employer.dashboard.applications")}</p>
        </div>
      </div>

      {/* ─── JOB LIST ─────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-5xl mb-4">📋</p>
          <p className="text-xl font-semibold text-gray-600 mb-2">
            {t("employer.dashboard.noJobs")}
          </p>
          <p className="text-gray-400 text-sm mb-6">
            {t("employer.dashboard.noJobsHint")}
          </p>
          <Link
            to="/employer/post-job"
            className="inline-block bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2.5 px-6 rounded-xl text-lg transition-colors"
          >
            {t("employer.dashboard.postFirstJob")}
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
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
                    {job.payType === "per_day" ? t("employer.dashboard.perDay") : t("employer.dashboard.perMonth")}
                  </span>
                </span>
              </div>

              {/* Footer */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-3">
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span>📍 {job.location}</span>
                  <span>
                    {new Date(job.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {/* View Applicants */}
                  <Link
                    to={`/employer/jobs/${job._id}/applicants`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 text-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-100 transition-colors"
                  >
                    📩 {job.applicationCount}{" "}
                    {job.applicationCount === 1 ? t("employer.dashboard.applicant") : t("employer.dashboard.applicants")}
                  </Link>

                  {/* Mark as Filled — only for open jobs */}
                  {job.status === "open" && (
                    <button
                      onClick={() => handleFill(job)}
                      disabled={fillingId === job._id}
                      className="rounded-xl bg-amber-50 text-amber-700 px-4 py-2 text-sm font-semibold hover:bg-amber-100 transition-colors disabled:opacity-50"
                    >
                      {fillingId === job._id
                        ? t("employer.dashboard.updating")
                        : t("employer.dashboard.markFilled")}
                    </button>
                  )}

                  {/* Rated badge */}
                  {job.status === "filled" && job.rated && (
                    <span className="rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 px-3 py-1 text-xs font-semibold">
                      {t("employer.dashboard.rated")}
                    </span>
                  )}

                  {/* Rate button — filled but not yet rated */}
                  {job.status === "filled" && !job.rated && (
                    <button
                      onClick={() => setRatingJob(job)}
                      className="rounded-xl bg-purple-50 text-purple-600 px-4 py-2 text-sm font-semibold hover:bg-purple-100 transition-colors"
                    >
                      {t("employer.dashboard.rateWorker")}
                    </button>
                  )}

                  {/* Status badge */}
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${
                      STATUS_STYLES[job.status] || ""
                    }`}
                  >
                    {job.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── RATING MODAL ─────────────────────────────────── */}
      {ratingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm bg-white shadow-md rounded-2xl p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-1 text-center">
              {t("employer.dashboard.ratingTitle")}
            </h3>
            <p className="text-sm text-gray-400 mb-6 text-center">
              {t("employer.dashboard.ratingFor")} <span className="font-semibold text-gray-600">{ratingJob.title}</span>
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => handleRate("good")}
                disabled={ratingLoading}
                className="flex-1 flex flex-col items-center gap-2 bg-white shadow-md rounded-2xl p-4 border-2 border-green-200 hover:border-green-400 hover:bg-green-50 transition-all disabled:opacity-50"
              >
                <span className="text-5xl">👍</span>
                <span className="text-base font-bold text-green-700">{t("employer.dashboard.good")}</span>
              </button>
              <button
                onClick={() => handleRate("bad")}
                disabled={ratingLoading}
                className="flex-1 flex flex-col items-center gap-2 bg-white shadow-md rounded-2xl p-4 border-2 border-red-200 hover:border-red-400 hover:bg-red-50 transition-all disabled:opacity-50"
              >
                <span className="text-5xl">👎</span>
                <span className="text-base font-bold text-red-600">{t("employer.dashboard.notGood")}</span>
              </button>
            </div>

            <button
              onClick={() => setRatingJob(null)}
              disabled={ratingLoading}
              className="w-full mt-4 rounded-xl border border-gray-300 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
            >
              {t("employer.dashboard.skipRating")}
            </button>
          </div>
        </div>
      )}

      {/* ─── TOAST ────────────────────────────────────────── */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white shadow-lg rounded-2xl px-6 py-4 border border-gray-100 flex items-center gap-3">
          <span className="text-base font-semibold text-gray-700">{toast}</span>
        </div>
      )}
    </div>
  );
}

export default EmployerDashboard;
