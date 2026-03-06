import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"worker" | "employer">("worker");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!/^\d{10}$/.test(phone)) {
      setError(t("login.errorInvalidPhone"));
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/auth/phone-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t("login.errorGeneric"));
        return;
      }

      login(data.user, data.token);

      if (role === "worker") {
        navigate(data.user.profileComplete ? "/worker/dashboard" : "/worker/setup");
      } else {
        navigate("/employer/dashboard");
      }
    } catch {
      setError(t("login.errorServer"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="flex flex-col items-center justify-center px-4 py-20">
      <div className="w-full max-w-md bg-white shadow-md rounded-2xl p-8">
        <h2 className="text-2xl font-bold text-center mb-1 text-gray-900">
          {t("login.title")}
        </h2>
        <p className="text-gray-400 text-center mb-8">
          {t("login.subtitle")}
        </p>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("login.phoneLabel")}
            </label>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
                setError("");
              }}
              placeholder={t("login.phonePlaceholder")}
              className={`w-full rounded-xl border px-4 py-3 text-base focus:outline-none focus:ring-2 ${
                error
                  ? "border-red-400 focus:ring-red-400"
                  : "border-gray-300 focus:ring-emerald-500"
              }`}
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("login.roleLabel")}
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "worker" | "employer")}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="worker">{t("login.workerOption")}</option>
              <option value="employer">{t("login.employerOption")}</option>
            </select>
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
            {loading ? t("login.submitting") : t("login.submit")}
          </button>
        </form>
      </div>
    </section>
  );
}

export default Login;
