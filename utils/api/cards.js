import { post } from '../request'
import { getToken } from '../authToken'
import { getCalendarDeviceList } from './device'

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

function safeJsonParse(raw) {
  try {
    return JSON.parse(raw)
  } catch (e) {
    return null
  }
}

function normalizeText(value) {
  return value === undefined || value === null ? '' : String(value).trim()
}

function normalizeInt(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? Math.round(n) : fallback
}

async function resolveDeviceEmail(passed) {
  const direct = normalizeText(passed)
  if (direct) return direct
  try {
    const raw = uni.getStorageSync('calendar_detail_ctx_v1')
    const obj = typeof raw === 'string' ? safeJsonParse(raw) : raw
    const v = obj && obj.email ? String(obj.email).trim() : ''
    if (v) return v
  } catch (e) {}
  try {
    const v = String(uni.getStorageSync('active_device_email_v1') || '').trim()
    if (v) return v
  } catch (e) {}

  try {
    const list = await getCalendarDeviceList()
    const first = list && list[0] && list[0].deviceEmail ? String(list[0].deviceEmail).trim() : ''
    if (first) {
      try {
        uni.setStorageSync('active_device_email_v1', first)
      } catch (e) {}
      return first
    }
  } catch (e) {}
  return ''
}

async function postForm(path, query) {
  const header = { 'Content-Type': 'application/x-www-form-urlencoded' }
  return post(`${path}${buildQuery(query)}`, undefined, { withAuth: false, showErrorToast: false, header })
}

function normalizeUrlList(res) {
  if (Array.isArray(res)) return res.map((x) => normalizeText(x)).filter(Boolean)
  if (!res || typeof res !== 'object') return []
  if (Array.isArray(res.data)) return res.data.map((x) => normalizeText(x)).filter(Boolean)
  if (Array.isArray(res.list)) return res.list.map((x) => normalizeText(x)).filter(Boolean)
  if (Array.isArray(res.urls)) return res.urls.map((x) => normalizeText(x)).filter(Boolean)
  return []
}

function normalizeCard(item) {
  const it = item && typeof item === 'object' ? item : {}
  const cardId =
    it.cardId !== undefined ? it.cardId : it.cardid !== undefined ? it.cardid : it.id !== undefined ? it.id : ''
  const deviceEmail =
    it.deviceEmail !== undefined ? it.deviceEmail : it.deviceemail !== undefined ? it.deviceemail : it.email !== undefined ? it.email : ''
  const imageUrl =
    it.imageUrl !== undefined ? it.imageUrl : it.imageurl !== undefined ? it.imageurl : it.url !== undefined ? it.url : ''
  const greetings =
    it.greetings !== undefined ? it.greetings : it.greeting !== undefined ? it.greeting : it.message !== undefined ? it.message : ''
  const playModeRaw =
    it.playMode !== undefined ? it.playMode : it.palyMode !== undefined ? it.palyMode : it.playmode !== undefined ? it.playmode : 0
  const isTimerRaw = it.isTimer !== undefined ? it.isTimer : it.istimer !== undefined ? it.istimer : 0
  const timedDate =
    it.timedDate !== undefined ? it.timedDate : it.timeddate !== undefined ? it.timeddate : it.date !== undefined ? it.date : ''
  const timedTime =
    it.timedTime !== undefined ? it.timedTime : it.timedtime !== undefined ? it.timedtime : it.time !== undefined ? it.time : ''
  const playMode = normalizeInt(playModeRaw, 0)
  const isTimer = normalizeInt(isTimerRaw, 0)
  return {
    cardId: normalizeText(cardId),
    deviceEmail: normalizeText(deviceEmail),
    imageUrl: normalizeText(imageUrl),
    greetings: normalizeText(greetings),
    playMode,
    isTimer,
    timedDate: normalizeText(timedDate),
    timedTime: normalizeText(timedTime),
  }
}

function extractList(res) {
  if (Array.isArray(res)) return res
  if (!res || typeof res !== 'object') return []
  if (Array.isArray(res.list)) return res.list
  if (Array.isArray(res.data)) return res.data
  if (Array.isArray(res.cardList)) return res.cardList
  if (Array.isArray(res.greetingCardList)) return res.greetingCardList
  return []
}

export function playModeFromDraft(mode) {
  return String(mode) === 'manual' ? 1 : 0
}

export async function getCardResourceList({ resourceType } = {}) {
  const token = getToken()
  const type = normalizeInt(resourceType, 1)
  const res = await postForm('/calendar/app/getCradResourceList', { token, resourceType: type })
  return normalizeUrlList(res)
}

export async function sendGreetingCard({
  deviceEmail,
  imageUrl,
  greetings,
  playMode,
  isTimer,
  timedDate,
  timedTime,
} = {}) {
  const token = getToken()
  const email = await resolveDeviceEmail(deviceEmail)
  const mode = normalizeInt(playMode, 0)
  const timer = normalizeInt(isTimer, 0)
  const date = normalizeText(timedDate)
  const time = normalizeText(timedTime)
  const url = normalizeText(imageUrl)
  const msg = normalizeText(greetings)
  return postForm('/calendar/app/sendGreetingCard', {
    token,
    deviceEmail: email,
    imageUrl: url,
    greetings: msg,
    playMode: parseInt(mode),
    isTimer: parseInt(timer),
    timedDate: timer ? date : '',
    timedTime: timer ? time : '',
  })
}

export async function getGreetingCardList() {
  const token = getToken()
  const res = await postForm('/calendar/app/getGreetingCardList', { token })
  return extractList(res).map(normalizeCard).filter((x) => x && x.cardId)
}
