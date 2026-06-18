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
export const CONTENT_LANGUAGES = [
  { value: 'en', title: 'English' },
  { value: 'es', title: 'Español — Spanish' },
  { value: 'zh-cn', title: '简体中文 — Chinese (Simplified)' },
  { value: 'zh-tw', title: '繁體中文 — Chinese (Traditional)' },
  { value: 'hi', title: 'हिंदी — Hindi' },
  { value: 'ar', title: 'عربي — Arabic' },
  { value: 'pt', title: 'Português — Portuguese' },
  { value: 'ru', title: 'Русский — Russian' },
  { value: 'ja', title: '日本語 — Japanese' },
  { value: 'de', title: 'Deutsch — German' },
  { value: 'fr', title: 'Français — French' },
  { value: 'ko', title: '한국어 — Korean' },
  { value: 'it', title: 'Italiano — Italian' },
  { value: 'ms', title: 'Melayu — Malay' },
  { value: 'uk', title: 'Українська — Ukrainian' },
  { value: 'pl', title: 'Polski — Polish' },
  { value: 'vi', title: 'Tiếng Việt — Vietnamese' },
  { value: 'tr', title: 'Türkçe — Turkish' },
  { value: 'ur', title: 'اردو — Urdu' },
  { value: 'bn', title: 'বাংলা — Bengali' },
  { value: 'id', title: 'Bahasa Indonesia — Indonesian' },
  { value: 'pa', title: 'ਪੰਜਾਬੀ — Punjabi' },
  { value: 'fa', title: 'فارسی — Persian' },
  { value: 'mr', title: 'मराठी — Marathi' },
  { value: 'te', title: 'తెలుగు — Telugu' },
  { value: 'tl', title: 'Tagalog' },
  { value: 'ta', title: 'தமிழ் — Tamil' },
  { value: 'bo', title: 'བོད་སྐད་ — Tibetan' },
  { value: 'th', title: 'ไทย — Thai' },
  { value: 'kn', title: 'ಕನ್ನಡ — Kannada' },
  { value: 'gu', title: 'ગુજરાતી — Gujarati' },
  { value: 'am', title: 'አማርኛ — Amharic' },
  { value: 'ps', title: 'پښتو — Pashto' },
  { value: 'my', title: 'မြန်မာ — Burmese' },
  { value: 'or', title: 'ଓଡ଼ିଆ — Odia' },
  { value: 'nl', title: 'Nederlands — Dutch' },
  { value: 'ml', title: 'മലയാളം — Malayalam' },
] as const
