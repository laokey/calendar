import { post } from '../request'
import { clearToken, getToken, setToken, setUserId } from '../authToken'

function buildQuery(params) {
  const obj = params && typeof params === 'object' ? params : {}
  const parts = []
  for (const k of Object.keys(obj)) {
    const v = obj[k]
    if (v === undefined || v === null) continue
    parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
  }
  return parts.length ? `?${parts.join('&')}` : ''
}

function normalizeLoginPayload(payload) {
  const p = payload && typeof payload === 'object' ? payload : {}
  return {
    account: String(p.account || p.email || '').trim(),
    password: String(p.password || '').trim(),
  }
}

function normalizeRegisterPayload(payload) {
  const p = payload && typeof payload === 'object' ? payload : {}
  return {
    account: String(p.account || p.email || '').trim(),
    password: String(p.password || '').trim(),
    userName: String(p.userName || p.name || '').trim(),
  }
}

export async function login(payload) {
  const p = normalizeLoginPayload(payload)
  const url = `/calendar/app/login${buildQuery({ account: p.account, password: p.password })}`
  const res = await post(url, undefined, {
    withAuth: false,
    showErrorToast: false,
    header: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })

  const token =
    typeof res === 'string'
      ? String(res).trim()
      : res && typeof res === 'object'
        ? String(
            res.token ||
              (res.data && typeof res.data === 'object' ? res.data.token : '') ||
              res.accessToken ||
              res.access_token ||
              (res.data && typeof res.data === 'object' ? (res.data.accessToken || res.data.access_token) : '') ||
              '',
          ).trim()
        : ''
  if (token) setToken(token)

  const userId =
    res && typeof res === 'object'
      ? res.userId !== undefined
        ? res.userId
        : res.id !== undefined
          ? res.id
          : res.user_id !== undefined
            ? res.user_id
            : res.data && typeof res.data === 'object'
              ? res.data.userId !== undefined
                ? res.data.userId
                : res.data.id !== undefined
                  ? res.data.id
                  : res.data.user_id !== undefined
                    ? res.data.user_id
                    : undefined
              : undefined
      : undefined
  if (userId !== undefined && userId !== null && String(userId).trim()) setUserId(userId)
  return res
}

export async function register(payload) {
  const p = normalizeRegisterPayload(payload)
  const url = `/calendar/app/register${buildQuery({ account: p.account, password: p.password, userName: p.userName })}`
  return post(url, undefined, {
    withAuth: false,
    showErrorToast: false,
    header: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
}

export async function logout() {
  try {
    const t = getToken()
    if (t) {
      await post(`/calendar/app/logout${buildQuery({ token: String(t) })}`, undefined, {
        withAuth: false,
        showErrorToast: false,
        header: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
    }
  } finally {
    clearToken()
  }
  return true
}

export async function unregister({ token, inviterEmail } = {}) {
  try {
    const t = String(token || '').trim()
    const inviter = String(inviterEmail || '').trim()
    if (t) {
      await post(`/calendar/app/unregister${buildQuery({ token: t, inviterEmail: inviter || undefined })}`, undefined, {
        withAuth: false,
        showErrorToast: false,
        header: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
    }
  } finally {
    clearToken()
  }
  return true
}
