import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

function Worker() {
  const { t } = useTranslation();
  return (
    <section className="flex flex-col items-center justify-center px-4 py-20 text-center">
      <h1 className="text-3xl sm:text-4xl font-extrabold mb-4 text-gray-900">
        {t("worker.landing.title")}
      </h1>
      <p className="text-gray-500 text-lg max-w-xl mb-8">
        {t("worker.landing.subtitle")}
      </p>
      <Link
        to="/login"
        className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2.5 px-8 rounded-xl text-lg transition-colors"
      >
        {t("worker.landing.cta")}
      </Link>
    </section>
  );
}

export default Worker;
