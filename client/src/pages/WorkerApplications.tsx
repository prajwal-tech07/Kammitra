import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

// ── Types ───────────────────────────────────────────────────
interface Job {
  _id: string;
  title: string;
  category: string;
  description: string;
  payAmount: number;
  payType: "per_day" | "per_month";
  location: string;
  status: string;
}

interface Application {
  _id: string;
  jobId: Job;
  status: "pending" | "accepted" | "rejected";
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
  pending:
    "bg-yellow-100 text-yellow-700 border-yellow-200",
  accepted:
    "bg-green-100 text-green-700 border-green-200",
  rejected:
    "bg-red-100 text-red-700 border-red-200",
};

function WorkerApplications() {
  const { token } = useAuth();
  const { t } = useTranslation();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch("/api/worker/applications", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setApplications(data.applications ?? []))
      .catch(() => setApplications([]))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">
            {t("worker.applications.title")}
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {t("worker.applications.subtitle")}
          </p>
        </div>
        <Link
          to="/worker/dashboard"
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
        >
          {t("worker.applications.backToJobs")}
        </Link>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse bg-white shadow-md rounded-2xl p-4 space-y-3"
            >
              <div className="h-5 w-3/4 rounded bg-gray-200" />
              <div className="h-4 w-1/3 rounded bg-gray-200" />
              <div className="h-4 w-1/2 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      ) : applications.length === 0 ? (
        /* Empty state */
        <div className="text-center py-16">
          <p className="text-5xl mb-4">📭</p>
          <p className="text-xl font-semibold text-gray-600 mb-2">
            {t("worker.applications.noApplications")}
          </p>
          <p className="text-gray-400 text-sm mb-6">
            {t("worker.applications.noApplicationsHint")}
          </p>
          <Link
            to="/worker/dashboard"
            className="inline-block bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2.5 px-6 rounded-xl text-sm transition-colors"
          >
            {t("worker.applications.browseJobs")}
          </Link>
        </div>
      ) : (
        /* Application list */
        <div className="space-y-4">
          {applications.map((app) => {
            const job = app.jobId;
            if (!job) return null; // job may have been deleted
            return (
              <div
                key={app._id}
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
                      {job.payType === "per_day" ? t("worker.applications.perDay") : t("worker.applications.perMonth")}
                    </span>
                  </span>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-3 text-sm text-gray-400">
                    <span>📍 {job.location}</span>
                    <span>
                      {t("worker.applications.applied")}{" "}
                      {new Date(app.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <span
                    className={`rounded-full border px-4 py-1 text-sm font-semibold ${
                      STATUS_STYLES[app.status] || ""
                    }`}
                  >
                    {t(`worker.applications.${app.status}`)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default WorkerApplications;
