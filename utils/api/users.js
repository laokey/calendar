import { post } from '../request'
import { getToken } from '../authToken'
import { getApiBaseUrl } from '../apiConfig'

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

function safeJsonParse(raw) {
  try {
    return JSON.parse(raw)
  } catch (e) {
    return null
  }
}

function joinUrl(baseURL, url) {
  const b = String(baseURL || '').replace(/\/+$/, '')
  const u = String(url || '').replace(/^\/+/, '')
  if (!b) return `/${u}`
  if (!u) return b
  return `${b}/${u}`
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

function normalizeUserInfo(item) {
  const it = item && typeof item === 'object' ? item : {}
  const userName =
    it.userName !== undefined
      ? it.userName
      : it.username !== undefined
        ? it.username
        : it.nickName !== undefined
          ? it.nickName
          : it.nickname !== undefined
            ? it.nickname
            : it.name !== undefined
              ? it.name
              : ''
  const avatarUrl =
    it.avatarUrl !== undefined
      ? it.avatarUrl
      : it.avatarurl !== undefined
        ? it.avatarurl
        : it.avatar !== undefined
          ? it.avatar
          : ''
  const brithDate =
    it.brithDate !== undefined
      ? it.brithDate
      : it.birthDate !== undefined
        ? it.birthDate
        : it.birthday !== undefined
          ? it.birthday
          : ''
  return {
    userName: normalizeText(userName),
    avatarUrl: normalizeText(avatarUrl),
    brithDate: normalizeText(brithDate),
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

export async function resetPassword({ oldPassword, newPassword } = {}) {
  const token = getToken()
  return postForm('/calendar/app/resetPassword', {
    token,
    oldPassword: normalizeText(oldPassword),
    newPassword: normalizeText(newPassword),
  })
}

export async function updateUserNickname({ nickName } = {}) {
  const token = getToken()
  const name = normalizeText(nickName)
  return postForm('/calendar/app/updateUserNickname', {
    token,
    nickName: name,
    nickname: name,
    name,
  })
}

export async function getUserInfo() {
  const token = getToken()
  const res = await postForm('/calendar/app/getUserInfo', { token })
  return normalizeUserInfo(res)
}

export async function updateUserBrithDate({ brithDate } = {}) {
  const token = getToken()
  return postForm('/calendar/app/updateUserBrithDate', {
    token,
    brithDate: normalizeText(brithDate),
  })
}

export async function updateUserEmailAddress({ newEmail, verifyCode, password } = {}) {
  const token = getToken()
  return postForm('/calendar/app/updateUserEmailAddress', {
    token,
    newEmail: normalizeText(newEmail),
    verifyCode: normalizeText(verifyCode),
    password: normalizeText(password),
  })
}

async function postFormWithFallback(paths, query) {
  const list = Array.isArray(paths) ? paths.filter((x) => String(x || '').trim()) : []
  let lastError = null
  for (const path of list) {
    try {
      return await postForm(path, query)
    } catch (e) {
      lastError = e
      const statusCode = e && typeof e.statusCode === 'number' ? e.statusCode : 0
      if (statusCode === 404) continue
      throw e
    }
  }
  throw lastError || new Error('请求失败')
}

export async function sendEmailVerifyCode({ newEmail } = {}) {
  const token = getToken()
  const email = normalizeText(newEmail)
  return postFormWithFallback(
    [
      '/calendar/app/sendEmailVerifyCode',
      '/calendar/app/sendVerifyCode',
      '/calendar/app/getEmailVerifyCode',
      '/calendar/app/sendEmailCode',
      '/calendar/app/getVerifyCode',
    ],
    {
      token,
      newEmail: email,
      email,
    },
  )
}

export async function updateUserAvatar({ filePath } = {}) {
  const token = getToken()
  const path = normalizeText(filePath)
  if (!token) throw new Error('缺少 token')
  if (!path) throw new Error('请选择图片')

  const baseURL = getApiBaseUrl()
  const url = `${joinUrl(baseURL, '/calendar/app/updateUserAvatar')}${buildQuery({ token })}`

  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url,
      filePath: path,
      name: 'file',
      success: (res) => {
        const status = res && Number.isFinite(res.statusCode) ? res.statusCode : 0
        const raw = res && res.data !== undefined ? res.data : undefined
        if (status < 200 || status >= 300) {
          reject(new Error(`HTTP ${status || 'Error'}`))
          return
        }
        const body = typeof raw === 'string' ? safeJsonParse(raw) : raw
        if (body && typeof body === 'object' && Object.prototype.hasOwnProperty.call(body, 'code')) {
          const ok = body.code === 200 || body.code === 0 || body.code === '200' || body.code === '0'
          if (!ok) {
            const err = new Error(String(body.message || body.msg || body.error || '上传失败'))
            err.code = body.code
            err.data = body
            reject(err)
            return
          }
        }
        resolve(body !== null ? body : raw)
      },
      fail: (e) => {
        reject(e)
      },
    })
  })
}
