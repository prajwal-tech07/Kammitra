import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

// ── Types ───────────────────────────────────────────────────
interface ProfileData {
  skills: string[];
  availability: string;
  location: string;
  completedJobs: number;
  goodRatings: number;
  badRatings: number;
}

interface UserData {
  _id: string;
  phone: string;
  name: string;
  role: string;
  createdAt: string;
}

const SKILL_COLORS: Record<string, string> = {
  Cleaning: "bg-sky-100 text-sky-700",
  "Shop Work": "bg-orange-100 text-orange-700",
  Construction: "bg-amber-100 text-amber-700",
  Plumbing: "bg-teal-100 text-teal-700",
  Electrical: "bg-yellow-100 text-yellow-700",
  Driving: "bg-indigo-100 text-indigo-700",
  Cooking: "bg-rose-100 text-rose-700",
  Babysitting: "bg-pink-100 text-pink-700",
};

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

function maskPhone(phone: string): string {
  if (!phone || phone.length < 10) return phone;
  return phone.slice(0, 2) + "*****" + phone.slice(7);
}

function WorkerProfile() {
  const { user: authUser, token } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [userData, setUserData] = useState<UserData | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [totalApplications, setTotalApplications] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ── Role guard ────────────────────────────────────────────
  useEffect(() => {
    if (!token || !authUser || authUser.role !== "worker") {
      navigate("/login");
    }
  }, [token, authUser, navigate]);

  // ── Fetch full profile ────────────────────────────────────
  useEffect(() => {
    if (!token || !authUser || authUser.role !== "worker") return;
    fetch("/api/worker/full-profile", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error("Failed");
        return r.json();
      })
      .then((data) => {
        setUserData(data.user);
        setProfile(data.profile);
        setTotalApplications(data.totalApplications ?? 0);
      })
      .catch(() => setError(t("worker.profilePage.errorLoad")))
      .finally(() => setLoading(false));
  }, [token, authUser]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-1/2 rounded bg-gray-200" />
          <div className="bg-white shadow-md rounded-2xl p-6 space-y-4">
            <div className="h-6 w-3/4 rounded bg-gray-200" />
            <div className="h-4 w-1/2 rounded bg-gray-200" />
            <div className="h-4 w-1/3 rounded bg-gray-200" />
            <div className="flex gap-2">
              <div className="h-8 w-20 rounded-full bg-gray-200" />
              <div className="h-8 w-20 rounded-full bg-gray-200" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-5xl mb-4">😵</p>
        <p className="text-xl font-semibold text-gray-600 mb-2">{error}</p>
        <Link
          to="/worker/dashboard"
          className="inline-block mt-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2.5 px-6 rounded-xl transition-colors"
        >
          {t("worker.profilePage.backToDashboard")}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* ─── HEADER ───────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
          {t("worker.profilePage.title")}
        </h1>
        <Link
          to="/worker/dashboard"
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
        >
          {t("worker.profilePage.back")}
        </Link>
      </div>

      {/* ─── PROFILE CARD ─────────────────────────────────── */}
      <div className="bg-white shadow-md rounded-2xl p-6 space-y-6">
        {/* Name & Phone */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-3xl shrink-0">
            👷
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {userData?.name || "Worker"}
            </h2>
            <p className="text-gray-400 text-sm mt-0.5">
              📱 {maskPhone(userData?.phone || "")}
            </p>
            {profile?.location && (
              <p className="text-gray-400 text-sm mt-0.5">
                📍 {profile.location}
              </p>
            )}
          </div>
        </div>

        {/* Divider */}
        <hr className="border-gray-100" />

        {/* Skills */}
        {profile && profile.skills.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              {t("worker.profilePage.skills")}
            </h3>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <span
                  key={skill}
                  className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold ${
                    SKILL_COLORS[skill] || "bg-gray-100 text-gray-700"
                  }`}
                >
                  {CATEGORY_ICONS[skill] || "•"} {t(`skills.${skill}`)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Availability */}
        {profile?.availability && (
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
              {t("worker.profilePage.availability")}
            </h3>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 text-blue-700 px-4 py-1.5 text-sm font-semibold">
              🕐 {profile.availability}
            </span>
          </div>
        )}

        {/* Divider */}
        <hr className="border-gray-100" />

        {/* Stats */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Stats
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-emerald-500">
                {profile?.completedJobs ?? 0}
              </p>
              <p className="text-xs text-gray-400 mt-1">{t("worker.profilePage.jobsDone")}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-green-600">
                {profile?.goodRatings ?? 0}
              </p>
              <p className="text-xs text-gray-400 mt-1">{t("worker.profilePage.good")}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-red-500">
                {profile?.badRatings ?? 0}
              </p>
              <p className="text-xs text-gray-400 mt-1">{t("worker.profilePage.bad")}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-blue-500">
                {totalApplications}
              </p>
              <p className="text-xs text-gray-400 mt-1">{t("worker.profilePage.applied")}</p>
            </div>
          </div>
        </div>

        {/* Member since */}
        {userData?.createdAt && (
          <p className="text-xs text-gray-400 text-center pt-2">
            {t("worker.profilePage.memberSince")}{" "}
            {new Date(userData.createdAt).toLocaleDateString("en-IN", {
              month: "long",
              year: "numeric",
            })}
          </p>
        )}
      </div>

      {/* ── Quick links ──────────────────────────────────────── */}
      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <Link
          to="/worker/applications"
          className="flex-1 text-center bg-blue-50 text-blue-600 font-semibold py-3 px-4 rounded-xl hover:bg-blue-100 transition-colors"
        >
          {t("worker.profilePage.myApplications")}
        </Link>
        <Link
          to="/worker/setup"
          className="flex-1 text-center bg-gray-50 text-gray-600 font-semibold py-3 px-4 rounded-xl hover:bg-gray-100 transition-colors"
        >
          {t("worker.profilePage.editProfile")}
        </Link>
      </div>
    </div>
  );
}

export default WorkerProfile;
