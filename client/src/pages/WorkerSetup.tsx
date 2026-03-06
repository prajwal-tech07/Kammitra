import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";

// ── Skill options with emoji icons ─────────────────────────
const SKILLS = [
  { label: "Cleaning", icon: "🧹" },
  { label: "Shop Work", icon: "🏪" },
  { label: "Construction", icon: "🏗️" },
  { label: "Plumbing", icon: "🔧" },
  { label: "Electrical", icon: "⚡" },
  { label: "Driving", icon: "🚗" },
  { label: "Cooking", icon: "🍳" },
  { label: "Babysitting", icon: "👶" },
] as const;

const AVAILABILITY_KEYS = [
  { value: "Morning", key: "worker.setup.morning" },
  { value: "Evening", key: "worker.setup.evening" },
  { value: "Full Day", key: "worker.setup.fullDay" },
] as const;

function WorkerSetup() {
  const { token, updateUser } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // ── Step state ───────────────────────────────────────────
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1 fields
  const [name, setName] = useState("");
  const [skills, setSkills] = useState<string[]>([]);

  // Step 2 fields
  const [availability, setAvailability] = useState("");
  const [location, setLocation] = useState("");

  // UI state
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ── Skill toggle ─────────────────────────────────────────
  const toggleSkill = (skill: string) => {
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
    setError("");
  };

  // ── Step 1 → Step 2 ─────────────────────────────────────
  const goToStep2 = () => {
    if (skills.length === 0) {
      setError(t("worker.setup.errorNoSkill"));
      return;
    }
    setError("");
    setStep(2);
  };

  // ── Submit to backend ────────────────────────────────────
  const handleSubmit = async () => {
    if (!availability) {
      setError(t("worker.setup.errorNoAvailability"));
      return;
    }
    if (!location.trim() || location.trim().length < 2) {
      setError(t("worker.setup.errorNoLocation"));
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/worker/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ skills, availability, location: location.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t("worker.setup.errorGeneric"));
        return;
      }

      // Also update user name on the User model (optional enhancement)
      if (name.trim()) {
        await fetch("/api/auth/update-name", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name: name.trim() }),
        });
      }

      updateUser({ profileComplete: true, name: name.trim() });
      navigate("/worker/dashboard");
    } catch {
      setError(t("worker.setup.errorServer"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="flex flex-col items-center px-4 py-12">
      {/* Progress indicator */}
      <div className="flex items-center gap-2 mb-8">
        <div
          className={`h-2 w-16 rounded-full ${
            step >= 1 ? "bg-emerald-500" : "bg-gray-200"
          }`}
        />
        <div
          className={`h-2 w-16 rounded-full ${
            step >= 2 ? "bg-emerald-500" : "bg-gray-200"
          }`}
        />
      </div>

      <div className="w-full max-w-lg">
        {/* ─── STEP 1 ─────────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-center">
              {t("worker.setup.step1Title")}
            </h2>
            <p className="text-gray-400 text-center text-base">
              {t("worker.setup.step1Subtitle")}
            </p>

            {/* Name (optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("worker.setup.nameLabel")} <span className="text-gray-400">{t("worker.setup.nameOptional")}</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("worker.setup.namePlaceholder")}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Skills multi-select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("worker.setup.skillsLabel")} <span className="text-red-400">{t("common.required")}</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {SKILLS.map(({ label, icon }) => {
                  const selected = skills.includes(label);
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => toggleSkill(label)}
                      className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left text-base font-medium transition-colors ${
                        selected
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      <span className="text-2xl">{icon}</span>
                      <span>{t(`skills.${label}`)}</span>
                      {selected && <span className="ml-auto text-emerald-600">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="text-red-500 text-sm font-medium text-center">
                {error}
              </p>
            )}

            {/* Next */}
            <button
              onClick={goToStep2}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2.5 px-4 rounded-xl text-lg transition-colors"
            >
              {t("worker.setup.next")}
            </button>
          </div>
        )}

        {/* ─── STEP 2 ─────────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-center">
              {t("worker.setup.step2Title")}
            </h2>
            <p className="text-gray-400 text-center text-base">
              {t("worker.setup.step2Subtitle")}
            </p>

            {/* Availability */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("worker.setup.availabilityLabel")} <span className="text-red-400">{t("common.required")}</span>
              </label>
              <div className="flex flex-col gap-3">
                {AVAILABILITY_KEYS.map(({ value, key }) => (
                  <label
                    key={value}
                    className={`flex items-center gap-3 rounded-xl border-2 px-5 py-4 text-base font-medium cursor-pointer transition-colors ${
                      availability === value
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="availability"
                      value={value}
                      checked={availability === value}
                      onChange={() => {
                        setAvailability(value);
                        setError("");
                      }}
                      className="accent-emerald-500 h-5 w-5"
                    />
                    <span>{t(key)}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("worker.setup.locationLabel")} <span className="text-red-400">{t("common.required")}</span>
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  setError("");
                }}
                placeholder={t("worker.setup.locationPlaceholder")}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Error */}
            {error && (
              <p className="text-red-500 text-sm font-medium text-center">
                {error}
              </p>
            )}

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setStep(1);
                  setError("");
                }}
                className="flex-1 rounded-xl border-2 border-gray-300 py-3 text-base font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                {t("worker.setup.back")}
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2.5 px-4 rounded-xl text-lg transition-colors disabled:opacity-50"
              >
                {loading ? t("worker.setup.submitting") : t("worker.setup.submit")}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default WorkerSetup;
