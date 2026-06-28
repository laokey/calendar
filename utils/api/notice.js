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

function extractListByKeys(res, keys = []) {
  if (Array.isArray(res)) return res
  if (!res || typeof res !== 'object') return []
  if (Array.isArray(res.list)) return res.list
  if (Array.isArray(res.data)) return res.data
  for (const key of keys) {
    if (Array.isArray(res[key])) return res[key]
  }
  return []
}

function palette() {
  return ['#34c38f', '#ff5a5f', '#ffb020', '#3d6afb', '#9b59ff', '#7cc7ff', '#ff8a3d']
}

function localNameFromEmail(value) {
  const v = normalizeText(value)
  if (!v) return ''
  const idx = v.indexOf('@')
  return idx > 0 ? v.slice(0, idx) : v
}

function glyphFromName(value) {
  const v = normalizeText(value)
  if (!v) return '用'
  return v.slice(0, 1).toUpperCase()
}

function colorFromSeed(value) {
  const seed = normalizeText(value)
  const list = palette()
  if (!seed) return list[0]
  let sum = 0
  for (let i = 0; i < seed.length; i += 1) sum += seed.charCodeAt(i)
  return list[sum % list.length]
}

function parseDateLike(value) {
  const text = normalizeText(value)
  if (!text) return 0
  const normalized = text.replace(/\./g, '-').replace('T', ' ')
  const ts = Date.parse(normalized)
  return Number.isFinite(ts) ? ts : 0
}

function formatTimeText(value) {
  const text = normalizeText(value)
  const ts = parseDateLike(text)
  if (!ts) return text
  const diff = Date.now() - ts
  if (diff < 0) return text
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  if (diff < hour) return `${Math.max(1, Math.floor(diff / minute))}分钟`
  if (diff < day) return `${Math.max(1, Math.floor(diff / hour))}小时`
  if (diff < 7 * day) return `${Math.max(1, Math.floor(diff / day))}天`
  return text
}

function taskIconFromText(value) {
  const text = normalizeText(value)
  if (/跑|步|walk|run/i.test(text)) return 'run'
  return 'bowl'
}

function normalizeDynamicItem(item) {
  const it = item && typeof item === 'object' ? item : {}
  const id = normalizeText(it.dynamicId || it.updateId || it.rewardId || it.taskId || it.id)
  const rawName = normalizeText(it.memberName || it.userName || it.nickName || it.nickname || it.inviterName || it.name)
  const email = normalizeText(it.userEmail || it.email || it.inviterEmail)
  const name = rawName || localNameFromEmail(email) || '成员'
  const updateReason = normalizeText(it.updateReason || it.reason || it.updateType || it.action)
  const points = normalizeInt(
    it.starNumber !== undefined
      ? it.starNumber
      : it.totalNumber !== undefined
        ? it.totalNumber
        : it.points !== undefined
          ? it.points
          : it.score,
    0,
  )
  const action = /取消|撤销|cancel|undone|undo/i.test(updateReason) || points < 0 ? 'cancel' : 'done'
  const title = normalizeText(it.taskTitle || it.rewardTitle || it.title || it.matterTitle || it.noticeTitle) || '任务'
  const updateTime = normalizeText(it.updateTime || it.createTime || it.time)
  const starText = String(Math.abs(points || normalizeInt(it.starNumber, 0) || normalizeInt(it.totalNumber, 0)))
  const color = colorFromSeed(name || email || id)
  return {
    id: id || `${name}|${title}|${updateTime}`,
    who: { name, glyph: glyphFromName(name), color },
    whenText: formatTimeText(updateTime),
    action,
    task: {
      title,
      points: points || (action === 'cancel' ? -normalizeInt(starText, 0) : normalizeInt(starText, 0)),
      icon: taskIconFromText(title),
    },
    detail: {
      dateText: normalizeText(it.timedDate || it.dateText || updateTime || '暂无时间'),
      repeatText: normalizeText(it.repeatText || it.weeks || '每日'),
      starText,
      assignTo: {
        name,
        glyph: glyphFromName(name),
        color,
      },
      doneAtText: `${action === 'done' ? '完成于' : '取消于'} ${updateTime || '--'}`,
    },
    createdAt: updateTime,
    createdAtTs: parseDateLike(updateTime) || Date.now(),
  }
}

function normalizeNoticeItem(item) {
  const it = item && typeof item === 'object' ? item : {}
  const noticeTime = normalizeText(it.noticeTime || it.createTime || it.time)
  const noticeType = normalizeInt(it.noticeType !== undefined ? it.noticeType : it.type, 0)
  const subject = normalizeText(it.noticeTitle || it.subject || it.title) || '系统通知'
  const content = normalizeText(it.noticeContent || it.content || it.preview)
  return {
    id: normalizeText(it.noticeId || it.id) || `${subject}|${noticeTime}`,
    type: noticeType === 0 ? 'message' : 'announce',
    title: noticeType === 0 ? '系统消息' : '系统公告',
    subject,
    timeText: noticeTime,
    preview: content,
    content: content || subject,
  }
}

function normalizeInviteItem(item) {
  const it = item && typeof item === 'object' ? item : {}
  const inviterEmail = normalizeText(it.inviterEmail || it.email)
  const deviceEmail = normalizeText(it.deviceEmail || it.calendarEmail)
  const calendarName = normalizeText(it.deviceName || it.calendarName || deviceEmail) || '日历'
  const name = localNameFromEmail(inviterEmail) || '邀请人'
  const timeText = normalizeText(it.inviteTime || it.createTime || it.time)
  return {
    id: normalizeText(it.inviteId || it.id) || `${inviterEmail}|${deviceEmail}|${timeText}`,
    from: {
      name,
      glyph: glyphFromName(name),
      color: colorFromSeed(inviterEmail || name),
    },
    timeText,
    calendarName,
    status: 'pending',
    inviterEmail,
    deviceEmail,
  }
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

export async function getDynamicList() {
  const token = getToken()
  const res = await postForm('/calendar/app/getDynamicInfoList', { token })
  return extractListByKeys(res, ['dynamicList', 'dynamics', 'activityList', 'updateList']).map(normalizeDynamicItem).filter((x) => x && x.id)
}

export async function getNoticeList() {
  const token = getToken()
  const res = await postForm('/calendar/app/getNoticeInfoList', { token })
  return extractListByKeys(res, ['noticeList', 'notificationList']).map(normalizeNoticeItem).filter((x) => x && x.id)
}

export async function getInviteList() {
  const token = getToken()
  const res = await postForm('/calendar/app/getInviteInfoList', { token })
  return extractListByKeys(res, ['inviteList', 'invitationList', 'deviceInviteList']).map(normalizeInviteItem).filter((x) => x && x.id)
}
