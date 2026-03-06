import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

// ── Constants ───────────────────────────────────────────────
const CATEGORIES = [
  "Cleaning",
  "Shop Work",
  "Construction",
  "Plumbing",
  "Electrical",
  "Driving",
  "Cooking",
  "Babysitting",
] as const;

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

// Default title suggestions per category
const DEFAULT_TITLES: Record<string, string> = {
  Cleaning: "House Cleaning Helper Needed",
  "Shop Work": "Shop Assistant Required",
  Construction: "Construction Site Worker Needed",
  Plumbing: "Plumber Required for Repair Work",
  Electrical: "Electrician Needed for Wiring",
  Driving: "Driver Required",
  Cooking: "Cook Needed for Daily Meals",
  Babysitting: "Babysitter / Nanny Required",
};

function PostJob() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [payType, setPayType] = useState<"per_day" | "per_month">("per_day");
  const [location, setLocation] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ── Role guard ────────────────────────────────────────────
  useEffect(() => {
    if (!token || !user || user.role !== "employer") {
      navigate("/login");
    }
  }, [token, user, navigate]);

  // Auto-suggest title when category changes
  const handleCategoryChange = (value: string) => {
    setCategory(value);
    // Only auto-fill if title is empty or is a previous default
    const isDefault = Object.values(DEFAULT_TITLES).includes(title);
    if (!title || isDefault) {
      setTitle(DEFAULT_TITLES[value] || "");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // ── Client-side validation ──────────────────────────────
    if (!category) {
      setError(t("employer.postJob.errorNoCategory"));
      return;
    }
    if (!title.trim() || title.trim().length < 2) {
      setError(t("employer.postJob.errorNoTitle"));
      return;
    }
    if (!payAmount || Number(payAmount) <= 0) {
      setError(t("employer.postJob.errorNoPay"));
      return;
    }
    if (!location.trim() || location.trim().length < 2) {
      setError(t("employer.postJob.errorNoLocation"));
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/employer/jobs", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category,
          title: title.trim(),
          description: description.trim(),
          payAmount: Number(payAmount),
          payType,
          location: location.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t("employer.postJob.errorGeneric"));
        return;
      }

      // Success → go back to dashboard
      navigate("/employer/dashboard");
    } catch {
      setError(t("employer.postJob.errorServer"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">
            {t("employer.postJob.title")}
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {t("employer.postJob.subtitle")}
          </p>
        </div>
        <Link
          to="/employer/dashboard"
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
        >
          {t("employer.postJob.back")}
        </Link>
      </div>

      {/* Form Card */}
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-md rounded-2xl p-6 sm:p-8 space-y-6"
      >
        {/* Category */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t("employer.postJob.categoryLabel")}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => handleCategoryChange(cat)}
                className={`rounded-xl border-2 px-3 py-3 text-sm font-medium transition-all text-left ${
                  category === cat
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                <span className="text-lg">{CATEGORY_ICONS[cat]}</span>
                <span className="block mt-1">{t(`skills.${cat}`)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            {t("employer.postJob.titleLabel")}
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("employer.postJob.titlePlaceholder")}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            {t("employer.postJob.descriptionLabel")}{" "}
            <span className="text-gray-400 font-normal">{t("employer.postJob.descriptionOptional")}</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder={t("employer.postJob.descriptionPlaceholder")}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Pay — Amount & Type side by side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              {t("employer.postJob.payAmountLabel")}
            </label>
            <input
              type="number"
              inputMode="numeric"
              min="1"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              placeholder={t("employer.postJob.payAmountPlaceholder")}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              {t("employer.postJob.payTypeLabel")}
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPayType("per_day")}
                className={`flex-1 rounded-xl border-2 py-3 text-sm font-medium transition-all ${
                  payType === "per_day"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                💰 {t("employer.postJob.perDay")}
              </button>
              <button
                type="button"
                onClick={() => setPayType("per_month")}
                className={`flex-1 rounded-xl border-2 py-3 text-sm font-medium transition-all ${
                  payType === "per_month"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                📅 {t("employer.postJob.perMonth")}
              </button>
            </div>
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            {t("employer.postJob.locationLabel")}
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder={t("employer.postJob.locationPlaceholder")}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Error */}
        {error && (
          <p className="text-red-500 text-sm font-medium text-center">
            {error}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2.5 px-4 rounded-xl text-lg transition-colors disabled:opacity-50"
        >
          {loading ? t("employer.postJob.submitting") : t("employer.postJob.submit")}
        </button>
      </form>
    </div>
  );
}

export default PostJob;
