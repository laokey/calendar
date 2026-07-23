import { createI18n } from 'vue-i18n'
import { messages } from './messages'

const ME_STATE_KEY = 'me_state_v1'
const FALLBACK_LOCALE = 'zh-CN'

const LEGACY_LANGUAGE_MAP = {
  system: 'system',
  'English(US)': 'en-US',
  Francais: 'fr-FR',
  Deutsch: 'de-DE',
  Italiano: 'it-IT',
  Espanol: 'es-ES',
  '日本語': 'ja-JP',
  '中文(简体)': 'zh-CN',
  '繁體中文': 'zh-TW',
}

export const LANGUAGE_OPTIONS = [
  { value: 'system', label: '遵循系统语言' },
  { value: 'en-US', label: 'English(US)' },
  { value: 'fr-FR', label: 'Francais' },
  { value: 'de-DE', label: 'Deutsch' },
  { value: 'it-IT', label: 'Italiano' },
  { value: 'es-ES', label: 'Espanol' },
  { value: 'ja-JP', label: '日本語' },
  { value: 'zh-CN', label: '中文(简体)' },
  { value: 'zh-TW', label: '繁體中文' },
]

const SUPPORTED_LOCALES = new Set(LANGUAGE_OPTIONS.map((item) => item.value).filter((item) => item !== 'system'))

export function normalizeLanguagePreference(input) {
  const raw = input === undefined || input === null ? '' : String(input).trim()
  if (!raw) return 'system'
  if (LEGACY_LANGUAGE_MAP[raw]) return LEGACY_LANGUAGE_MAP[raw]
  if (SUPPORTED_LOCALES.has(raw)) return raw

  const lowered = raw.toLowerCase()
  if (lowered.startsWith('en')) return 'en-US'
  if (lowered.startsWith('fr')) return 'fr-FR'
  if (lowered.startsWith('de')) return 'de-DE'
  if (lowered.startsWith('it')) return 'it-IT'
  if (lowered.startsWith('es')) return 'es-ES'
  if (lowered.startsWith('ja')) return 'ja-JP'
  if (lowered.startsWith('zh-tw') || lowered.includes('hant')) return 'zh-TW'
  if (lowered.startsWith('zh')) return 'zh-CN'
  return 'system'
}

export function resolveSystemLocale() {
  try {
    const info = uni.getSystemInfoSync()
    const raw = info && info.language ? String(info.language).trim() : ''
    const normalized = normalizeLanguagePreference(raw)
    return normalized === 'system' ? FALLBACK_LOCALE : normalized
  } catch (e) {
    return FALLBACK_LOCALE
  }
}

export function resolveLocale(preference) {
  const normalized = normalizeLanguagePreference(preference)
  return normalized === 'system' ? resolveSystemLocale() : normalized
}

function readStoredPreference() {
  try {
    const raw = uni.getStorageSync(ME_STATE_KEY)
    const state = typeof raw === 'string' ? JSON.parse(raw) : raw
    const value = state && state.settings ? state.settings.language : 'system'
    return normalizeLanguagePreference(value)
  } catch (e) {
    return 'system'
  }
}

export function getLanguageLabel(value) {
  const normalized = normalizeLanguagePreference(value)
  const match = LANGUAGE_OPTIONS.find((item) => item.value === normalized)
  return match ? match.label : LANGUAGE_OPTIONS[0].label
}

export const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: resolveLocale(readStoredPreference()),
  fallbackLocale: FALLBACK_LOCALE,
  messages,
  missingWarn: false,
  fallbackWarn: false,
  missing: (_locale, key) => (key === undefined || key === null ? '' : String(key)),
})

export function translate(key, ...args) {
  const raw = key === undefined || key === null ? '' : String(key)
  if (!raw) return ''
  const result = i18n.global.t(raw, ...args)
  return result === undefined || result === null || result === '' ? raw : result
}

export function applyAppLanguage(preference) {
  const normalizedPreference = normalizeLanguagePreference(preference)
  const locale = resolveLocale(normalizedPreference)

  if (i18n.global && i18n.global.locale) {
    if (typeof i18n.global.locale === 'string') {
      i18n.global.locale = locale
    } else {
      i18n.global.locale.value = locale
    }
  }

  try {
    if (typeof uni !== 'undefined' && typeof uni.setLocale === 'function') {
      uni.setLocale(locale)
    }
  } catch (e) {}

  try {
    if (typeof uni !== 'undefined') {
      uni.$t = translate
    }
  } catch (e) {}

  return {
    preference: normalizedPreference,
    locale,
  }
}

export function syncStoredLanguage() {
  return applyAppLanguage(readStoredPreference())
}
