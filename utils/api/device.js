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

async function postForm(path, query) {
  const header = { 'Content-Type': 'application/x-www-form-urlencoded' }
  return post(`${path}${buildQuery(query)}`, undefined, { withAuth: false, showErrorToast: false, header })
}

function normalizeDevice(item) {
  const it = item && typeof item === 'object' ? item : {}
  const linkIdRaw = it.linkId !== undefined ? it.linkId : it.linkid !== undefined ? it.linkid : it.id !== undefined ? it.id : ''
  const deviceEmail = it.deviceEmail !== undefined ? String(it.deviceEmail) : ''
  const activationCode = it.activationCode !== undefined ? String(it.activationCode) : ''
  const deviceName = it.deviceName !== undefined ? String(it.deviceName) : ''
  const statusRaw = it.status !== undefined ? Number(it.status) : NaN
  const status = Number.isFinite(statusRaw) ? statusRaw : 0
  return { linkId: normalizeText(linkIdRaw), deviceEmail, activationCode, deviceName, status }
}

function normalizeLinkDevice(item) {
  const it = item && typeof item === 'object' ? item : {}
  const linkIdRaw = it.linkId !== undefined ? it.linkId : it.linkid !== undefined ? it.linkid : it.id !== undefined ? it.id : ''
  const activationCodeRaw =
    it.activationCode !== undefined
      ? it.activationCode
      : it.activationcode !== undefined
        ? it.activationcode
        : it.code !== undefined
          ? it.code
          : ''
  const deviceNameRaw =
    it.deviceName !== undefined
      ? it.deviceName
      : it.devicename !== undefined
        ? it.devicename
        : it.name !== undefined
          ? it.name
          : ''
  const deviceEmailRaw =
    it.deviceEmail !== undefined
      ? it.deviceEmail
      : it.deviceemail !== undefined
        ? it.deviceemail
        : it.email !== undefined
          ? it.email
          : ''
  const statusRaw = it.status !== undefined ? Number(it.status) : NaN
  return {
    linkId: normalizeText(linkIdRaw),
    activationCode: normalizeText(activationCodeRaw),
    deviceName: normalizeText(deviceNameRaw),
    deviceEmail: normalizeText(deviceEmailRaw),
    status: Number.isFinite(statusRaw) ? statusRaw : 0,
  }
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

async function resolveLinkDeviceEmail(passed) {
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

export async function getLinkDeviceList({ deviceEmail } = {}) {
  const token = getToken()
  const email = await resolveLinkDeviceEmail(deviceEmail)
  const res = await postForm('/calendar/app/getLinkDeviceList', {
    token,
    deviceEmail: email,
  })
  const list =
    Array.isArray(res)
      ? res
      : res && typeof res === 'object' && Array.isArray(res.list)
        ? res.list
        : res && typeof res === 'object' && Array.isArray(res.data)
          ? res.data
          : res && typeof res === 'object' && Array.isArray(res.deviceList)
            ? res.deviceList
            : res && typeof res === 'object' && Array.isArray(res.linkDeviceList)
              ? res.linkDeviceList
              : []
  return list.map(normalizeLinkDevice).filter((d) => d && d.linkId)
}

export async function addLinkDevice({ deviceEmail, deviceName } = {}) {
  const token = getToken()
  const email = normalizeText(deviceEmail)
  const name = normalizeText(deviceName)
  return postForm('/calendar/app/addLinkDevice', {
    token,
    deviceEmail: email,
    deviceName: name,
  })
}

export async function getDeviceActivationCode({ deviceEmail } = {}) {
  const token = getToken()
  const email = normalizeText(deviceEmail)
  const res = await postForm('/calendar/app/getDeviceActivationCode', {
    token,
    deviceEmail: email,
  })
  if (typeof res === 'string') return res
  if (res && typeof res === 'object') {
    if (res.data !== undefined && res.data !== null) return String(res.data)
    if (res.activationCode !== undefined && res.activationCode !== null) return String(res.activationCode)
    if (res.codeValue !== undefined && res.codeValue !== null) return String(res.codeValue)
  }
  return ''
}

export async function deleteLinkDevice({ linkId } = {}) {
  const token = getToken()
  const id = normalizeText(linkId)
  return postForm('/calendar/app/deleteLinkDevice', {
    token,
    linkId: id,
  })
}
