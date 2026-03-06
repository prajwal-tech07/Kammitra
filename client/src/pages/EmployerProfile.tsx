import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

// ── Types ───────────────────────────────────────────────────
interface UserData {
  _id: string;
  phone: string;
  name: string;
  role: string;
  createdAt: string;
}

interface Stats {
  totalJobs: number;
  openJobs: number;
  filledJobs: number;
  totalApplications: number;
}

function maskPhone(phone: string): string {
  if (!phone || phone.length < 10) return phone;
  return phone.slice(0, 2) + "*****" + phone.slice(7);
}

function EmployerProfile() {
  const { user: authUser, token } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [userData, setUserData] = useState<UserData | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ── Role guard ────────────────────────────────────────────
  useEffect(() => {
    if (!token || !authUser || authUser.role !== "employer") {
      navigate("/login");
    }
  }, [token, authUser, navigate]);

  // ── Fetch profile ─────────────────────────────────────────
  useEffect(() => {
    if (!token || !authUser || authUser.role !== "employer") return;
    fetch("/api/employer/profile", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error("Failed");
        return r.json();
      })
      .then((data) => {
        setUserData(data.user);
        setStats(data.stats);
      })
      .catch(() => setError(t("employer.profilePage.errorLoad")))
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
          to="/employer/dashboard"
          className="inline-block mt-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2.5 px-6 rounded-xl transition-colors"
        >
          {t("employer.profilePage.backToDashboard")}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* ─── HEADER ───────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
          {t("employer.profilePage.title")}
        </h1>
        <Link
          to="/employer/dashboard"
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
        >
          {t("employer.profilePage.back")}
        </Link>
      </div>

      {/* ─── PROFILE CARD ─────────────────────────────────── */}
      <div className="bg-white shadow-md rounded-2xl p-6 space-y-6">
        {/* Avatar & Info */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-3xl shrink-0">
            🏢
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {userData?.name || "Employer"}
            </h2>
            <p className="text-gray-400 text-sm mt-0.5">
              📱 {maskPhone(userData?.phone || "")}
            </p>
            <p className="text-gray-400 text-sm mt-0.5">
              {t("employer.profilePage.role")} <span className="capitalize font-medium text-gray-600">{userData?.role}</span>
            </p>
          </div>
        </div>

        {/* Divider */}
        <hr className="border-gray-100" />

        {/* Stats */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            {t("employer.profilePage.activity")}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-emerald-500">
                {stats?.totalJobs ?? 0}
              </p>
              <p className="text-xs text-gray-400 mt-1">{t("employer.profilePage.jobsPosted")}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-green-600">
                {stats?.openJobs ?? 0}
              </p>
              <p className="text-xs text-gray-400 mt-1">{t("employer.profilePage.openJobs")}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-gray-500">
                {stats?.filledJobs ?? 0}
              </p>
              <p className="text-xs text-gray-400 mt-1">{t("employer.profilePage.filled")}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-blue-500">
                {stats?.totalApplications ?? 0}
              </p>
              <p className="text-xs text-gray-400 mt-1">{t("employer.profilePage.applications")}</p>
            </div>
          </div>
        </div>

        {/* Member since */}
        {userData?.createdAt && (
          <p className="text-xs text-gray-400 text-center pt-2">
            {t("employer.profilePage.memberSince")}{" "}
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
          to="/employer/post-job"
          className="flex-1 text-center bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
        >
          {t("employer.profilePage.postAJob")}
        </Link>
        <Link
          to="/employer/dashboard"
          className="flex-1 text-center bg-gray-50 text-gray-600 font-semibold py-3 px-4 rounded-xl hover:bg-gray-100 transition-colors"
        >
          {t("employer.profilePage.viewDashboard")}
        </Link>
      </div>
    </div>
  );
}

export default EmployerProfile;
