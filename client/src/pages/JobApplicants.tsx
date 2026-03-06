import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

// ── Types ───────────────────────────────────────────────────
interface WorkerInfo {
  _id: string;
  phone: string;
  name: string;
}

interface WorkerProfile {
  skills: string[];
  location: string;
  availability: string;
  completedJobs: number;
  goodRatings: number;
  badRatings: number;
}

interface Applicant {
  _id: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
  worker: WorkerInfo;
  profile: WorkerProfile | null;
}

interface JobInfo {
  _id: string;
  title: string;
  category: string;
  payAmount: number;
  payType: "per_day" | "per_month";
  location: string;
  status: string;
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  accepted: "bg-green-100 text-green-700 border-green-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "pending",
  accepted: "accepted",
  rejected: "rejected",
};

// ── Skeleton ────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-3">
      <div className="h-5 w-1/2 rounded bg-gray-200" />
      <div className="h-4 w-3/4 rounded bg-gray-200" />
      <div className="h-4 w-1/3 rounded bg-gray-100" />
      <div className="flex gap-2 pt-2">
        <div className="h-10 w-24 rounded-xl bg-gray-200" />
        <div className="h-10 w-24 rounded-xl bg-gray-200" />
      </div>
    </div>
  );
}

function JobApplicants() {
  const { jobId } = useParams<{ jobId: string }>();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [job, setJob] = useState<JobInfo | null>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Call modal
  const [callWorker, setCallWorker] = useState<WorkerInfo | null>(null);
  const [copied, setCopied] = useState(false);

  // Track in-flight status updates
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // ── Role guard ────────────────────────────────────────────
  useEffect(() => {
    if (!token || !user || user.role !== "employer") {
      navigate("/login");
    }
  }, [token, user, navigate]);

  // ── Fetch applicants ─────────────────────────────────────
  useEffect(() => {
    if (!token || !jobId) return;
    fetch(`/api/employer/jobs/${jobId}/applicants`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      })
      .then((data) => {
        setJob(data.job);
        setApplicants(data.applicants ?? []);
      })
      .catch(() => setError(t("employer.applicants.errorLoad")))
      .finally(() => setLoading(false));
  }, [token, jobId]);

  // ── Update application status ────────────────────────────
  const updateStatus = async (
    appId: string,
    newStatus: "accepted" | "rejected"
  ) => {
    setUpdatingId(appId);
    try {
      const res = await fetch(`/api/employer/applications/${appId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || t("common.error"));
        return;
      }
      // Update local state
      setApplicants((prev) =>
        prev.map((a) => (a._id === appId ? { ...a, status: newStatus } : a))
      );
    } catch {
      alert(t("common.error"));
    } finally {
      setUpdatingId(null);
    }
  };

  // ── Copy phone to clipboard ──────────────────────────────
  const handleCopy = (phone: string) => {
    navigator.clipboard.writeText(phone).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
        <div className="h-8 w-1/2 rounded bg-gray-200 animate-pulse mb-6" />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-5xl mb-4">😵</p>
        <p className="text-xl font-semibold text-gray-600 mb-2">{error}</p>
        <Link
          to="/employer/dashboard"
          className="inline-block mt-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2.5 px-6 rounded-xl transition-colors"
        >
          {t("employer.applicants.backToDashboard")}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* ─── HEADER ───────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">
            {t("employer.applicants.title")}
          </h1>
          {job && (
            <p className="text-gray-500 text-sm mt-1">
              {t("employer.applicants.forJob")}{" "}
              <span className="font-semibold text-gray-700">{job.title}</span>{" "}
              · 📍 {job.location} · ₹{job.payAmount.toLocaleString("en-IN")}{" "}
              {job.payType === "per_day" ? "/day" : "/month"}
            </p>
          )}
        </div>
        <Link
          to="/employer/dashboard"
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
        >
          {t("employer.applicants.back")}
        </Link>
      </div>

      {/* ─── APPLICANT LIST ───────────────────────────────── */}
      {applicants.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-5xl mb-4">📭</p>
          <p className="text-xl font-semibold text-gray-600 mb-2">
            {t("employer.applicants.noApplicants")}
          </p>
          <p className="text-gray-400 text-sm">
            {t("employer.applicants.noApplicantsHint")}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {applicants.map((app) => {
            const displayName =
              app.worker.name || app.worker.phone || "Unknown";
            const isUpdating = updatingId === app._id;

            return (
              <div
                key={app._id}
                className="bg-white shadow-md rounded-2xl p-4 hover:shadow-lg transition-shadow"
              >
                {/* Top row: name + status */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">
                      {displayName}
                    </h3>
                    <p className="text-sm text-gray-400 mt-0.5">
                      {t("employer.applicants.applied")}{" "}
                      {new Date(app.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <span
                    className={`rounded-full border px-4 py-1 text-sm font-semibold shrink-0 ${
                      STATUS_STYLES[app.status] || ""
                    }`}
                  >
                    {t(`employer.applicants.${STATUS_LABELS[app.status]}`) || app.status}
                  </span>
                </div>

                {/* Profile info */}
                {app.profile && (
                  <div className="rounded-xl bg-gray-50 p-3 mb-4 space-y-2 text-sm">
                    {/* Skills */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-gray-400 mr-1">{t("employer.applicants.skills")}</span>
                      {app.profile.skills.map((s) => (
                        <span
                          key={s}
                          className="rounded-full bg-white border border-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-700"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                    {/* Location + Availability */}
                    <div className="flex flex-wrap gap-4 text-gray-500">
                      <span>📍 {app.profile.location}</span>
                      <span>🕐 {app.profile.availability}</span>
                    </div>
                    {/* Stats */}
                    <div className="flex gap-4 text-gray-500">
                      <span>
                        ✅ {app.profile.completedJobs} {t("employer.applicants.jobsDone")}
                      </span>
                      <span>
                        👍 {app.profile.goodRatings}
                      </span>
                      <span>
                        👎 {app.profile.badRatings}
                      </span>
                    </div>
                  </div>
                )}

                {!app.profile && (
                  <p className="text-sm text-gray-400 italic mb-4">
                    {t("employer.applicants.noProfile")}
                  </p>
                )}

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2">
                  {/* Call button */}
                  <button
                    onClick={() => setCallWorker(app.worker)}
                    className="rounded-xl bg-blue-50 text-blue-600 px-5 py-2.5 text-sm font-semibold hover:bg-blue-100 transition-colors"
                  >
                    {t("employer.applicants.call")}
                  </button>

                  {/* Accept */}
                  {app.status !== "accepted" && (
                    <button
                      onClick={() => updateStatus(app._id, "accepted")}
                      disabled={isUpdating}
                      className="rounded-xl bg-green-50 text-green-600 px-5 py-2.5 text-sm font-semibold hover:bg-green-100 transition-colors disabled:opacity-50"
                    >
                      {isUpdating ? t("employer.dashboard.updating") : t("employer.applicants.accept")}
                    </button>
                  )}

                  {/* Reject */}
                  {app.status !== "rejected" && (
                    <button
                      onClick={() => updateStatus(app._id, "rejected")}
                      disabled={isUpdating}
                      className="rounded-xl bg-red-50 text-red-600 px-5 py-2.5 text-sm font-semibold hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      {isUpdating ? t("employer.dashboard.updating") : t("employer.applicants.reject")}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── CALL MODAL ───────────────────────────────────── */}
      {callWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm bg-white shadow-md rounded-2xl p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-1">
              {t("employer.applicants.callTitle")}
            </h3>
            <p className="text-sm text-gray-400 mb-5">
              {t("employer.applicants.callSubtitle", { name: callWorker.name || "Worker" })}
            </p>

            {/* Big phone display */}
            <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 text-center mb-5">
              <p className="text-2xl font-bold text-gray-800 tracking-wider">
                {callWorker.phone}
              </p>
            </div>

            <div className="flex gap-3">
              {/* tel: link */}
              <a
                href={`tel:${callWorker.phone}`}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-xl text-center text-sm transition-colors"
              >
                {t("employer.applicants.callNow")}
              </a>
              {/* Copy button */}
              <button
                onClick={() => handleCopy(callWorker.phone)}
                className="flex-1 rounded-xl border-2 border-emerald-500 py-3 text-sm font-bold text-emerald-600 hover:bg-emerald-50 transition-colors"
              >
                {copied ? t("employer.applicants.copied") : t("employer.applicants.copyNumber")}
              </button>
            </div>

            <button
              onClick={() => {
                setCallWorker(null);
                setCopied(false);
              }}
              className="w-full mt-3 rounded-xl border border-gray-300 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
            >
              {t("employer.applicants.close")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default JobApplicants;
