import { post } from '../request'
import { getToken } from '../authToken'

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

async function postWithFallback(primaryPath, fallbackPath, query) {
  const header = { 'Content-Type': 'application/x-www-form-urlencoded' }
  try {
    return await post(`${primaryPath}${buildQuery(query)}`, undefined, { withAuth: false, showErrorToast: false, header })
  } catch (e) {
    if (e && e.statusCode === 404 && fallbackPath) {
      return await post(`${fallbackPath}${buildQuery(query)}`, undefined, { withAuth: false, showErrorToast: false, header })
    }
    throw e
  }
}

function normalizeDevice(item) {
  const it = item && typeof item === 'object' ? item : {}
  const deviceEmail = it.deviceEmail !== undefined ? String(it.deviceEmail) : ''
  const activationCode = it.activationCode !== undefined ? String(it.activationCode) : ''
  const deviceName = it.deviceName !== undefined ? String(it.deviceName) : ''
  const statusRaw = it.status !== undefined ? Number(it.status) : NaN
  const status = Number.isFinite(statusRaw) ? statusRaw : 0
  return { deviceEmail, activationCode, deviceName, status }
}

export async function getCalendarDeviceList() {
  const token = getToken()
  const res = await postWithFallback('/calendar/app/getCalendarDeviceList', null, { token })
  const list =
    Array.isArray(res) ? res :
    res && typeof res === 'object' && Array.isArray(res.list) ? res.list :
    res && typeof res === 'object' && Array.isArray(res.data) ? res.data :
    res && typeof res === 'object' && Array.isArray(res.deviceList) ? res.deviceList :
    []
  return list.map(normalizeDevice).filter((d) => d && d.deviceEmail)
}

export async function createCalendarDevice(deviceEmail) {
  const token = getToken()
  const email = String(deviceEmail || '').trim()
  return postWithFallback('/calendar/app/createCalendarDevice', null, { token, deviceEmail: email })
}

export async function bindCalendarDevice(deviceEmail) {
  const token = getToken()
  const email = String(deviceEmail || '').trim()
  return postWithFallback('/calendar/app/bindCalendarDevice', '/calendar/app/bindCalendarDeviceList', { token, deviceEmail: email })
}

export async function unbindCalendarDevice(deviceEmail) {
  const token = getToken()
  const email = String(deviceEmail || '').trim()
  return postWithFallback('/calendar/app/unbindCalendarDevice', '/calendar/app/unbindCalendarDeviceList', { token, deviceEmail: email })
}
