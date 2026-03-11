/**
 * Supported content languages for entries.
 * ISO 639-1 codes mapped to their native + English name.
 * Used in upload and edit forms.
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
] as const
