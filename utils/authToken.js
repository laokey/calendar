export const AUTH_TOKEN_KEY = 'auth_token_v1'

export function getToken() {
  try {
    const v = uni.getStorageSync(AUTH_TOKEN_KEY)
    return v ? String(v) : ''
  } catch (e) {
    return ''
  }
}

export function setToken(token) {
  uni.setStorageSync(AUTH_TOKEN_KEY, String(token || ''))
}

export function clearToken() {
  try {
    uni.removeStorageSync(AUTH_TOKEN_KEY)
  } catch (e) {
    uni.setStorageSync(AUTH_TOKEN_KEY, '')
  }
}
