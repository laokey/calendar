import { post } from '../request'
import { clearToken, getToken, setToken } from '../authToken'

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
  const token = res && typeof res === 'object' ? String(res.token || '') : ''
  if (token) setToken(token)
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

export async function unregister(token) {
  try {
    const t = String(token || '').trim()
    if (t) {
      await post(`/calendar/app/unregister${buildQuery({ token: t })}`, undefined, {
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
