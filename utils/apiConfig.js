export const DEV_API_BASE_URL = ''
export const PROD_API_BASE_URL = 'https://www.zmkhai.com'

export function getApiBaseUrl() {
  try {
    if (typeof window !== 'undefined' && window && window.location) {
      const host = String(window.location.host || '')
      if (/^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(host)) return ''
      if (/(\.|^)zmkhai\.com(:\d+)?$/i.test(host)) return ''
    }
  } catch (e) {}
  try {
    if (typeof process !== 'undefined' && process && process.env && process.env.NODE_ENV === 'development') {
      return DEV_API_BASE_URL
    }
  } catch (e) {}
  return PROD_API_BASE_URL
}
