import { post } from './request'
import { getToken, getUserId } from './authToken'

const CID_CACHE_KEY = 'push_cid_cache_v1'
const ALIAS_CACHE_KEY = 'push_alias_cache_v1'
const TAGS_CACHE_KEY = 'push_tags_cache_v1'

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

function toFormBody(params) {
  const obj = params && typeof params === 'object' ? params : {}
  const parts = []
  for (const k of Object.keys(obj)) {
    const v = obj[k]
    if (v === undefined || v === null) continue
    parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
  }
  return parts.join('&')
}

function safeJsonParse(raw) {
  try {
    if (raw === undefined || raw === null || raw === '') return null
    return typeof raw === 'string' ? JSON.parse(raw) : raw
  } catch (e) {
    return null
  }
}

function getCachedCid() {
  try {
    return uni.getStorageSync(CID_CACHE_KEY) || ''
  } catch (e) {
    return ''
  }
}

function setCachedCid(cid) {
  try {
    uni.setStorageSync(CID_CACHE_KEY, cid || '')
  } catch (e) {}
}

function getCachedAlias() {
  try {
    return uni.getStorageSync(ALIAS_CACHE_KEY) || ''
  } catch (e) {
    return ''
  }
}

function setCachedAlias(alias) {
  try {
    uni.setStorageSync(ALIAS_CACHE_KEY, alias || '')
  } catch (e) {}
}

function getCachedTags() {
  try {
    const raw = uni.getStorageSync(TAGS_CACHE_KEY)
    return Array.isArray(raw) ? raw : []
  } catch (e) {
    return []
  }
}

function setCachedTags(tags) {
  try {
    uni.setStorageSync(TAGS_CACHE_KEY, Array.isArray(tags) ? tags : [])
  } catch (e) {}
}

export async function reportPushInfoToBackend({ cid, alias, tags } = {}) {
  try {
    const token = getToken()
    if (!token) {
      console.warn('[push] reportPushInfoToBackend skipped: token empty, cid=' + (cid || '') + ', alias=' + (alias || ''))
      return null
    }
    if (!cid && !alias) {
      console.warn('[push] reportPushInfoToBackend skipped: both cid and alias empty')
      return null
    }
    const payload = {
      token,
      cid: cid || '',
      alias: alias || '',
      tags: Array.isArray(tags) && tags.length ? tags.join(',') : '',
      platform: '',
      appVersion: '',
      brand: '',
      model: '',
      osVersion: '',
      sdkVersion: '',
      deviceId: '',
    }
    try {
      const sys = uni.getSystemInfoSync()
      payload.platform = String(sys.platform || '').toLowerCase()
      payload.appVersion = String(sys.appVersion || sys.version || '')
      payload.brand = String(sys.brand || '')
      payload.model = String(sys.model || '')
      payload.osVersion = String(sys.osVersion || '')
      payload.sdkVersion = String(sys.SDKVersion || sys.SDKVersionName || '')
      payload.deviceId = String(sys.deviceId || sys.deviceID || '')
    } catch (e) {}
    console.log('[push] reportPushInfoToBackend payload', payload)
    const result = await post('/calendar/app/bindPushInfo', toFormBody(payload), {
      withAuth: false,
      showErrorToast: false,
      header: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    console.log('[push] reportPushInfoToBackend result', result)
    return result
  } catch (e) {
    console.error('[push] reportPushInfoToBackend error', e)
    return null
  }
}

export async function unbindPushInfoFromBackend({ cid } = {}) {
  try {
    const token = getToken()
    if (!token) {
      console.warn('[push] unbindPushInfoFromBackend skipped: token empty')
      return null
    }
    const payload = { token, cid: cid || '' }
    console.log('[push] unbindPushInfoFromBackend payload', payload)
    const result = await post('/calendar/app/unbindPushInfo', toFormBody(payload), {
      withAuth: false,
      showErrorToast: false,
      header: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    console.log('[push] unbindPushInfoFromBackend result', result)
    return result
  } catch (e) {
    console.error('[push] unbindPushInfoFromBackend error', e)
    return null
  }
}

export function requestIosNotificationAuthorization() {
  return new Promise((resolve) => {
    try {
      if (typeof uni !== 'undefined' && typeof uni.requestSubscribeMessage === 'function') {
        uni.requestSubscribeMessage({
          tmplIds: [],
          complete: () => resolve(true),
        })
        return
      }
    } catch (e) {}
    if (typeof plus === 'undefined' || !plus.os || plus.os.name !== 'iOS') {
      resolve(false)
      return
    }
    try {
      const UIApplication = plus.ios.import('UIApplication')
      const UNUserNotificationCenter = plus.ios.import('UNUserNotificationCenter')
      const app = UIApplication.sharedApplication()
      const center = UNUserNotificationCenter.currentNotificationCenter()
      const block = plus.ios.implementsBlock(
        '(void) (BOOL granted, NSError * _Nullable error)',
        (granted, error) => resolve(!!granted),
      )
      center.requestAuthorizationWithOptionsCompletionHandler(7, block)
      plus.ios.deleteObject(app)
    } catch (e) {
      resolve(false)
    }
  })
}

export function registerAndroidNotificationChannel() {
  if (typeof plus === 'undefined' || !plus.os || plus.os.name !== 'Android') return
  try {
    const Build = plus.android.importClass('android.os.Build')
    if (!Build || Number(Build.VERSION.SDK_INT) < 26) return
    const main = plus.android.runtimeMainActivity()
    const NotificationManager = plus.android.importClass('android.app.NotificationManager')
    const NotificationChannel = plus.android.importClass('android.app.NotificationChannel')
    const manager = main.getSystemService('notification')
    const channels = [
      { id: 'default', name: '默认通知', importance: 4 },
      { id: 'message', name: '消息通知', importance: 4 },
      { id: 'reminder', name: '日程提醒', importance: 5 },
    ]
    channels.forEach((c) => {
      try {
        const channel = new NotificationChannel(c.id, c.name, c.importance)
        manager.createNotificationChannel(channel)
      } catch (e) {}
    })
  } catch (e) {}
}

export async function getPushClientId(options = {}) {
  const force = !!(options && options.force)
  const cached = getCachedCid()
  if (cached && !force) return cached
  return new Promise((resolve) => {
    let settled = false
    const timer = setTimeout(() => {
      if (settled) return
      settled = true
      resolve(getCachedCid())
    }, 6000)
    const finish = (cid) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      const value = cid || ''
      if (value) setCachedCid(value)
      resolve(value)
    }
    try {
      if (typeof uni !== 'undefined' && typeof uni.getPushClientId === 'function') {
        uni.getPushClientId({
          success: (res) => finish(res && (res.cid || res.clientid || res.clientId || '')),
          fail: () => finish(getCachedCid()),
        })
        return
      }
    } catch (e) {}
    try {
      if (typeof plus !== 'undefined' && typeof plus.push === 'object') {
        const info = plus.push.getClientInfo()
        if (info && (info.clientid || info.cid)) {
          finish(info.clientid || info.cid)
          return
        }
      }
    } catch (e) {}
    finish(getCachedCid())
  })
}

export async function setPushAlias(alias) {
  const target = String(alias || '').trim()
  const cached = getCachedAlias()
  if (cached === target && target) return true
  return new Promise((resolve) => {
    if (!target) {
      try {
        if (typeof uni !== 'undefined' && typeof uni.unPushAlias === 'function') {
          uni.unPushAlias({
            alias: cached,
            complete: () => {
              setCachedAlias('')
              resolve(true)
            },
          })
          return
        }
      } catch (e) {}
      try {
        if (typeof plus !== 'undefined' && plus.push) {
          plus.push.unsetAlias(cached || '', () => {
            setCachedAlias('')
            resolve(true)
          })
          return
        }
      } catch (e) {}
      setCachedAlias('')
      resolve(true)
      return
    }
    try {
      if (typeof uni !== 'undefined' && typeof uni.setPushAlias === 'function') {
        uni.setPushAlias({
          alias: target,
          success: () => {
            setCachedAlias(target)
            resolve(true)
          },
          fail: () => resolve(false),
        })
        return
      }
    } catch (e) {}
    try {
      if (typeof plus !== 'undefined' && plus.push) {
        plus.push.setAlias(target, () => {
          setCachedAlias(target)
          resolve(true)
        })
        return
      }
    } catch (e) {}
    resolve(false)
  })
}

export async function setPushTags(tags) {
  const target = Array.isArray(tags) ? tags.map((t) => String(t || '').trim()).filter(Boolean) : []
  const cached = getCachedTags()
  const same =
    cached.length === target.length && cached.every((t, i) => t === target[i])
  if (same && target.length) return true
  return new Promise((resolve) => {
    if (!target.length) {
      try {
        if (typeof uni !== 'undefined' && typeof uni.removePushTags === 'function') {
          uni.removePushTags({
            tags: cached,
            complete: () => {
              setCachedTags([])
              resolve(true)
            },
          })
          return
        }
      } catch (e) {}
      try {
        if (typeof plus !== 'undefined' && plus.push) {
          plus.push.removeTags(cached, () => {
            setCachedTags([])
            resolve(true)
          })
          return
        }
      } catch (e) {}
      setCachedTags([])
      resolve(true)
      return
    }
    try {
      if (typeof uni !== 'undefined' && typeof uni.setPushTags === 'function') {
        uni.setPushTags({
          tags: target,
          success: () => {
            setCachedTags(target)
            resolve(true)
          },
          fail: () => resolve(false),
        })
        return
      }
    } catch (e) {}
    try {
      if (typeof plus !== 'undefined' && plus.push) {
        plus.push.setTags(target, () => {
          setCachedTags(target)
          resolve(true)
        })
        return
      }
    } catch (e) {}
    resolve(false)
  })
}

export function createLocalNotification({ title, content, payload, channelId } = {}) {
  const msgTitle = String(title || '').trim() || '芝麻日历'
  const msgContent = String(content || '').trim() || '您有一条新消息'
  const options = {
    cover: false,
    when: new Date(),
  }
  try {
    if (typeof uni !== 'undefined' && typeof uni.createPushMessage === 'function') {
      uni.createPushMessage({
        title: msgTitle,
        content: msgContent,
        payload: typeof payload === 'object' ? JSON.stringify(payload) : payload || '',
        channel_id: channelId || 'default',
      })
      return true
    }
  } catch (e) {}
  try {
    if (typeof plus !== 'undefined' && plus.push) {
      plus.push.createMessage(
        msgContent,
        typeof payload === 'object' ? JSON.stringify(payload) : payload || '',
        { ...options, title: msgTitle },
      )
      return true
    }
  } catch (e) {}
  return false
}

function normalizePushPayload(res) {
  if (!res || typeof res !== 'object') {
    return { type: '', title: '', content: '', data: null, raw: res }
  }
  const type = res.type || res.messageType || (res.data && res.data.type) || ''
  const title =
    res.title ||
    (res.data && (res.data.title || res.data.aps && res.data.aps.alert && res.data.aps.alert.title)) ||
    ''
  const content =
    res.content ||
    (res.data && (res.data.content || res.data.body || (res.data.aps && res.data.aps.alert && res.data.aps.alert.body))) ||
    ''
  const rawPayload =
    (typeof res.data === 'string' ? safeJsonParse(res.data) : res.data) ||
    (typeof res.payload === 'string' ? safeJsonParse(res.payload) : res.payload) ||
    {}
  const data = rawPayload && typeof rawPayload === 'object' && (rawPayload.payload || rawPayload.data || rawPayload.extra)
    ? (typeof (rawPayload.payload || rawPayload.data || rawPayload.extra) === 'string'
        ? safeJsonParse(rawPayload.payload || rawPayload.data || rawPayload.extra)
        : rawPayload.payload || rawPayload.data || rawPayload.extra)
    : rawPayload
  return {
    type: String(type || ''),
    title: String(title || ''),
    content: String(content || ''),
    data: data && typeof data === 'object' ? data : {},
    raw: res,
  }
}

export function handleOnlinePush(res, options = {}) {
  const { skipLocal = false } = options || {}
  const payload = normalizePushPayload(res)
  const msgType = String((payload.data && payload.data.msgType) || payload.type || '').toLowerCase()
  if (!skipLocal && !res.aps) {
    if (!msgType.startsWith('silent') && !msgType.startsWith('hide') && !msgType.startsWith('none')) {
      createLocalNotification({
        title: payload.title || (payload.data && payload.data.title) || '',
        content: payload.content || (payload.data && payload.data.content) || (payload.data && payload.data.body) || '',
        payload: payload.data,
        channelId: (payload.data && payload.data.channelId) || 'default',
      })
    }
  }
  dispatchPushBusiness(payload.data, { from: 'online' })
  return payload
}

export function handlePushClick(res) {
  const payload = normalizePushPayload(res)
  return dispatchPushBusiness(payload.data, { from: 'click' })
}

function parseNavigatePayload(data) {
  if (!data || typeof data !== 'object') return null
  const url = data.url || data.path || data.page || data.route || data.navigateTo || ''
  if (url) {
    const type = data.navigateType || data.openType || ''
    return {
      type,
      url: String(url),
      params: (data.params && typeof data.params === 'object') ? data.params : {},
    }
  }
  const targetType = data.target || data.pageType || data.bizType || ''
  if (!targetType) return null
  const id = data.id !== undefined ? data.id : data.eventId || data.taskId || data.rewardId || data.cardId || ''
  switch (String(targetType).toLowerCase()) {
    case 'event':
    case 'calendar':
      return { type: 'navigateTo', url: '/pages/calendar/event-detail', params: { id } }
    case 'event_form':
    case 'add_event':
      return { type: 'navigateTo', url: '/pages/calendar/event-form', params: { id } }
    case 'task':
    case 'tasks':
      return { type: 'navigateTo', url: '/pages/tasks/task-detail', params: { id } }
    case 'task_form':
    case 'add_task':
      return { type: 'navigateTo', url: '/pages/tasks/task-form', params: { id } }
    case 'reward':
    case 'rewards':
      return { type: 'navigateTo', url: '/pages/rewards/index', params: { id } }
    case 'reward_form':
    case 'add_reward':
      return { type: 'navigateTo', url: '/pages/rewards/reward-form', params: { id } }
    case 'card':
    case 'cards':
      return { type: 'navigateTo', url: '/pages/cards/index', params: { id } }
    case 'gallery':
    case 'photo':
      return { type: 'navigateTo', url: '/pages/gallery/index', params: { id } }
    case 'sync':
      return { type: 'navigateTo', url: '/pages/sync/sync-home', params: {} }
    case 'me':
    case 'profile':
      return { type: 'switchTab', url: '/pages/me/index', params: {} }
    case 'calendar_home':
      return { type: 'switchTab', url: '/pages/calendar/index', params: {} }
    case 'notice':
      return { type: 'navigateTo', url: '/pages/me/notice', params: {} }
    default:
      return null
  }
}

export function dispatchPushBusiness(data, context = {}) {
  const ctx = context || {}
  const route = parseNavigatePayload(data)
  if (!route || !route.url) {
    try {
      uni.$emit('push:message', { data: data || {}, from: ctx.from || 'unknown' })
    } catch (e) {}
    return null
  }
  let query = ''
  if (route.params && typeof route.params === 'object') {
    const keys = Object.keys(route.params)
    if (keys.length) {
      query =
        '?' +
        keys
          .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(String(route.params[k] ?? ''))}`)
          .join('&')
    }
  }
  const target = `${route.url}${query}`
  const tryNavigate = () => {
    if (route.type === 'switchTab') {
      uni.switchTab({
        url: route.url,
        fail: () => uni.navigateTo({ url: target, fail: () => {} }),
      })
      return
    }
    if (route.type === 'reLaunch') {
      uni.reLaunch({ url: target, fail: () => uni.navigateTo({ url: target, fail: () => {} }) })
      return
    }
    if (route.type === 'redirectTo') {
      uni.redirectTo({ url: target, fail: () => uni.navigateTo({ url: target, fail: () => {} }) })
      return
    }
    uni.navigateTo({
      url: target,
      fail: () => {
        uni.switchTab({
          url: route.url,
          fail: () => {},
        })
      },
    })
  }
  try {
    uni.$emit('push:message', { data: data || {}, from: ctx.from || 'unknown' })
  } catch (e) {}
  if (ctx.from === 'click') {
    setTimeout(() => tryNavigate(), 60)
  }
  return route
}

export function buildUserTags(userId, userProfile) {
  const tags = []
  if (userId) tags.push(`uid_${String(userId)}`)
  try {
    const sys = uni.getSystemInfoSync()
    if (sys.platform) tags.push(`platform_${String(sys.platform).toLowerCase()}`)
    if (sys.osName) tags.push(`os_${String(sys.osName).toLowerCase()}`)
    if (sys.language) tags.push(`lang_${String(sys.language).replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase()}`)
  } catch (e) {}
  if (userProfile) {
    const email =
      userProfile.email !== undefined
        ? userProfile.email
        : userProfile.account !== undefined
          ? userProfile.account
          : ''
    if (email) tags.push(`email_${String(email).toLowerCase().replace(/[^a-z0-9@._-]/g, '_')}`)
  }
  return tags.filter(Boolean)
}

let initDone = false
export async function initPush(options = {}) {
  if (initDone && !(options && options.force)) return
  initDone = true
  try {
    registerAndroidNotificationChannel()
  } catch (e) {}
  try {
    const sys = uni.getSystemInfoSync()
    if (sys && sys.platform && String(sys.platform).toLowerCase() === 'ios') {
      requestIosNotificationAuthorization()
    }
  } catch (e) {}
  const cid = await getPushClientId()
  console.log('cid', cid)
  const userId = getUserId()
  const alias = userId ? String(userId) : ''
  const profileEmail = (() => {
    try {
      return uni.getStorageSync('auth_email') || ''
    } catch (e) {
      return ''
    }
  })()
  if (alias) {
    setPushAlias(alias).catch(() => {})
  }
  const tags = buildUserTags(userId, { email: profileEmail })
  if (tags.length) {
    setPushTags(tags).catch(() => {})
  }
  const token = getToken()
  console.log('[push] initPush check: cid=' + !!cid + ', userId=' + !!userId + ', token=' + !!token)
  if (cid && token) {
    reportPushInfoToBackend({ cid, alias, tags }).catch((e) => console.error('[push] initPush reportPushInfoToBackend catch', e))
  } else {
    console.warn('[push] initPush skip reportPushInfoToBackend: missing cid/userId/token')
  }
}

export async function refreshPushBindingForCurrentUser(userProfile) {
  const userId = getUserId()
  if (!userId) {
    console.log('[push] refreshPushBindingForCurrentUser: no userId, clearing alias/tags')
    await setPushAlias('')
    await setPushTags([])
    return false
  }
  const cid = await getPushClientId({ force: true })
  const alias = String(userId)
  const tags = buildUserTags(userId, userProfile || {})
  const aliasOk = await setPushAlias(alias)
  const tagsOk = await setPushTags(tags)
  const token = getToken()
  console.log('[push] refreshPushBindingForCurrentUser check: cid=' + !!cid + ', userId=' + !!userId + ', token=' + !!token)
  if (cid && userId && token) {
    reportPushInfoToBackend({ cid, alias, tags }).catch((e) => console.error('[push] refreshPushBindingForCurrentUser reportPushInfoToBackend catch', e))
  } else {
    console.warn('[push] refreshPushBindingForCurrentUser skip reportPushInfoToBackend: missing cid/userId/token')
  }
  return aliasOk || tagsOk
}

export async function clearPushBindingOnLogout() {
  const cid = getCachedCid()
  await setPushAlias('')
  await setPushTags([])
  setCachedCid('')
  await unbindPushInfoFromBackend({ cid }).catch(() => {})
  return true
}
