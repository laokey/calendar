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

export const MEMBER_COLOR_PALETTE = [
  '#ffb020',
  '#ff5a5f',
  '#ff4b3f',
  '#7ddc5a',
  '#4cc38a',
  '#00b060',
  '#00a3ff',
  '#4c8dff',
  '#3d6afb',
  '#9b59ff',
  '#6b2cff',
  '#ff4bd8',
  '#a600a6',
]

export function memberColorIndexOf(hex) {
  const h = String(hex || '').toLowerCase()
  const idx = MEMBER_COLOR_PALETTE.findIndex((x) => String(x).toLowerCase() === h)
  return idx >= 0 ? idx : 0
}

export function memberHexFromColorIndex(idx) {
  const i = Number(idx)
  if (!Number.isFinite(i) || i < 0) return MEMBER_COLOR_PALETTE[0]
  return MEMBER_COLOR_PALETTE[i] || MEMBER_COLOR_PALETTE[0]
}

function glyphFromName(name) {
  const n = String(name || '').trim()
  if (!n) return ''
  return n.length >= 2 ? n.slice(-2, -1) : n.slice(0, 1)
}

function normalizeMember(it) {
  const x = it && typeof it === 'object' ? it : {}
  const memberIdRaw =
    x.memberId !== undefined ? x.memberId : x.memberid !== undefined ? x.memberid : x.id !== undefined ? x.id : ''
  const memberNameRaw =
    x.memberName !== undefined
      ? x.memberName
      : x.membername !== undefined
        ? x.membername
        : x.name !== undefined
          ? x.name
          : ''
  const memberTypeRaw =
    x.memberType !== undefined
      ? x.memberType
      : x.membertype !== undefined
        ? x.membertype
        : x.type !== undefined
          ? x.type
          : 0
  const memberColorRaw =
    x.memberColor !== undefined
      ? x.memberColor
      : x.membercolor !== undefined
        ? x.membercolor
        : x.color !== undefined
          ? x.color
          : 0
  const avatarUrlRaw =
    x.avatarUrl !== undefined
      ? x.avatarUrl
      : x.avatarurl !== undefined
        ? x.avatarurl
        : x.avatar !== undefined
          ? x.avatar
          : ''

  const typeNum = Number(memberTypeRaw)
  const colorNum = Number(memberColorRaw)
  const idStr = memberIdRaw === undefined || memberIdRaw === null ? '' : String(memberIdRaw)

  return {
    memberId: idStr,
    avatarUrl: avatarUrlRaw === undefined || avatarUrlRaw === null ? '' : String(avatarUrlRaw),
    memberName: memberNameRaw === undefined || memberNameRaw === null ? '' : String(memberNameRaw),
    memberType: Number.isFinite(typeNum) ? typeNum : 0,
    memberColor: Number.isFinite(colorNum) ? colorNum : 0,
  }
}

export function mapRemoteMembersToLocalMembers(list) {
  const src = Array.isArray(list) ? list : []
  return src
    .map(normalizeMember)
    .map((m) => {
      const type = Number(m && m.memberType)
      return {
        id: String(m && m.memberId ? m.memberId : ''),
        name: m && m.memberName ? String(m.memberName) : '',
        glyph: glyphFromName(m && m.memberName),
        color: memberHexFromColorIndex(m && m.memberColor),
        enabled: true,
        group: type === 1 ? 'calendarColor' : 'member',
        avatarUrl: m && m.avatarUrl ? String(m.avatarUrl) : '',
      }
    })
    .filter((x) => x && x.id)
}

export async function getMemberList({ deviceEmail } = {}) {
  const token = getToken()
  const email = await resolveDeviceEmail(deviceEmail)
  const res = await postForm('/calendar/app/getMemberList', { token, deviceEmail: email, deviceemail: email })
  const list =
    Array.isArray(res)
      ? res
      : res && typeof res === 'object' && Array.isArray(res.list)
        ? res.list
        : res && typeof res === 'object' && Array.isArray(res.data)
          ? res.data
          : res && typeof res === 'object' && Array.isArray(res.memberList)
            ? res.memberList
            : []
  return list.map(normalizeMember).filter((m) => m && m.memberId)
}

export async function addMemberInfo({ deviceEmail, memberName, memberType, memberColor } = {}) {
  const token = getToken()
  const email = await resolveDeviceEmail(deviceEmail)
  return postForm('/calendar/app/addMemberInfo', {
    token,
    deviceEmail: email,
    deviceemail: email,
    memberName,
    membername: memberName,
    memberType,
    membertype: memberType,
    memberColor,
    membercolor: memberColor,
  })
}

export async function updateMemberInfo({ deviceEmail, memberId, memberName, memberType, memberColor } = {}) {
  const token = getToken()
  const email = await resolveDeviceEmail(deviceEmail)
  const id = String(memberId || '').trim()
  return postForm('/calendar/app/updateMemberInfo', {
    token,
    deviceEmail: email,
    deviceemail: email,
    memberId: id,
    memberid: id,
    memberName,
    membername: memberName,
    memberType,
    membertype: memberType,
    memberColor,
    membercolor: memberColor,
  })
}

export async function deleteMemberInfo({ memberId } = {}) {
  const token = getToken()
  const id = String(memberId || '').trim()
  return postForm('/calendar/app/deleteMemberInfo', { token, memberId: id, memberid: id })
}
