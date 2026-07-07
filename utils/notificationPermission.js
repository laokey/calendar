export async function getSystemNotificationEnabled() {
  const fromUni = await getStatusFromUniApi()
  if (typeof fromUni === 'boolean') return fromUni
  const fromNative = getStatusFromNativeApi()
  if (typeof fromNative === 'boolean') return fromNative
  return true
}

export function openSystemNotificationSettings() {
  return new Promise((resolve) => {
    const openedNative = openSystemNotificationSettingsNative()
    if (openedNative) {
      resolve(true)
      return
    }

    if (typeof uni !== 'undefined' && typeof uni.openAppAuthorizeSetting === 'function') {
      uni.openAppAuthorizeSetting({
        success: () => resolve(true),
        fail: () => resolve(false),
      })
      return
    }
    resolve(false)
  })
}

function getStatusFromUniApi() {
  return new Promise((resolve) => {
    if (typeof uni === 'undefined' || typeof uni.getAppAuthorizeSetting !== 'function') {
      resolve(null)
      return
    }
    try {
      const res = uni.getAppAuthorizeSetting({
        success: (value) => resolveStatusFromUni(value, resolve),
        fail: () => resolve(null),
      })
      if (res && typeof res === 'object') resolveStatusFromUni(res, resolve)
    } catch (e) {
      resolve(null)
    }
  })
}

function resolveStatusFromUni(res, resolve) {
  const status = pickNotificationStatus(res)
  if (!status) {
    resolve(null)
    return
  }
  resolve(status === 'authorized')
}

function pickNotificationStatus(res) {
  if (!res || typeof res !== 'object') return ''
  const candidates = [
    res.notificationAuthorized,
    res.notificationAlertAuthorized,
    res.notificationBadgeAuthorized,
    res.notificationSoundAuthorized,
  ]
  return candidates.find((item) => typeof item === 'string' && item) || ''
}

function getStatusFromNativeApi() {
  if (typeof plus === 'undefined' || !plus.os) return null
  try {
    if (plus.os.name === 'Android') return getAndroidNotificationEnabled()
    if (plus.os.name === 'iOS') return getIosNotificationEnabled()
  } catch (e) {
    return null
  }
  return null
}

function getAndroidNotificationEnabled() {
  try {
    const main = plus.android.runtimeMainActivity()
    let NotificationManagerCompat = null
    try {
      NotificationManagerCompat = plus.android.importClass('androidx.core.app.NotificationManagerCompat')
    } catch (e) {
      NotificationManagerCompat = plus.android.importClass('android.support.v4.app.NotificationManagerCompat')
    }
    return !!NotificationManagerCompat.from(main).areNotificationsEnabled()
  } catch (e) {
    return null
  }
}

function getIosNotificationEnabled() {
  let app = null
  let settings = null
  try {
    app = plus.ios.invoke('UIApplication', 'sharedApplication')
    let types = 0
    settings = plus.ios.invoke(app, 'currentUserNotificationSettings')
    if (settings) {
      types = settings.plusGetAttribute('types')
    } else {
      types = plus.ios.invoke(app, 'enabledRemoteNotificationTypes')
    }
    return Number(types) !== 0
  } catch (e) {
    return null
  } finally {
    try {
      if (settings) plus.ios.deleteObject(settings)
    } catch (e) {}
    try {
      if (app) plus.ios.deleteObject(app)
    } catch (e) {}
  }
}

function openSystemNotificationSettingsNative() {
  if (typeof plus === 'undefined' || !plus.os) return false
  try {
    if (plus.os.name === 'iOS') return openIosSettings()
    if (plus.os.name === 'Android') return openAndroidNotificationSettings()
  } catch (e) {
    return false
  }
  return false
}

function openIosSettings() {
  const app = plus.ios.invoke('UIApplication', 'sharedApplication')
  const setting = plus.ios.invoke('NSURL', 'URLWithString:', 'app-settings:')
  plus.ios.invoke(app, 'openURL:', setting)
  plus.ios.deleteObject(setting)
  plus.ios.deleteObject(app)
  return true
}

function openAndroidNotificationSettings() {
  const main = plus.android.runtimeMainActivity()
  const Intent = plus.android.importClass('android.content.Intent')
  const Build = plus.android.importClass('android.os.Build')
  const packageName = main.getPackageName()
  const uid = main.getApplicationInfo().plusGetAttribute('uid')
  const sdk = Number(Build.VERSION.SDK_INT) || 0

  if (sdk >= 21) {
    try {
      const intent = new Intent('android.settings.APP_NOTIFICATION_SETTINGS')
      if (sdk >= 26) {
        intent.putExtra('android.provider.extra.APP_PACKAGE', packageName)
      } else {
        intent.putExtra('app_package', packageName)
        intent.putExtra('app_uid', uid)
      }
      main.startActivity(intent)
      return true
    } catch (e) {}
  }

  return openAndroidApplicationDetails(main, Intent, packageName)
}

function openAndroidApplicationDetails(main, Intent, packageName) {
  try {
    const Uri = plus.android.importClass('android.net.Uri')
    const intent = new Intent('android.settings.APPLICATION_DETAILS_SETTINGS')
    intent.setData(Uri.parse(`package:${packageName}`))
    main.startActivity(intent)
    return true
  } catch (e) {
    return false
  }
}
