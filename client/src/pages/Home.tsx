import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

function Home() {
  const { t } = useTranslation();

  return (
    <section className="flex flex-col items-center justify-center text-center px-4 py-20 sm:py-32">
      {/* Hero */}
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight max-w-3xl text-gray-900">
        {t("home.title")}{" "}
        <span className="text-emerald-500">{t("home.titleHighlight")}</span>
      </h1>

      <p className="mt-6 text-lg sm:text-xl text-gray-500 max-w-2xl leading-relaxed">
        {t("home.subtitle")}
        <br className="hidden sm:block" />
        {t("home.subtitleLine2")}
      </p>

      {/* CTA Buttons */}
      <div className="mt-10 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
        <Link
          to="/worker"
          className="w-full sm:w-auto inline-flex items-center justify-center bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-4 px-10 rounded-xl text-lg shadow-lg transition-colors"
        >
          {t("home.workerCta")}
        </Link>
        <Link
          to="/employer"
          className="w-full sm:w-auto inline-flex items-center justify-center border-2 border-emerald-500 text-emerald-600 font-semibold py-4 px-10 rounded-xl text-lg shadow-lg hover:bg-emerald-500 hover:text-white transition-colors"
        >
          {t("home.employerCta")}
        </Link>
      </div>

      {/* Trust badges */}
      <div className="mt-16 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
        <span>{t("home.badge1")}</span>
        <span>{t("home.badge2")}</span>
        <span>{t("home.badge3")}</span>
        <span>{t("home.badge4")}</span>
      </div>
    </section>
  );
}

export default Home;
