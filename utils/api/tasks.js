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

function pad2(n) {
  return String(n).padStart(2, '0')
}

function normalizeDateKey(input) {
  const raw = String(input || '').trim()
  if (!raw) return ''
  const head = raw.split('T')[0].split(' ')[0].trim().replace(/\//g, '-')
  const parts = head.split('-').map((x) => String(x || '').trim()).filter(Boolean)
  if (parts.length < 3) return ''
  const y = Number(parts[0])
  const m = Number(parts[1])
  const d = Number(parts[2])
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return ''
  return `${Math.floor(y)}-${pad2(Math.floor(m))}-${pad2(Math.floor(d))}`
}

function normalizeTimeText(input) {
  const raw = String(input || '').trim()
  if (!raw) return ''
  const s = raw.includes(' ') ? raw.split(' ').pop() : raw
  const parts = String(s || '').split(':').map((x) => String(x || '').trim()).filter(Boolean)
  if (parts.length < 2) return ''
  const hh = Number(parts[0])
  const mm = Number(parts[1])
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return ''
  return `${pad2(Math.floor(hh))}:${pad2(Math.floor(mm))}`
}

function extractDateTime(raw) {
  const text = String(raw || '').trim()
  if (!text) return { date: '', time: '' }
  return {
    date: normalizeDateKey(text),
    time: normalizeTimeText(text),
  }
}

function parseMemberList(raw) {
  if (raw === undefined || raw === null) return []
  if (Array.isArray(raw)) return raw
  const text = String(raw || '').trim()
  if (!text) return []
  if ((text.startsWith('[') && text.endsWith(']')) || (text.startsWith('{') && text.endsWith('}'))) {
    const parsed = safeJsonParse(text)
    if (Array.isArray(parsed)) return parsed
    if (parsed && typeof parsed === 'object') return [parsed]
  }
  return text
    .split(',')
    .map((x) => String(x || '').trim())
    .filter(Boolean)
}

function normalizeTaskMembers(raw) {
  const list = parseMemberList(raw)
  return list
    .map((it) => {
      if (it && typeof it === 'object') {
        const memberIdRaw =
          it.memberId !== undefined ? it.memberId : it.memberid !== undefined ? it.memberid : it.id !== undefined ? it.id : ''
        const memberNameRaw =
          it.memberName !== undefined
            ? it.memberName
            : it.membername !== undefined
              ? it.membername
              : it.name !== undefined
                ? it.name
                : ''
        return {
          id: memberIdRaw === undefined || memberIdRaw === null ? '' : String(memberIdRaw),
          name: memberNameRaw === undefined || memberNameRaw === null ? '' : String(memberNameRaw),
        }
      }
      const id = String(it || '').trim()
      return { id, name: '' }
    })
    .filter((x) => x && x.id)
}

function priorityFromRemote(raw) {
  const num = Number(raw)
  if (num === 3) return 'high'
  if (num === 2) return 'mid'
  if (num === 1) return 'low'
  return 'none'
}

function priorityToRemote(raw) {
  if (raw === 'high') return 3
  if (raw === 'mid') return 2
  if (raw === 'low') return 1
  return 0
}

function normalizeTask(it) {
  const x = it && typeof it === 'object' ? it : {}
  const idRaw = x.taskId !== undefined ? x.taskId : x.taskid !== undefined ? x.taskid : x.id !== undefined ? x.id : ''
  const titleRaw =
    x.taskTitle !== undefined
      ? x.taskTitle
      : x.tasktitle !== undefined
        ? x.tasktitle
        : x.title !== undefined
          ? x.title
          : ''
  const finishTimeRaw =
    x.finishTime !== undefined
      ? x.finishTime
      : x.finishtime !== undefined
        ? x.finishtime
        : x.finish_time !== undefined
          ? x.finish_time
          : x.taskDate !== undefined
            ? x.taskDate
            : x.taskdate !== undefined
              ? x.taskdate
              : x.date !== undefined
                ? x.date
                : ''
  const isTimeRaw = x.isTime !== undefined ? x.isTime : x.istime !== undefined ? x.istime : 1
  const isRepeatRaw = x.isRepeat !== undefined ? x.isRepeat : x.isrepeat !== undefined ? x.isrepeat : 0
  const statusRaw = x.status !== undefined ? x.status : x.taskStatus !== undefined ? x.taskStatus : 0
  const members = normalizeTaskMembers(x.members !== undefined ? x.members : x.memberList !== undefined ? x.memberList : x.memberIds)
  const dateTime = extractDateTime(finishTimeRaw)
  const isAllDay = Number(isTimeRaw) === 1 || String(isTimeRaw) === '1'
  const isDone = Number(statusRaw) === 1 || String(statusRaw) === '1'

  return {
    id: idRaw === undefined || idRaw === null ? '' : String(idRaw),
    title: titleRaw === undefined || titleRaw === null ? '' : String(titleRaw),
    emoji: x.emoji === undefined || x.emoji === null ? '' : String(x.emoji),
    dateEnabled: !!dateTime.date,
    date: dateTime.date,
    timeEnabled: !isAllDay && !!dateTime.time,
    time: !isAllDay ? dateTime.time : '',
    repeat: Number(isRepeatRaw) === 1 || String(isRepeatRaw) === '1' ? { unit: 'day', every: 1, id: `rp_${idRaw || Date.now()}` } : null,
    hearts: 0,
    priority: priorityFromRemote(x.priority),
    memberId: members[0] && members[0].id ? members[0].id : 'me',
    members,
    completedAtTs: isDone ? 1 : 0,
    createdAtTs: Date.now(),
    remote: true,
  }
}

function extractTaskListSource(res) {
  const queue = [res]
  const seen = new Set()
  while (queue.length) {
    const cur = queue.shift()
    if (!cur) continue
    if (Array.isArray(cur)) return cur
    if (typeof cur !== 'object') continue
    if (seen.has(cur)) continue
    seen.add(cur)
    const directKeys = ['taskList', 'tasklist', 'taskInfoList', 'taskinfoList', 'list', 'rows', 'records', 'data']
    for (const key of directKeys) {
      if (Array.isArray(cur[key])) return cur[key]
    }
    const nestedKeys = ['data', 'result', 'payload']
    for (const key of nestedKeys) {
      if (cur[key] && typeof cur[key] === 'object') queue.push(cur[key])
    }
  }
  return []
}

function taskListFromResponse(res, fallbackDate = '') {
  const raw = extractTaskListSource(res)
  if (!raw.length) return []
  if (raw.some((item) => Array.isArray(item && (item.tasklist || item.taskList || item.taskInfoList || item.taskinfoList)))) {
    const out = []
    for (const group of raw) {
      const groupDate = normalizeDateKey(
        group &&
          (group.date !== undefined
            ? group.date
            : group.taskDate !== undefined
              ? group.taskDate
              : group.taskdate !== undefined
                ? group.taskdate
                : group.finishTime !== undefined
                  ? group.finishTime
                  : group.finishtime),
      )
      const list = Array.isArray(group && group.tasklist)
        ? group.tasklist
        : Array.isArray(group && group.taskList)
          ? group.taskList
          : Array.isArray(group && group.taskInfoList)
            ? group.taskInfoList
            : Array.isArray(group && group.taskinfoList)
              ? group.taskinfoList
              : []
      const groupMember =
        group && typeof group === 'object'
          ? {
              memberId:
                group.memberId !== undefined
                  ? group.memberId
                  : group.memberid !== undefined
                    ? group.memberid
                    : group.memeberId !== undefined
                      ? group.memeberId
                    : group.id !== undefined
                        ? group.id
                        : '',
              memberName:
                group.memberName !== undefined
                  ? group.memberName
                  : group.membername !== undefined
                    ? group.membername
                    : group.memeberName !== undefined
                      ? group.memeberName
                    : group.name !== undefined
                        ? group.name
                        : '',
            }
          : null
      for (const task of list) {
        const taskMembersRaw =
          task && typeof task === 'object'
            ? task.members !== undefined && task.members !== null
              ? task.members
              : task.memberList !== undefined && task.memberList !== null
                ? task.memberList
                : task.memberIds !== undefined && task.memberIds !== null
                  ? task.memberIds
                  : undefined
            : undefined
        const taskDate =
          normalizeDateKey(
            task &&
              typeof task === 'object' &&
              (task.taskDate !== undefined
                ? task.taskDate
                : task.taskdate !== undefined
                  ? task.taskdate
                  : task.date !== undefined
                    ? task.date
                    : task.finishTime !== undefined
                      ? task.finishTime
                      : task.finishtime),
          ) ||
          groupDate ||
          normalizeDateKey(fallbackDate)
        out.push({
          ...(task && typeof task === 'object' ? task : {}),
          taskDate,
          taskdate: taskDate,
          members:
            taskMembersRaw !== undefined
              ? taskMembersRaw
              : groupMember && groupMember.memberId !== undefined && groupMember.memberId !== null && String(groupMember.memberId).trim()
                ? [groupMember]
                : [],
        })
      }
    }
    return out
  }
  return raw
}

function membersToRemoteValue(payload) {
  const source = Array.isArray(payload && payload.members)
    ? payload.members
    : payload && payload.memberId
      ? [payload.memberId]
      : []
  const ids = source
    .map((it) => {
      if (it && typeof it === 'object') {
        if (it.id !== undefined && it.id !== null) return String(it.id).trim()
        if (it.memberId !== undefined && it.memberId !== null) return String(it.memberId).trim()
        return ''
      }
      return String(it || '').trim()
    })
    .filter(Boolean)
  return JSON.stringify(ids)
}

function finishTimeFromPayload(payload) {
  const p = payload && typeof payload === 'object' ? payload : {}
  if (!p.dateEnabled || !p.date) return ''
  if (p.timeEnabled && p.time) return `${p.date} ${p.time}:00`
  return String(p.date)
}

function normalizeText(input) {
  return input === undefined || input === null ? '' : String(input).trim()
}

function normalizeHexColor6(input) {
  const raw = normalizeText(input)
  if (!raw) return ''
  const stripped = raw.startsWith('#') ? raw.slice(1) : raw
  const expanded =
    stripped.length === 3 ? stripped.split('').map((c) => `${c}${c}`).join('') : stripped.length === 6 ? stripped : ''
  if (!expanded) return ''
  if (!/^[0-9a-fA-F]{6}$/.test(expanded)) return ''
  return expanded.toLowerCase()
}

function extractList(res, keys) {
  if (Array.isArray(res)) return res
  if (!res || typeof res !== 'object') return []
  for (const key of keys || []) {
    if (Array.isArray(res[key])) return res[key]
  }
  if (Array.isArray(res.list)) return res.list
  if (Array.isArray(res.data)) return res.data
  return []
}

function normalizeListType(it) {
  const x = it && typeof it === 'object' ? it : {}
  const idRaw = x.typeId !== undefined ? x.typeId : x.typeid !== undefined ? x.typeid : x.id !== undefined ? x.id : ''
  const titleRaw =
    x.typeName !== undefined
      ? x.typeName
      : x.typename !== undefined
        ? x.typename
        : x.name !== undefined
          ? x.name
          : ''
  const colorRaw =
    x.typeColor !== undefined
      ? x.typeColor
      : x.typecolor !== undefined
        ? x.typecolor
        : x.color !== undefined
          ? x.color
          : '#3d6afb'
  const createdAtRaw =
    x.createTime !== undefined
      ? x.createTime
      : x.createtime !== undefined
        ? x.createtime
        : x.createdAt !== undefined
          ? x.createdAt
          : x.createdAtTs !== undefined
            ? x.createdAtTs
            : 0
  const createdAtTs = Number(createdAtRaw)
  return {
    id: normalizeText(idRaw),
    title: titleRaw === undefined || titleRaw === null ? '' : String(titleRaw),
    color: normalizeText(colorRaw) || '#3d6afb',
    createdAtTs: Number.isFinite(createdAtTs) && createdAtTs > 0 ? createdAtTs : Date.now(),
    remote: true,
  }
}

function normalizeListItem(it) {
  const x = it && typeof it === 'object' ? it : {}
  const idRaw = x.itemId !== undefined ? x.itemId : x.itemid !== undefined ? x.itemid : x.id !== undefined ? x.id : ''
  const textRaw =
    x.itemName !== undefined
      ? x.itemName
      : x.itemname !== undefined
        ? x.itemname
        : x.name !== undefined
          ? x.name
          : x.text !== undefined
            ? x.text
            : ''
  const statusRaw = x.status !== undefined ? x.status : x.itemStatus !== undefined ? x.itemStatus : 0
  const createdAtRaw =
    x.createTime !== undefined
      ? x.createTime
      : x.createtime !== undefined
        ? x.createtime
        : x.createdAt !== undefined
          ? x.createdAt
          : x.createdAtTs !== undefined
            ? x.createdAtTs
            : 0
  const doneAtRaw =
    x.doneAt !== undefined
      ? x.doneAt
      : x.doneAtTs !== undefined
        ? x.doneAtTs
        : x.updateTime !== undefined
          ? x.updateTime
          : x.updatetime !== undefined
            ? x.updatetime
            : 0
  const createdAtTs = Number(createdAtRaw)
  const doneAtTs = Number(doneAtRaw)
  const done = Number(statusRaw) === 1 || String(statusRaw) === '1'
  return {
    id: normalizeText(idRaw),
    text: textRaw === undefined || textRaw === null ? '' : String(textRaw),
    done,
    status: done ? 1 : 0,
    createdAtTs: Number.isFinite(createdAtTs) && createdAtTs > 0 ? createdAtTs : Date.now(),
    doneAtTs: done && Number.isFinite(doneAtTs) && doneAtTs > 0 ? doneAtTs : 0,
    remote: true,
  }
}

export async function getTaskInfoList({ deviceEmail, startDate, endDate } = {}) {
  const token = getToken()
  const email = await resolveDeviceEmail(deviceEmail)
  const normalizedEndDate = normalizeDateKey(endDate || startDate)
  const res = await postForm('/calendar/app/getTaskInfoList', {
    token,
    deviceEmail: email,
    deviceemail: email,
    taskDate: startDate,
    taskdate: startDate,
    taskEndDate: normalizedEndDate,
    taskendDate: normalizedEndDate,
    endDate: normalizedEndDate,
    enddate: normalizedEndDate,
  })
  const parsed = taskListFromResponse(res, startDate)
  const normalized = parsed.map(normalizeTask).filter((x) => x && x.id)
  return normalized
}

export async function addTaskInfo(payload = {}) {
  const token = getToken()
  const email = await resolveDeviceEmail(payload && payload.deviceEmail)
  const members = membersToRemoteValue(payload)
  const taskDate = normalizeDateKey(
    (payload && (payload.taskDate !== undefined ? payload.taskDate : payload.date)) || finishTimeFromPayload(payload),
  )
  return postForm('/calendar/app/addTaskInfo', {
    token,
    deviceEmail: email,
    deviceemail: email,
    taskTitle: payload.taskTitle,
    tasktitle: payload.taskTitle,
    taskDate,
    taskdate: taskDate,
    emoji: payload.emoji || '',
    isTime: payload.timeEnabled ? 0 : 1,
    istime: payload.timeEnabled ? 0 : 1,
    finishTime: finishTimeFromPayload(payload),
    finishtime: finishTimeFromPayload(payload),
    isRepeat: payload.repeat ? 1 : 0,
    isrepeat: payload.repeat ? 1 : 0,
    priority: priorityToRemote(payload.priority),
    members,
  })
}

export async function completeTask({ taskId, memberId, updateReason, starNumber } = {}) {
  const token = getToken()
  const id = String(taskId || '').trim()
  const mid = String(memberId || '').trim()
  const reason = normalizeText(updateReason) || '完成任务'
  const stars = Number(starNumber || 0) || 0
  return postForm('/calendar/app/completeTask', {
    token,
    taskId: id,
    memberId: mid,
    updateReason: reason,
    starNumber: stars,
  })
}

export async function deleteTaskInfo({ taskId } = {}) {
  const token = getToken()
  const id = String(taskId || '').trim()
  return postForm('/calendar/app/deleteTaskInfo', {
    token,
    taskId: id,
    taskid: id,
    recipeId: id,
    recipeid: id,
  })
}

export async function getItemTypeList({ deviceEmail } = {}) {
  const token = getToken()
  const email = await resolveDeviceEmail(deviceEmail)
  const res = await postForm('/calendar/app/getItemTypeList', {
    token,
    deviceEmail: email,
    deviceemail: email,
  })
  return extractList(res, ['itemTypeList', 'typeList', 'itemtypeList']).map(normalizeListType).filter((x) => x && x.id)
}

export async function addItemTypeInfo({ deviceEmail, typeName, typeColor } = {}) {
  const token = getToken()
  const email = await resolveDeviceEmail(deviceEmail)
  const name = normalizeText(typeName)
  const color = normalizeHexColor6(typeColor)
  return postForm('/calendar/app/addItemTypeInfo', {
    token,
    deviceEmail: email,
    typeName: name,
    typeColor: color || undefined,
  })
}

export async function updateItemTypeInfo({ typeId, typeName, typeColor } = {}) {
  const token = getToken()
  const id = normalizeText(typeId)
  const name = normalizeText(typeName)
  const color = normalizeHexColor6(typeColor)
  return postForm('/calendar/app/updateItemTypeInfo', {
    token,
    typeId: id,
    typeName: name,
    typeColor: color || undefined,
  })
}

export async function deleteItemTypeInfo({ typeId } = {}) {
  const token = getToken()
  const id = normalizeText(typeId)
  return postForm('/calendar/app/deleteItemTypeInfo', {
    token,
    typeId: id,
    typeid: id,
  })
}

export async function getItemListByType({ typeId } = {}) {
  const token = getToken()
  const id = normalizeText(typeId)
  const res = await postForm('/calendar/app/getTypeItemlist', {
    token,
    typeId: id,
  })
  return extractList(res, ['itemList', 'iteminfoList', 'itemInfoList']).map(normalizeListItem).filter((x) => x && x.id)
}

export async function addItemInfo({ typeId, itemName } = {}) {
  const token = getToken()
  const id = normalizeText(typeId)
  const name = normalizeText(itemName)
  return postForm('/calendar/app/addItemInfo', {
    token,
    typeId: id,
    typeid: id,
    itemName: name,
    itemname: name,
  })
}

export async function updateItemInfo({ itemId, itemName, status } = {}) {
  const token = getToken()
  const id = normalizeText(itemId)
  const name = normalizeText(itemName)
  const nextStatus = Number(status) === 1 ? 1 : 0
  return postForm('/calendar/app/updateItemInfo', {
    token,
    itemId: id,
    itemid: id,
    itemName: name,
    itemname: name,
    status: nextStatus,
  })
}

export async function deleteItemInfo({ itemId } = {}) {
  const token = getToken()
  const id = normalizeText(itemId)
  return postForm('/calendar/app/deleteItemInfo', {
    token,
    itemId: id,
    itemid: id,
  })
}
