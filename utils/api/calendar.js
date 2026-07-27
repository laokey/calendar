import { del, get, post, put } from '../request'
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

async function resolveDeviceEmail(passed) {
  const direct = String(passed || '').trim()
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

export function listEvents(params) {
  return get('/calendar/events', params)
}

export function getEvent(id) {
  return get(`/calendar/events/${encodeURIComponent(String(id || ''))}`)
}

export function createEvent(payload) {
  return post('/calendar/events', payload)
}

export function updateEvent(id, payload) {
  return put(`/calendar/events/${encodeURIComponent(String(id || ''))}`, payload)
}

export function deleteEvent(id) {
  return del(`/calendar/events/${encodeURIComponent(String(id || ''))}`)
}

function parseIdList(raw) {
  if (raw === undefined || raw === null) return []
  if (Array.isArray(raw)) {
    return raw
      .map((x) => {
        if (x && typeof x === 'object') {
          const id =
            x.memberId !== undefined
              ? x.memberId
              : x.memberid !== undefined
                ? x.memberid
                : x.id !== undefined
                  ? x.id
                  : ''
          return id === undefined || id === null ? '' : String(id).trim()
        }
        return String(x || '').trim()
      })
      .filter(Boolean)
  }
  const s = String(raw).trim()
  if (!s) return []
  if (s.startsWith('[') && s.endsWith(']')) {
    const parsed = safeJsonParse(s)
    if (Array.isArray(parsed)) {
      return parsed
        .map((x) => {
          if (x && typeof x === 'object') {
            const id =
              x.memberId !== undefined
                ? x.memberId
                : x.memberid !== undefined
                  ? x.memberid
                  : x.id !== undefined
                    ? x.id
                    : ''
            return id === undefined || id === null ? '' : String(id).trim()
          }
          return String(x || '').trim()
        })
        .filter(Boolean)
    }
  }
  return s
    .split(',')
    .map((x) => String(x || '').trim())
    .filter(Boolean)
}

function repeatFromMatter(matter) {
  const it = matter && typeof matter === 'object' ? matter : {}
  const isRepeatRaw = it.isRepeat !== undefined ? it.isRepeat : it.isrepeat !== undefined ? it.isrepeat : 0
  const isRepeat = Number(isRepeatRaw) === 1
  if (!isRepeat) return null
  const repeatTypeRaw = it.repeatType !== undefined ? it.repeatType : it.repeattype !== undefined ? it.repeattype : 1
  const repeatType = Number(repeatTypeRaw)
  const unit = repeatType === 4 ? 'year' : repeatType === 3 ? 'month' : repeatType === 2 ? 'week' : 'day'
  const weeks = parseIdList(it.weeks !== undefined ? it.weeks : it.weekdays !== undefined ? it.weekdays : '')
    .map((x) => Number(x))
    .filter((n) => Number.isFinite(n))
  const out = { unit, every: 1 }
  if (unit === 'week' && weeks.length) out.weekdays = weeks
  return out
}

function pad2(n) {
  return String(n).padStart(2, '0')
}

function normalizeDateKey(input) {
  const raw = String(input || '').trim()
  if (!raw) return ''
  const head = raw.split('T')[0].split(' ')[0].trim()
  if (!head) return ''
  const s = head.replace(/\//g, '-')
  const parts = s.split('-').map((x) => String(x || '').trim()).filter(Boolean)
  if (parts.length < 3) return ''
  const y = Number(parts[0])
  const m = Number(parts[1])
  const d = Number(parts[2])
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return ''
  return `${String(Math.floor(y))}-${pad2(Math.floor(m))}-${pad2(Math.floor(d))}`
}

function normalizeTimeText(input) {
  const raw = String(input || '').trim()
  if (!raw) return ''
  const head = raw.split('T')[0].split(' ')[0].trim()
  const parts = head.split(':').map((x) => String(x || '').trim()).filter(Boolean)
  if (parts.length < 2) return raw
  const hh = Number(parts[0])
  const mm = Number(parts[1])
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return raw
  return `${pad2(Math.floor(hh))}:${pad2(Math.floor(mm))}`
}

function normalizeMatter(it) {
  const x = it && typeof it === 'object' ? it : {}
  const idRaw =
    x.matterId !== undefined ? x.matterId : x.matterid !== undefined ? x.matterid : x.id !== undefined ? x.id : ''
  const titleRaw =
    x.matterTitle !== undefined
      ? x.matterTitle
      : x.mattertitle !== undefined
        ? x.mattertitle
        : x.title !== undefined
          ? x.title
          : ''
  const isAllDayRaw = x.isAllDay !== undefined ? x.isAllDay : x.isallday !== undefined ? x.isallday : 0
  const allDay = String(isAllDayRaw) === '1' || Number(isAllDayRaw) === 1
  const startDateRaw =
    x.startDate !== undefined ? x.startDate : x.startdate !== undefined ? x.startdate : x.start_date !== undefined ? x.start_date : ''
  const endDateRaw =
    x.endDate !== undefined ? x.endDate : x.enddate !== undefined ? x.enddate : x.end_date !== undefined ? x.end_date : ''
  const startTimeRaw =
    x.startTime !== undefined ? x.startTime : x.starttime !== undefined ? x.starttime : x.start_time !== undefined ? x.start_time : ''
  const endTimeRaw =
    x.endTime !== undefined ? x.endTime : x.endtime !== undefined ? x.endtime : x.end_time !== undefined ? x.end_time : ''
  const startDate = normalizeDateKey(startDateRaw)
  const endDate = normalizeDateKey(endDateRaw)
  const startTime = normalizeTimeText(startTimeRaw)
  const endTime = normalizeTimeText(endTimeRaw)
  const desc =
    x.description !== undefined ? String(x.description) : x.desc !== undefined ? String(x.desc) : ''
  const membersRaw = x.members !== undefined ? x.members : x.memberIds !== undefined ? x.memberIds : []
  const memberIds = parseIdList(membersRaw)
  let memberColorFromMembers = null
  if (Array.isArray(membersRaw) && membersRaw.length === 1 && membersRaw[0] && typeof membersRaw[0] === 'object') {
    const v = membersRaw[0].memberColor !== undefined ? membersRaw[0].memberColor : membersRaw[0].membercolor
    const n = Number(v)
    memberColorFromMembers = Number.isFinite(n) ? Math.round(n) : null
  } else if (typeof membersRaw === 'string' && membersRaw.trim().startsWith('[')) {
    const parsed = safeJsonParse(membersRaw.trim())
    if (Array.isArray(parsed) && parsed.length === 1 && parsed[0] && typeof parsed[0] === 'object') {
      const v = parsed[0].memberColor !== undefined ? parsed[0].memberColor : parsed[0].membercolor
      const n = Number(v)
      memberColorFromMembers = Number.isFinite(n) ? Math.round(n) : null
    }
  }
  const memberColorRaw =
    x.memberColor !== undefined
      ? x.memberColor
      : x.membercolor !== undefined
        ? x.membercolor
        : x.colorIndex !== undefined
          ? x.colorIndex
          : x.colorindex !== undefined
            ? x.colorindex
            : x.colorId !== undefined
              ? x.colorId
              : x.colorid !== undefined
                ? x.colorid
                : memberColorFromMembers
  const memberColorNum = Number(memberColorRaw)
  const memberColor = Number.isFinite(memberColorNum) ? Math.round(memberColorNum) : null

  return {
    id: idRaw === undefined || idRaw === null ? '' : String(idRaw),
    title: titleRaw === undefined || titleRaw === null ? '' : String(titleRaw),
    allDay,
    startDate,
    endDate: endDate || startDate,
    startTime: allDay ? '' : startTime,
    endTime: allDay ? '' : endTime,
    memberIds,
    memberColor,
    desc,
    location: '',
    tagColor: '#3d6afb',
    color: '#ffffff',
    repeat: repeatFromMatter(x),
    createdAtTs: Date.now(),
  }
}

export function mapRemoteMattersToLocalEvents(list) {
  const src = Array.isArray(list) ? list : []
  const out = []
  const seen = new Set()
  for (const it of src) {
    const e = normalizeMatter(it)
    if (!e || !e.id || !e.startDate) continue
    const k = String(e.id)
    if (seen.has(k)) continue
    seen.add(k)
    out.push(e)
  }
  return out
}

function flattenMatterList(list) {
  const src = Array.isArray(list) ? list : []
  const out = []
  for (const item of src) {
    if (item && typeof item === 'object' && Array.isArray(item.matterList)) {
      out.push(...item.matterList)
      continue
    }
    out.push(item)
  }
  return out
}

export async function getMatterInfoList({ deviceEmail, startDate, endDate } = {}) {
  const token = getToken()
  const email = await resolveDeviceEmail(deviceEmail)
  const res = await postForm('/calendar/app/getMatterInfoList', {
    token,
    deviceEmail: email,
    deviceemail: email,
    startDate,
    startdate: startDate,
    endDate,
    enddate: endDate,
  })
  const list =
    Array.isArray(res)
      ? res
      : res && typeof res === 'object' && Array.isArray(res.list)
        ? res.list
        : res && typeof res === 'object' && Array.isArray(res.data)
          ? res.data
          : res && typeof res === 'object' && Array.isArray(res.matterList)
            ? res.matterList
            : []
  return flattenMatterList(list)
}

export async function addMatterInfo(payload = {}) {
  const token = getToken()
  const email = await resolveDeviceEmail(payload && payload.deviceEmail)
  const p = payload && typeof payload === 'object' ? payload : {}
  return postForm('/calendar/app/addMatterInfo', {
    token,
    deviceEmail: email,
    deviceemail: email,
    matterTitle: p.matterTitle,
    mattertitle: p.matterTitle,
    isAllDay: p.isAllDay,
    isallday: p.isAllDay,
    startDate: p.startDate,
    startdate: p.startDate,
    endDate: p.endDate,
    enddate: p.endDate,
    startTime: p.startTime,
    starttime: p.startTime,
    endTime: p.endTime,
    endtime: p.endTime,
    isRepeat: p.isRepeat,
    isrepeat: p.isRepeat,
    repeatType: p.repeatType,
    repeattype: p.repeatType,
    isDeadline: p.isDeadline,
    isdeadline: p.isDeadline,
    deadlineDate: p.deadlineDate,
    deadlinedate: p.deadlineDate,
    description: p.description,
    weather: p.weather || '',
    weeks: p.weeks,
    days: p.days,
    members: p.members,
  })
}

export async function updateMatterInfo(payload = {}) {
  const token = getToken()
  const p = payload && typeof payload === 'object' ? payload : {}
  const matterId = p.matterId === undefined || p.matterId === null ? '' : String(p.matterId).trim()
  return postForm('/calendar/app/updateMatterInfo', {
    token,
    matterId,
    matterid: matterId,
    matterTitle: p.matterTitle,
    mattertitle: p.matterTitle,
    isAllDay: p.isAllDay,
    isallday: p.isAllDay,
    startDate: p.startDate,
    startdate: p.startDate,
    endDate: p.endDate,
    enddate: p.endDate,
    startTime: p.startTime,
    starttime: p.startTime,
    endTime: p.endTime,
    endtime: p.endTime,
    isRepeat: p.isRepeat,
    isrepeat: p.isRepeat,
    repeatType: p.repeatType,
    repeattype: p.repeatType,
    isDeadline: p.isDeadline,
    isdeadline: p.isDeadline,
    deadlineDate: p.deadlineDate,
    deadlinedate: p.deadlineDate,
    description: p.description,
    weather: p.weather || '',
    weeks: p.weeks,
    days: p.days,
    members: p.members,
  })
}

export async function deleteMatterInfo({ matterId } = {}) {
  const token = getToken()
  const id = String(matterId || '').trim()
  return postForm('/calendar/app/deleteMatterInfo', { token, matterId: id, matterid: id })
}
