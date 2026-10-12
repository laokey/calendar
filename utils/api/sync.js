import { post } from '../request'
import { getToken, getUserId } from '../authToken'

const GOOGLE_CLIENT_ID = '201984037633-mha19cq8uils54ocqs4j0li0q0vpo7e3.apps.googleusercontent.com'
const OUTLOOK_CLIENT_ID = 'c4391087-2cd5-4e8f-8379-fb13a10fbdf0'

const GOOGLE_REDIRECT_URI = 'https://www.zmkhai.com/calendar/app/google/callback'
const OUTLOOK_REDIRECT_URI = 'https://www.zmkhai.com/calendar/app/outlook/callback'

const GOOGLE_SCOPE = 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/userinfo.email'
const OUTLOOK_SCOPE = 'openid offline_access Calendars.ReadWrite User.Read email'

const GOOGLE_OAUTH_CODE_HINT_PATTERNS = [
  /(请复制此授权码|copy this authorization code|your authorization code|code)[^A-Za-z0-9_\-/.]{0,16}([A-Za-z0-9_\-/.]{12,})/i,
  /<code[^>]*>([A-Za-z0-9_\-/.]{12,})<\/code>/i,
  /\b(4\/[A-Za-z0-9_\-]{12,}|1\/[A-Za-z0-9_\-]{12,})\b/,
]

function buildQuery(params) {
  const obj = params && typeof params === 'object' ? params : {}
  const parts = []
  for (const k of Object.keys(obj)) {
    const v = obj[k]
    if (v === undefined || v === null || v === '') continue
    parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
  }
  return parts.length ? `?${parts.join('&')}` : ''
}

function toFormBody(data) {
  const obj = data && typeof data === 'object' ? data : {}
  const parts = []
  for (const k of Object.keys(obj)) {
    const v = obj[k]
    if (v === undefined || v === null) continue
    parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
  }
  return parts.join('&')
}

async function postForm(path, query) {
  const header = { 'Content-Type': 'application/x-www-form-urlencoded' }
  return post(`${path}${buildQuery(query)}`, undefined, { withAuth: false, showErrorToast: false, header })
}

function resolveDeviceSerial() {
  try {
    const info = uni.getSystemInfoSync()
    const deviceId =
      (info && (info.deviceId || info.deviceID)) ||
      ''
    if (deviceId) return String(deviceId)
  } catch (e) {}
  try {
    const cached = uni.getStorageSync('device_serial_cache')
    if (cached) return String(cached)
  } catch (e) {}
  const fallback = `sim_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
  try {
    uni.setStorageSync('device_serial_cache', fallback)
  } catch (e) {}
  return fallback
}

export function buildGoogleAuthUrl({ state } = {}) {
  const params = {
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: GOOGLE_SCOPE,
    access_type: 'offline',
    prompt: 'consent select_account',
    include_granted_scopes: 'true',
  }
  if (state) params.state = String(state)
  return `https://accounts.google.com/o/oauth2/v2/auth${buildQuery(params)}`
}

export function buildOutlookAuthUrl({ state } = {}) {
  const params = {
    client_id: OUTLOOK_CLIENT_ID,
    redirect_uri: OUTLOOK_REDIRECT_URI,
    response_type: 'code',
    response_mode: 'query',
    scope: OUTLOOK_SCOPE,
  }
  if (state) params.state = String(state)
    console.log('params', state)
  return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize${buildQuery(params)}`
}

export function buildAuthUrl(provider, options) {
  const p = String(provider || '').toLowerCase()
  if (p === 'outlook') return buildOutlookAuthUrl(options)
  return buildGoogleAuthUrl(options)
}

export function extractCodeFromRedirectUrl(url) {
  const raw = String(url || '')
  const result = { code: '', error: '', state: '' }
  try {
    let query = ''
    const hashIdx = raw.indexOf('#')
    const qIdx = raw.indexOf('?')
    if (qIdx >= 0) {
      const end = hashIdx >= 0 ? hashIdx : raw.length
      query = raw.slice(qIdx + 1, end)
    }
    if (!query && hashIdx >= 0) {
      query = raw.slice(hashIdx + 1)
    }
    if (!query) return result
    const pairs = query.split('&')
    for (const pair of pairs) {
      const idx = pair.indexOf('=')
      const key = idx >= 0 ? decodeURIComponent(pair.slice(0, idx)) : pair
      const val = idx >= 0 ? decodeURIComponent(pair.slice(idx + 1)) : ''
      if (key === 'code') result.code = val
      if (key === 'error') result.error = val
      if (key === 'state') result.state = val
    }
  } catch (e) {}
  return result
}

export async function submitOAuthCode({ provider, code, redirectUri }) {
  const p = String(provider || '').toLowerCase() === 'outlook' ? 'outlook' : 'google'
  const deviceSerial = resolveDeviceSerial()
  const token = String(getToken() || '')
  const userId = String(getUserId() || '')
  const finalRedirectUri = redirectUri || (p === 'outlook' ? OUTLOOK_REDIRECT_URI : GOOGLE_REDIRECT_URI)
  const clientId = p === 'outlook' ? OUTLOOK_CLIENT_ID : GOOGLE_CLIENT_ID
  const urlQuery = { deviceSerial }
  const body = {
    provider: p,
    code: String(code || ''),
    deviceSerial,
    redirectUri: finalRedirectUri,
    token,
    userId,
    clientId,
  }
  const url = `/calendar/app/bindCalendarAccount${buildQuery(urlQuery)}`
  return post(url, toFormBody(body), {
    withAuth: true,
    header: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
}

export async function getCalendarAccountList() {
  const deviceSerial = resolveDeviceSerial()
  const token = getToken()
  const url = `/calendar/app/getClandarAccountList`

  return postForm(url, { token, deviceSerial })
}

export async function getCalendarList({ accountId, provider }) {
  const deviceSerial = resolveDeviceSerial()
  const query = {
    token: getToken(),
    deviceSerial,
    accountId: String(accountId || ''),
    provider: String(provider || ''),
  }
  const url = `/calendar/app/getClandarList${buildQuery(query)}`
  return post(url, toFormBody(query), {
    withAuth: true,
    header: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
}

export async function triggerSync({ accountId, provider, calendarIds, syncMode }) {
  const deviceSerial = resolveDeviceSerial()
  const payload = {
    deviceSerial,
    accountId: String(accountId || ''),
    provider: String(provider || ''),
    calendarIds: Array.isArray(calendarIds) ? calendarIds.join(',') : String(calendarIds || ''),
    syncMode: syncMode === 'oneWay' ? 'oneWay' : 'twoWay',
  }
  const url = `/calendar/app/triggerSync${buildQuery({ deviceSerial })}`
  return post(url, toFormBody(payload), {
    withAuth: true,
    header: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
}

export async function getSyncStatus({ calendarId, taskId } = {}) {
  const token = getToken()
  const calendarIdText = String(calendarId || '').trim()
  if (calendarIdText) {
    return postForm('/calendar/app/syncStatus', {
      token,
      calendarId: calendarIdText,
    })
  }

  const deviceSerial = resolveDeviceSerial()
  const payload = {
    deviceSerial,
    taskId: String(taskId || ''),
  }
  const url = `/calendar/app/syncStatus${buildQuery({ deviceSerial })}`
  return post(url, toFormBody(payload), {
    withAuth: true,
    header: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
}

export async function unbindCalendarAccount({ accountId, provider }) {
  const deviceSerial = resolveDeviceSerial()
  const payload = {
    deviceSerial,
    accountId: String(accountId || ''),
    provider: String(provider || ''),
  }
  const url = `/calendar/app/unbindCalendarAccount${buildQuery({ deviceSerial })}`
  return post(url, toFormBody(payload), {
    withAuth: true,
    header: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
}

export async function bindICloudCalendar({ email, appSpecificPassword }) {
  const deviceSerial = resolveDeviceSerial()
  const payload = {
    deviceSerial,
    email: String(email || ''),
    appSpecificPassword: String(appSpecificPassword || ''),
  }
  const url = `/calendar/app/bindICloudCalendar${buildQuery({ deviceSerial })}`
  return post(url, toFormBody(payload), {
    withAuth: true,
    header: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
}

export async function bindICloudCalendarUrl({ icsUrl }) {
  const token = getToken()
  const normalizedIcsUrl = String(icsUrl || '').trim()
  return postForm('/calendar/app/bind/icloud', {
    token,
    icsUrl: normalizedIcsUrl,
  })
}

export function normalizeAccountList(raw) {
  if (!raw) return []
  const arr = Array.isArray(raw) ? raw : Array.isArray(raw.list) ? raw.list : Array.isArray(raw.data) ? raw.data : []
  return arr
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const provider = String(
        item.provider || item.type || item.platform || item.accountType || 'google',
      ).toLowerCase()
      const normalizedProvider = /outlook|microsoft|msa/i.test(provider) ? 'outlook' : /icloud|apple/i.test(provider) ? 'icloud' : 'google'
      return {
        id: String(item.id || item.accountId || item.account_id || ''),
        type: 'account',
        provider: normalizedProvider,
        email: String(item.email || item.account || item.userName || ''),
        name: String(item.name || item.displayName || item.nickname || item.email || ''),
        syncMode: item.syncMode === 'oneWay' ? 'oneWay' : 'twoWay',
        createdAtTs: Number(item.createdAt || item.created_at || Date.now()),
        raw: item,
      }
    })
    .filter((x) => x && x.email)
}

export function normalizeCalendarList(raw) {
  if (!raw) return []
  const arr = Array.isArray(raw) ? raw : Array.isArray(raw.list) ? raw.list : Array.isArray(raw.data) ? raw.data : []
  return arr.map((item) => {
    if (!item || typeof item !== 'object') return { id: '', name: '', color: '', selected: false }
    return {
      id: String(item.id || item.calendarId || item.calendar_id || ''),
      name: String(item.name || item.summary || item.title || ''),
      color: String(item.color || item.colorId || item.hexColor || item.background || ''),
      selected: !!item.selected,
      raw: item,
    }
  }).filter((x) => x.id)
}

export function extractCodeFromHtmlOrText(text) {
  const raw = String(text || '')
  if (!raw) return { code: '', error: '' }
  for (const re of GOOGLE_OAUTH_CODE_HINT_PATTERNS) {
    const m = raw.match(re)
    if (!m) continue
    const candidate = m[2] || m[1] || ''
    if (candidate && candidate.length >= 8) return { code: candidate, error: '' }
  }
  return extractCodeFromRedirectUrl(raw)
}

export {
  GOOGLE_CLIENT_ID,
  OUTLOOK_CLIENT_ID,
  GOOGLE_REDIRECT_URI,
  OUTLOOK_REDIRECT_URI,
  GOOGLE_SCOPE,
  OUTLOOK_SCOPE,
  resolveDeviceSerial,
}
