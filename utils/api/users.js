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

function normalizeText(value) {
  return value === undefined || value === null ? '' : String(value).trim()
}

function normalizeInt(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? Math.round(n) : fallback
}

async function postForm(path, query) {
  const header = { 'Content-Type': 'application/x-www-form-urlencoded' }
  return post(`${path}${buildQuery(query)}`, undefined, { withAuth: false, showErrorToast: false, header })
}

function extractList(res, keys) {
  if (Array.isArray(res)) return res
  if (!res || typeof res !== 'object') return []
  if (Array.isArray(res.list)) return res.list
  if (Array.isArray(res.data)) return res.data
  for (const key of keys || []) {
    if (Array.isArray(res[key])) return res[key]
  }
  return []
}

export function permissionFromAuthority(authority) {
  const n = normalizeInt(authority, 0)
  if (n === 2) return 'edit'
  if (n === 1) return 'view'
  return 'self'
}

export function authorityFromPermission(permission) {
  if (permission === 'edit') return 2
  if (permission === 'view') return 1
  return 0
}

function normalizeInvite(item) {
  const it = item && typeof item === 'object' ? item : {}
  const inviterEmail =
    it.inviterEmail !== undefined
      ? it.inviterEmail
      : it.inviteremail !== undefined
        ? it.inviteremail
        : it.fromEmail !== undefined
          ? it.fromEmail
          : ''
  const inviteeEmail =
    it.inviteeEmail !== undefined
      ? it.inviteeEmail
      : it.inviteeemail !== undefined
        ? it.inviteeemail
        : it.toEmail !== undefined
          ? it.toEmail
          : ''
  const status = it.status !== undefined ? it.status : it.inviteStatus !== undefined ? it.inviteStatus : 0
  const inviteTime =
    it.inviteTime !== undefined
      ? it.inviteTime
      : it.invitetime !== undefined
        ? it.invitetime
        : it.time !== undefined
          ? it.time
          : ''
  return {
    id: `${normalizeText(inviterEmail)}|${normalizeText(inviteeEmail)}|${normalizeInt(status, 0)}|${normalizeText(inviteTime)}`,
    inviterEmail: normalizeText(inviterEmail),
    inviteeEmail: normalizeText(inviteeEmail),
    status: normalizeInt(status, 0),
    inviteTime: normalizeText(inviteTime),
  }
}

function normalizeFriend(item) {
  const it = item && typeof item === 'object' ? item : {}
  const friendEmail =
    it.friendEmail !== undefined
      ? it.friendEmail
      : it.friendemail !== undefined
        ? it.friendemail
        : it.email !== undefined
          ? it.email
          : ''
  const addTime =
    it.addTime !== undefined
      ? it.addTime
      : it.addtime !== undefined
        ? it.addtime
        : it.time !== undefined
          ? it.time
          : ''
  const authority = it.authority !== undefined ? it.authority : it.permission !== undefined ? it.permission : 0
  return {
    id: normalizeText(friendEmail),
    friendEmail: normalizeText(friendEmail),
    addTime: normalizeText(addTime),
    authority: normalizeInt(authority, 0),
    permission: permissionFromAuthority(authority),
  }
}

export async function inviteNewFriend({ inviteeEmail } = {}) {
  const token = getToken()
  const email = normalizeText(inviteeEmail)
  return postForm('/calendar/app/inviteNewFriends', {
    token,
    inviteeEmail: email,
    inviteeemail: email,
  })
}

export async function getInviteFriendList({ status } = {}) {
  const token = getToken()
  const nextStatus = normalizeInt(status, 0)
  const res = await postForm('/calendar/app/getInviteFriendList', {
    token,
    status: nextStatus,
  })
  return extractList(res, ['inviteFriendList', 'inviteList', 'friendList']).map(normalizeInvite).filter((x) => x.id)
}

export async function getFriendList() {
  const token = getToken()
  const res = await postForm('/calendar/app/getFriendList', { token })
  return extractList(res, ['friendList', 'friends', 'userList']).map(normalizeFriend).filter((x) => x.friendEmail)
}

export async function agreeAddFriend({ inviterEmail } = {}) {
  const token = getToken()
  const email = normalizeText(inviterEmail)
  return postForm('/calendar/app/agreeAddFriend', {
    token,
    inviterEmail: email,
    inviteremail: email,
  })
}

export async function refuseAddFriend({ inviterEmail } = {}) {
  const token = getToken()
  const email = normalizeText(inviterEmail)
  return postForm('/calendar/app/refuseAddFriend', {
    token,
    inviterEmail: email,
    inviteremail: email,
  })
}

export async function setFriendAuthority({ friendEmail, authority } = {}) {
  const token = getToken()
  const email = normalizeText(friendEmail)
  const nextAuthority = normalizeInt(authority, 0)
  return postForm('/calendar/app/setFriendAuthority', {
    token,
    friendEmail: email,
    friendemail: email,
    authority: nextAuthority,
  })
}
