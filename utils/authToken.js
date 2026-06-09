export const AUTH_TOKEN_KEY = 'auth_token_v1'
export const AUTH_USER_ID_KEY = 'auth_user_id_v1'

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

export function getUserId() {
  try {
    const v = uni.getStorageSync(AUTH_USER_ID_KEY)
    if (v === 0) return 0
    if (v === '0') return '0'
    return v !== undefined && v !== null && String(v).trim() ? v : ''
  } catch (e) {
    return ''
  }
}

export function setUserId(userId) {
  uni.setStorageSync(AUTH_USER_ID_KEY, userId)
}

export function clearUserId() {
  try {
    uni.removeStorageSync(AUTH_USER_ID_KEY)
  } catch (e) {
    uni.setStorageSync(AUTH_USER_ID_KEY, '')
  }
}

export function clearToken() {
  try {
    uni.removeStorageSync(AUTH_TOKEN_KEY)
  } catch (e) {
    uni.setStorageSync(AUTH_TOKEN_KEY, '')
  }
  clearUserId()
}
