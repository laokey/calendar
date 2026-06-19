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
    const email = normalizeText(obj && obj.email)
    if (email) return email
  } catch (e) {}
  try {
    const email = normalizeText(uni.getStorageSync('active_device_email_v1'))
    if (email) return email
  } catch (e) {}
  try {
    const list = await getCalendarDeviceList()
    const email = normalizeText(list && list[0] && list[0].deviceEmail)
    if (email) {
      try {
        uni.setStorageSync('active_device_email_v1', email)
      } catch (e) {}
      return email
    }
  } catch (e) {}
  return ''
}

async function postForm(path, query) {
  const header = { 'Content-Type': 'application/x-www-form-urlencoded' }
  return post(`${path}${buildQuery(query)}`, undefined, { withAuth: false, showErrorToast: false, header })
}

function extractList(res) {
  if (Array.isArray(res)) return res
  if (!res || typeof res !== 'object') return []
  if (Array.isArray(res.list)) return res.list
  if (Array.isArray(res.data)) return res.data
  if (Array.isArray(res.notifyTypeList)) return res.notifyTypeList
  if (Array.isArray(res.notifyList)) return res.notifyList
  return []
}

function normalizeNotifyType(item) {
  const it = item && typeof item === 'object' ? item : {}
  const notifyIndex =
    it.notifyIndex !== undefined
      ? it.notifyIndex
      : it.notifyindex !== undefined
        ? it.notifyindex
        : it.index !== undefined
          ? it.index
          : it.id
  const notifyTitle =
    it.notifyTitle !== undefined
      ? it.notifyTitle
      : it.notifytitle !== undefined
        ? it.notifytitle
        : it.title !== undefined
          ? it.title
          : ''
  const advanceMinutes =
    it.advanceMinutes !== undefined
      ? it.advanceMinutes
      : it.advanceMinute !== undefined
        ? it.advanceMinute
        : it.advanceminutes !== undefined
          ? it.advanceminutes
          : it.advanceminute !== undefined
            ? it.advanceminute
            : it.minutes
  const status = it.status !== undefined ? it.status : it.onOff !== undefined ? it.onOff : it.onoff
  return {
    notifyIndex: normalizeInt(notifyIndex, -1),
    notifyTitle: normalizeText(notifyTitle),
    advanceMinutes: normalizeInt(advanceMinutes, 10),
    status: normalizeInt(status, 0) === 1 ? 1 : 0,
  }
}

export async function getNotifyTypeList({ deviceEmail } = {}) {
  const token = getToken()
  const email = await resolveDeviceEmail(deviceEmail)
  const res = await postForm('/calendar/app/getNotifyTypeList', {
    token,
    deviceEmail: email,
    deviceemail: email,
  })
  return extractList(res).map(normalizeNotifyType).filter((x) => x && x.notifyIndex >= 0)
}

export async function onOffNotify({ deviceEmail, notifyIndex, advanceMinutes, onOff } = {}) {
  const token = getToken()
  const email = await resolveDeviceEmail(deviceEmail)
  const index = normalizeInt(notifyIndex, 0)
  const minutes = normalizeInt(advanceMinutes, 10)
  const status = normalizeInt(onOff, 0) === 1 ? 1 : 0
  return postForm('/calendar/app/onOffNotify', {
    token,
    deviceEmail: email,
    deviceemail: email,
    notifyIndex: index,
    notifyindex: index,
    advanceMinutes: minutes,
    advanceMinute: minutes,
    advanceminutes: minutes,
    advanceminute: minutes,
    onOff: status,
    onoff: status,
    status,
  })
}
