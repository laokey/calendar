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

function encodeRemoteEmoji(value) {
  const raw = normalizeText(value)
  if (!raw) return ''
  return `__emoji__:${Array.from(raw).map((ch) => ch.codePointAt(0).toString(16)).join('-')}`
}

function decodeRemoteEmoji(value) {
  const raw = normalizeText(value)
  const match = raw.match(/^__emoji__:([0-9a-f-]+)$/i)
  if (!match) return raw
  try {
    return match[1]
      .split('-')
      .map((part) => String.fromCodePoint(parseInt(part, 16)))
      .join('')
  } catch (e) {
    return raw
  }
}

function normalizeInt(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? Math.round(n) : fallback
}

function normalizeRewardType(value) {
  const n = Number(value)
  return n === 1 ? 1 : 0
}

function normalizeResetFlag(value) {
  return normalizeInt(value, 0) === 1 ? 1 : 0
}

function normalizeMemberIds(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeText(item && typeof item === 'object' ? (item.memberId !== undefined ? item.memberId : item.id) : item))
      .filter(Boolean)
  }
  const raw = normalizeText(value)
  if (!raw) return []
  if (raw.startsWith('[') && raw.endsWith(']')) {
    const parsed = safeJsonParse(raw)
    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => normalizeText(item && typeof item === 'object' ? (item.memberId !== undefined ? item.memberId : item.id) : item))
        .filter(Boolean)
    }
  }
  return raw
    .split(',')
    .map((item) => normalizeText(item))
    .filter(Boolean)
}

function stringifyMemberIds(value) {
  return JSON.stringify(normalizeMemberIds(value))
}

function normalizeRewardMember(item) {
  const it = item && typeof item === 'object' ? item : {}
  const memberId =
    it.memberId !== undefined
      ? it.memberId
      : it.memberid !== undefined
        ? it.memberid
        : it.memeberId !== undefined
          ? it.memeberId
          : it.memeberid !== undefined
            ? it.memeberid
            : it.id !== undefined
              ? it.id
              : ''
  const memberName =
    it.memberName !== undefined
      ? it.memberName
      : it.membername !== undefined
        ? it.membername
        : it.memeberName !== undefined
          ? it.memeberName
          : it.memebername !== undefined
            ? it.memebername
        : it.name !== undefined
          ? it.name
          : ''
  const starNumber =
    it.starNumber !== undefined ? it.starNumber : it.starnumber !== undefined ? it.starnumber : it.stars !== undefined ? it.stars : 0

  return {
    memberId: normalizeText(memberId),
    memberName: normalizeText(memberName),
    starNumber: normalizeInt(starNumber, 0),
  }
}

function normalizeRewardItem(item) {
  const it = item && typeof item === 'object' ? item : {}
  const rewardId =
    it.rewardId !== undefined ? it.rewardId : it.rewardid !== undefined ? it.rewardid : it.id !== undefined ? it.id : ''
  const rewardTitle =
    it.rewardTitle !== undefined
      ? it.rewardTitle
      : it.rewardtitle !== undefined
        ? it.rewardtitle
        : it.title !== undefined
          ? it.title
          : ''
  const emoji = it.emoji !== undefined ? it.emoji : it.icon !== undefined ? it.icon : ''
  const isReset = it.isReset !== undefined ? it.isReset : it.isreset !== undefined ? it.isreset : 0
  const starNumber =
    it.starNumber !== undefined ? it.starNumber : it.starnumber !== undefined ? it.starnumber : it.rewardStar !== undefined ? it.rewardStar : 0
  const rewardType =
    it.rewardType !== undefined ? it.rewardType : it.rewardtype !== undefined ? it.rewardtype : it.typeId !== undefined ? it.typeId : 0
  const description =
    it.description !== undefined ? it.description : it.desc !== undefined ? it.desc : it.rewardDesc !== undefined ? it.rewardDesc : ''

  let members = []
  if (Array.isArray(it.members)) {
    members = it.members.map(normalizeRewardMember).filter((m) => m && m.memberId)
  } else if (Array.isArray(it.memberList)) {
    members = it.memberList.map(normalizeRewardMember).filter((m) => m && m.memberId)
  } else if (it.members !== undefined && it.members !== null) {
    const parsed = safeJsonParse(String(it.members))
    if (Array.isArray(parsed)) {
      members = parsed.map(normalizeRewardMember).filter((m) => m && m.memberId)
    } else {
      const memberIds = normalizeMemberIds(it.members)
      members = memberIds.map((memberId) => ({ memberId, memberName: '', starNumber: 0 }))
    }
  } else if (it.memberId !== undefined || it.memberid !== undefined) {
    const single = normalizeRewardMember(it)
    if (single.memberId) members = [single]
  }

  return {
    rewardId: normalizeText(rewardId),
    rewardTitle: normalizeText(rewardTitle),
    emoji: decodeRemoteEmoji(emoji),
    isReset: normalizeResetFlag(isReset),
    starNumber: normalizeInt(starNumber, 0),
    rewardType: normalizeRewardType(rewardType),
    description: normalizeText(description),
    members,
  }
}

function normalizeStarRecord(item) {
  const it = item && typeof item === 'object' ? item : {}
  const rewardId =
    it.rewardId !== undefined ? it.rewardId : it.rewardid !== undefined ? it.rewardid : it.id !== undefined ? it.id : ''
  const updateReason =
    it.updateReason !== undefined
      ? it.updateReason
      : it.updatereason !== undefined
        ? it.updatereason
        : it.reason !== undefined
          ? it.reason
          : ''
  const starNumber = it.starNumber !== undefined ? it.starNumber : it.starnumber !== undefined ? it.starnumber : 0
  const updateTime =
    it.updateTime !== undefined
      ? it.updateTime
      : it.updatetime !== undefined
        ? it.updatetime
        : it.time !== undefined
          ? it.time
          : ''
  return {
    rewardId: normalizeText(rewardId),
    updateReason: normalizeText(updateReason),
    starNumber: normalizeInt(starNumber, 0),
    updateTime: normalizeText(updateTime),
  }
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

function extractList(res, keys = []) {
  if (Array.isArray(res)) return res
  if (!res || typeof res !== 'object') return []
  if (Array.isArray(res.list)) return res.list
  if (Array.isArray(res.data)) return res.data
  for (const key of keys) {
    if (Array.isArray(res[key])) return res[key]
  }
  return []
}

function flattenMemberRewardGroups(list) {
  const src = Array.isArray(list) ? list : []
  const out = []
  for (const group of src) {
    const member = normalizeRewardMember(group)
    const rewardList =
      Array.isArray(group && group.rlist)
        ? group.rlist
        : Array.isArray(group && group.rewardList)
          ? group.rewardList
          : Array.isArray(group && group.list)
            ? group.list
            : []
    for (const reward of rewardList) {
      const normalized = normalizeRewardItem(reward)
      if (!normalized.rewardId) continue
      out.push({
        ...normalized,
        members: member.memberId ? [member] : normalized.members,
      })
    }
  }
  return out
}

export function mapRemoteRewardsToLocalItems(list) {
  const rewards = Array.isArray(list) ? list : []
  const out = []
  for (const reward of rewards) {
    const members = Array.isArray(reward.members) ? reward.members : []
    if (!members.length) {
      out.push({
        id: reward.rewardId,
        rewardId: reward.rewardId,
        title: reward.rewardTitle,
        emoji: reward.emoji,
        hearts: reward.starNumber,
        resetAfter: reward.isReset === 1,
        memberId: '',
        memberName: '',
        type: reward.rewardType === 1 ? 'punish' : 'reward',
        desc: reward.description,
      })
      continue
    }
    for (const member of members) {
      out.push({
        id: reward.rewardId,
        rewardId: reward.rewardId,
        title: reward.rewardTitle,
        emoji: reward.emoji,
        hearts: reward.starNumber,
        resetAfter: reward.isReset === 1,
        memberId: member.memberId,
        memberName: member.memberName,
        memberBalance: member.starNumber,
        type: reward.rewardType === 1 ? 'punish' : 'reward',
        desc: reward.description,
      })
    }
  }
  return out
}

export function collectMemberBalancesFromRewards(list) {
  const rewards = Array.isArray(list) ? list : []
  const map = {}
  for (const reward of rewards) {
    const members = Array.isArray(reward.members) ? reward.members : []
    for (const member of members) {
      if (!member || !member.memberId) continue
      if (map[member.memberId] === undefined) map[member.memberId] = Number(member.starNumber || 0) || 0
    }
  }
  return map
}

export async function getMemberRewardList({ deviceEmail, rewardType, typeId } = {}) {
  const token = getToken()
  const email = await resolveDeviceEmail(deviceEmail)
  const type = typeId !== undefined ? normalizeRewardType(typeId) : normalizeRewardType(rewardType)
  const res = await postForm('/calendar/app/getMemberRewardList', {
    token,
    deviceEmail: email,
    rewardType: type,
    typeId: type,
  })
  const list = extractList(res, ['rewardList', 'memberRewardList', 'rewardInfoList'])
  if (list.some((item) => Array.isArray(item && item.rlist))) {
    const flattened = flattenMemberRewardGroups(list)
    return flattened
  }
  const normalized = list.map(normalizeRewardItem).filter((x) => x && x.rewardId)
  return normalized
}

export async function getRewardInfo({ rewardId } = {}) {
  const token = getToken()
  const id = normalizeText(rewardId)
  const res = await postForm('/calendar/app/getRewardInfo', {
    token,
    rewardId: id,
    rewardid: id,
  })
  return normalizeRewardItem(res && typeof res === 'object' && res.data && typeof res.data === 'object' ? res.data : res)
}

export async function addRewardInfo({ deviceEmail, rewardTitle, emoji, isReset, starNumber, rewardType, members, description } = {}) {
  const token = getToken()
  const email = await resolveDeviceEmail(deviceEmail)
  const memberIds = stringifyMemberIds(members)
  return postForm('/calendar/app/addRewardInfo', {
    token,
    deviceEmail: email,
    rewardTitle: normalizeText(rewardTitle),
    emoji: encodeRemoteEmoji(emoji),
    isReset: normalizeResetFlag(isReset),
    starNumber: normalizeInt(starNumber, 0),
    rewardType: normalizeRewardType(rewardType),
    members: memberIds,
    description: normalizeText(description),
  })
}

export async function updateRewardInfo({ deviceEmail, rewardId, rewardTitle, emoji, isReset, starNumber, rewardType, members, description } = {}) {
  const token = getToken()
  const email = await resolveDeviceEmail(deviceEmail)
  const id = normalizeText(rewardId)
  const memberIds = stringifyMemberIds(members)
  return postForm('/calendar/app/updateRewardInfo', {
    token,
    deviceEmail: email,
    deviceemail: email,
    rewardId: id,
    rewardid: id,
    rewardTitle: normalizeText(rewardTitle),
    rewardtitle: normalizeText(rewardTitle),
    emoji: encodeRemoteEmoji(emoji),
    isReset: normalizeResetFlag(isReset),
    isreset: normalizeResetFlag(isReset),
    starNumber: normalizeInt(starNumber, 0),
    starnumber: normalizeInt(starNumber, 0),
    rewardType: normalizeRewardType(rewardType),
    rewardtype: normalizeRewardType(rewardType),
    members: memberIds,
    description: normalizeText(description),
  })
}

export async function deleteRewardInfo({ rewardId } = {}) {
  const token = getToken()
  const id = normalizeText(rewardId)
  return postForm('/calendar/app/deleteRewardInfo', {
    token,
    rewardId: id,
  })
}

export async function addStarNumberInfo({ memberId, rewardId, updateReason, starNumber } = {}) {
  const token = getToken()
  const member = normalizeText(memberId)
  const reward = normalizeText(rewardId)
  return postForm('/calendar/app/addStarNumberInfo', {
    token,
    memberId: member,
    memberid: member,
    rewardId: reward,
    rewardid: reward,
    updateReason: normalizeText(updateReason),
    updatereason: normalizeText(updateReason),
    starNumber: normalizeInt(starNumber, 0),
    starnumber: normalizeInt(starNumber, 0),
  })
}

export async function getStarNumberList({ memberId } = {}) {
  const token = getToken()
  const member = normalizeText(memberId)
  const res = await postForm('/calendar/app/getStarNumberList', {
    token,
    memberId: member,
    memberid: member,
  })
  return extractList(res, ['starNumberList', 'rewardStarList', 'recordList']).map(normalizeStarRecord)
}
