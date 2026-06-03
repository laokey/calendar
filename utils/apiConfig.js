export const DEV_API_BASE_URL = 'https://www.zmkhai.com'
export const PROD_API_BASE_URL = 'https://www.zmkhai.com'

export function getApiBaseUrl() {
  try {
    if (typeof process !== 'undefined' && process && process.env && process.env.NODE_ENV === 'development') {
      return DEV_API_BASE_URL
    }
  } catch (e) {}
  return PROD_API_BASE_URL
}
