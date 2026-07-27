(() => {
  const catalog = window.Ricky PopcornPageTranslations;
  if (!catalog) return;
  const translations = Object.fromEntries(
    Object.entries(catalog.locales).map(([locale, values]) => [
      locale,
      Object.fromEntries(catalog.sources.map((source, index) => [source, values[index]]))
    ])
  );

  const languages = [
    ["en", "English"],
    ["uk", "Українська"],
    ["de", "Deutsch"],
    ["fr", "Français"],
    ["it", "Italiano"],
    ["es", "Español"],
    ["pl", "Polski"],
    ["hu", "Magyar"],
    ["pt-BR", "Português (Brasil)"],
    ["zh-Hans", "简体中文"],
    ["ja", "日本語"],
    ["ko", "한국어"],
    ["tr", "Türkçe"],
    ["ar", "العربية"],
    ["id", "Bahasa Indonesia"],
    ["vi", "Tiếng Việt"],
    ["hi", "हिन्दी"]
  ];
  const languageLabels = {
    en: "Website language",
    uk: "Мова сайту",
    de: "Website-Sprache",
    fr: "Langue du site",
    it: "Lingua del sito",
    es: "Idioma del sitio",
    pl: "Język strony",
    hu: "A webhely nyelve",
    "pt-BR": "Idioma do site",
    "zh-Hans": "网站语言",
    ja: "サイトの言語",
    ko: "사이트 언어",
    tr: "Site dili",
    ar: "لغة الموقع",
    id: "Bahasa situs",
    vi: "Ngôn ngữ trang web",
    hi: "वेबसाइट की भाषा"
  };
  const supported = languages.map(([code]) => code);
  const aliases = { pt: "pt-BR", zh: "zh-Hans" };
  const storageKey = "ricky-popcorn-language";

  function normalize(value) {
    if (!value) return null;
    if (supported.includes(value)) return value;
    const prefix = value.split("-")[0];
    return aliases[prefix] || supported.find((code) => code.split("-")[0] === prefix) || null;
  }

  const control = document.querySelector("[data-language-control]");
  const select = document.querySelector("[data-language-select]");
  if (!control || !select) return;

  select.replaceChildren(...languages.map(([code, name]) => {
    const option = document.createElement("option");
    option.value = code;
    option.textContent = name;
    return option;
  }));

  const textRecords = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let textNode;
  while ((textNode = walker.nextNode())) {
    if (textNode.parentElement?.closest("[data-language-control], script, style")) continue;
    const original = textNode.nodeValue.trim();
    if (original) textRecords.push({ node: textNode, original });
  }

  const attributeRecords = [];
  document.querySelectorAll("[aria-label], [alt]").forEach((element) => {
    ["aria-label", "alt"].forEach((name) => {
      const original = element.getAttribute(name)?.trim();
      if (original) attributeRecords.push({ element, name, original });
    });
  });

  const metaRecords = [...document.querySelectorAll('meta[name="description"], meta[property="og:title"], meta[property="og:description"]')]
    .map((element) => ({ element, original: element.content }));
  const originalTitle = document.title;
  const params = new URLSearchParams(location.search);
  const requested = normalize(params.get("lang"));
  const saved = normalize(
    localStorage.getItem(storageKey) ||
    localStorage.getItem("ricky-popcorn-support-language")
  );
  const preferred = navigator.languages?.map(normalize).find(Boolean);
  const initial = requested || saved || preferred || "en";

  function translated(strings, original) {
    return strings[original] || translations.en[original] || original;
  }

  function apply(locale, updateUrl = true) {
    const strings = translations[locale] || translations.en;
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";

    textRecords.forEach(({ node, original }) => {
      const before = node.nodeValue.match(/^\s*/)?.[0] || "";
      const after = node.nodeValue.match(/\s*$/)?.[0] || "";
      node.nodeValue = before + translated(strings, original) + after;
    });

    attributeRecords.forEach(({ element, name, original }) => {
      element.setAttribute(name, translated(strings, original));
    });
    metaRecords.forEach(({ element, original }) => {
      element.content = translated(strings, original);
    });

    document.title = translated(strings, originalTitle);
    control.querySelector("label").textContent = languageLabels[locale] || languageLabels.en;
    select.setAttribute("aria-label", languageLabels[locale] || languageLabels.en);
    select.value = locale;
    localStorage.setItem(storageKey, locale);

    if (updateUrl) {
      const url = new URL(location.href);
      url.searchParams.set("lang", locale);
      history.replaceState({}, "", url);
    }
  }

  select.addEventListener("change", () => apply(select.value));
  apply(initial, Boolean(requested));
})();
