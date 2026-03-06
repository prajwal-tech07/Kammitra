import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./en.json";
import hi from "./hi.json";
import kn from "./kn.json";
import ta from "./ta.json";
import te from "./te.json";

const LANG_KEY = "km_lang";

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hi: { translation: hi },
    kn: { translation: kn },
    ta: { translation: ta },
    te: { translation: te },
  },
  lng: localStorage.getItem(LANG_KEY) || "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

// Persist language choice
i18n.on("languageChanged", (lng: string) => {
  localStorage.setItem(LANG_KEY, lng);
});

export default i18n;
