/**
 * Supported content languages for entries (user-selectable list).
 * ISO 639-1 codes mapped to their native + English name.
 *
 * NOTE: The special value "multi" (language-free content like instrumental
 * music, images, mixed-language) is intentionally NOT in this list — it is
 * reserved for the AI moderation pipeline. Users always pick a real
 * language; if the content is genuinely language-free, moderation will
 * overwrite it to "multi" automatically. Edits are disabled post-creation;
 * the moderation pipeline is the source of truth for the final value.
 */
// Ordered by approximate worldwide speaker population (native + L2). Closely
// related variants are grouped together at the position of the higher-population
// member: Chinese (zh-cn → zh-tw) and Malay/Indonesian (id → ms).
export const CONTENT_LANGUAGES = [
  { value: 'en', title: 'English' },
  { value: 'zh-cn', title: '简体中文 — Chinese (Simplified)' },
  { value: 'zh-tw', title: '繁體中文 — Chinese (Traditional)' },
  { value: 'hi', title: 'हिंदी — Hindi' },
  { value: 'es', title: 'Español — Spanish' },
  { value: 'ar', title: 'عربي — Arabic' },
  { value: 'fr', title: 'Français — French' },
  { value: 'bn', title: 'বাংলা — Bengali' },
  { value: 'pt', title: 'Português — Portuguese' },
  { value: 'ru', title: 'Русский — Russian' },
  { value: 'ur', title: 'اردو — Urdu' },
  { value: 'id', title: 'Bahasa Indonesia — Indonesian' },
  { value: 'ms', title: 'Melayu — Malay' },
  { value: 'pa', title: 'ਪੰਜਾਬੀ — Punjabi' },
  { value: 'de', title: 'Deutsch — German' },
  { value: 'fa', title: 'فارسی — Persian' },
  { value: 'ja', title: '日本語 — Japanese' },
  { value: 'te', title: 'తెలుగు — Telugu' },
  { value: 'mr', title: 'मराठी — Marathi' },
  { value: 'tr', title: 'Türkçe — Turkish' },
  { value: 'ta', title: 'தமிழ் — Tamil' },
  { value: 'vi', title: 'Tiếng Việt — Vietnamese' },
  { value: 'ko', title: '한국어 — Korean' },
  { value: 'tl', title: 'Tagalog' },
  { value: 'it', title: 'Italiano — Italian' },
  { value: 'th', title: 'ไทย — Thai' },
  { value: 'kn', title: 'ಕನ್ನಡ — Kannada' },
  { value: 'gu', title: 'ગુજરાતી — Gujarati' },
  { value: 'ps', title: 'پښتو — Pashto' },
  { value: 'am', title: 'አማርኛ — Amharic' },
  { value: 'pl', title: 'Polski — Polish' },
  { value: 'my', title: 'မြန်မာ — Burmese' },
  { value: 'uk', title: 'Українська — Ukrainian' },
  { value: 'or', title: 'ଓଡ଼ିଆ — Odia' },
  { value: 'ml', title: 'മലയാളം — Malayalam' },
  { value: 'sd', title: 'سنڌي — Sindhi' },
  { value: 'ne', title: 'नेपाली — Nepali' },
  { value: 'lo', title: 'ລາວ — Lao' },
  { value: 'nl', title: 'Nederlands — Dutch' },
  { value: 'ro', title: 'română — Romanian' },
  { value: 'si', title: 'සිංහල — Sinhala' },
  { value: 'km', title: 'ខ្មែរ — Khmer' },
  { value: 'el', title: 'Ελληνικά — Greek' },
  { value: 'hu', title: 'magyar — Hungarian' },
  { value: 'ht', title: 'Haitian Creole — Haitian Creole' },
  { value: 'sr', title: 'српски — Serbian' },
  { value: 'ug', title: 'ئۇيغۇرچە — Uyghur' },
  { value: 'cs', title: 'čeština — Czech' },
  { value: 'sv', title: 'svenska — Swedish' },
  { value: 'ca', title: 'català — Catalan' },
  { value: 'he', title: 'עברית — Hebrew' },
  { value: 'ckb', title: 'کوردیی ناوەندی — Sorani Kurdish' },
  { value: 'bg', title: 'български — Bulgarian' },
  { value: 'hy', title: 'Հայերեն — Armenian' },
  { value: 'bo', title: 'བོད་སྐད་ — Tibetan' },
  { value: 'da', title: 'dansk — Danish' },
  { value: 'fi', title: 'suomi — Finnish' },
  { value: 'no', title: 'norsk — Norwegian' },
  { value: 'ka', title: 'ქართული — Georgian' },
  { value: 'lt', title: 'lietuvių — Lithuanian' },
  { value: 'sl', title: 'slovenščina — Slovenian' },
  { value: 'eo', title: 'Esperanto — Esperanto' },
  { value: 'lv', title: 'latviešu — Latvian' },
  { value: 'et', title: 'eesti — Estonian' },
  { value: 'cy', title: 'Cymraeg — Welsh' },
  { value: 'eu', title: 'euskara — Basque' },
  { value: 'is', title: 'íslenska — Icelandic' },
  { value: 'dv', title: 'ދިވެހި — Divehi' },
] as const
