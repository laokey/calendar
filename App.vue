<template>
  <view class="app-root">
    <slot />
  </view>
</template>

<script setup>
import { onLaunch, onShow } from '@dcloudio/uni-app'
import {
  initPush,
  handleOnlinePush,
  handlePushClick,
  refreshPushBindingForCurrentUser,
} from './utils/push'
import { getUserId } from './utils/authToken'
import { usersApi } from './utils/api'

const invitePromptState = {
  lastSignature: '',
  lastCapturedAt: 0,
  modalOpen: false,
  requesting: false,
}

function normalizeText(value) {
  return value === undefined || value === null ? '' : String(value).trim()
}

function safeDecode(value) {
  const text = normalizeText(value)
  if (!text) return ''
  try {
    return decodeURIComponent(text)
  } catch (e) {
    return text
  }
}

function assignInviteParam(target, key, value) {
  const name = normalizeText(key).toLowerCase()
  const text = safeDecode(value)
  if (!text) return
  if (name === 'code' || name === 'invitecode') {
    target.code = text
  } else if (name === 'token') {
    target.token = text
  }
}

function readInviteParamsFromUrl(url, target) {
  const raw = normalizeText(url)
  if (!raw) return
  const queryIndex = raw.indexOf('?')
  const hashIndex = raw.indexOf('#')
  const queryParts = []
  if (queryIndex >= 0) {
    const end = hashIndex >= 0 && hashIndex > queryIndex ? hashIndex : raw.length
    queryParts.push(raw.slice(queryIndex + 1, end))
  }
  if (hashIndex >= 0) {
    const hash = raw.slice(hashIndex + 1)
    if (hash.includes('=')) queryParts.push(hash)
  }
  for (const query of queryParts) {
    for (const pair of String(query || '').split('&')) {
      if (!pair) continue
      const idx = pair.indexOf('=')
      const key = idx >= 0 ? pair.slice(0, idx) : pair
      const value = idx >= 0 ? pair.slice(idx + 1) : ''
      assignInviteParam(target, key, value)
    }
  }
}

function extractInviteParams(options) {
  const out = { token: '', code: '' }
  if (!options || typeof options !== 'object') return out
  const query = options.query && typeof options.query === 'object' ? options.query : {}
  for (const key of Object.keys(query)) assignInviteParam(out, key, query[key])
  readInviteParamsFromUrl(options.path, out)
  readInviteParamsFromUrl(options.url, out)
  readInviteParamsFromUrl(options.href, out)
  readInviteParamsFromUrl(options.scene, out)
  try {
    if (typeof plus !== 'undefined' && plus && plus.runtime) {
      readInviteParamsFromUrl(plus.runtime.arguments, out)
      readInviteParamsFromUrl(plus.runtime.launcher, out)
    }
  } catch (e) {}
  return out
}

function navigateToUsersPending() {
  const pages = typeof getCurrentPages === 'function' ? getCurrentPages() : []
  const current = pages && pages.length ? pages[pages.length - 1] : null
  const route = current && current.route ? `/${current.route}` : ''
  if (route === '/pages/users/index') return
  uni.navigateTo({ url: '/pages/users/index?tab=pending' })
}

function confirmAndAddFriendByInvite(params) {
  const code = normalizeText(params && params.code)
  const token = normalizeText(params && params.token)
  if (!code) return
  const signature = `${token}|${code}`
  const now = Date.now()
  if (
    invitePromptState.modalOpen ||
    invitePromptState.requesting ||
    (invitePromptState.lastSignature === signature && now - invitePromptState.lastCapturedAt < 1500)
  ) return
  invitePromptState.lastSignature = signature
  invitePromptState.lastCapturedAt = now
  invitePromptState.modalOpen = true
  uni.showModal({
    title: '提示',
    content: '收到好友邀请，是否确认添加？',
    confirmText: '确定',
    cancelText: '取消',
    success: async (res) => {
      invitePromptState.modalOpen = false
      if (!(res && res.confirm)) return
      invitePromptState.requesting = true
      try {
        await usersApi.addNewFriendsByLink({ code })
        uni.showModal({
          title: '提示',
          content: '添加好友成功',
          showCancel: false,
          success: () => {
            navigateToUsersPending()
          },
        })
      } catch (e) {
        const codeNum = Number(e && e.code)
        const message =
          codeNum === 201
            ? '用户不存在'
            : codeNum === 202
              ? '邀请码无效'
              : codeNum === 203
                ? '添加好友失败'
                : String((e && e.message) || '添加好友失败')
        uni.showToast({ title: message, icon: 'none' })
      } finally {
        invitePromptState.requesting = false
      }
    },
    fail: () => {
      invitePromptState.modalOpen = false
    },
  })
}

function handleUniversalInvite(options) {
  const params = extractInviteParams(options)
  if (!params.code) return
  setTimeout(() => {
    confirmAndAddFriendByInvite(params)
  }, 120)
}

function startListeningPushEvents() {
  try {
    uni.onPushMessage((res) => {
      try {
        handleOnlinePush(res)
      } catch (e) {}
    })
  } catch (e) {}
  try {
    uni.onPushClick &&
      uni.onPushClick((res) => {
        try {
          handlePushClick(res)
        } catch (e) {}
      })
  } catch (e) {}
  try {
    if (typeof plus !== 'undefined' && plus && plus.push) {
      plus.push.addEventListener &&
        plus.push.addEventListener(
          'click',
          (msg) => {
            try {
              handlePushClick({ type: 'click', data: msg && (msg.payload || msg.content) })
            } catch (e) {}
          },
          false,
        )
      plus.push.addEventListener &&
        plus.push.addEventListener(
          'receive',
          (msg) => {
            try {
              handleOnlinePush({ type: 'receive', data: msg && (msg.payload || msg.content) })
            } catch (e) {}
          },
          false,
        )
    }
  } catch (e) {}
}

onLaunch((options) => {
  try {
    startListeningPushEvents()
  } catch (e) {}
  try {
    initPush()
  } catch (e) {}
  handleUniversalInvite(options)
})

onShow((options) => {
  try {
    const userId = getUserId()
    if (userId) refreshPushBindingForCurrentUser()
  } catch (e) {}
  handleUniversalInvite(options)
})
</script>

<style lang="scss">
page {
  background: linear-gradient(180deg, #eaf2ff 0%, #ffffff 45%);
  color: #111111;
  font-family: "STHeitiSC-Light", "STHeitiSC-Medium", "PingFangSC-Regular", "PingFangSC-Medium", "PingFangSC-Semibold",
    "PingFang SC", "HiraginoSansGB-W3", "HiraginoSansGB-W6", "Hiragino Sans GB", "Heiti SC", "Noto Sans SC", "Microsoft YaHei",
    -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, "AppleColorEmoji", ".AppleColorEmojiUI",
    "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif;
}

page,
view,
text,
input,
textarea,
button {
  font-family: "STHeitiSC-Light", "STHeitiSC-Medium", "PingFangSC-Regular", "PingFangSC-Medium", "PingFangSC-Semibold",
    "PingFang SC", "HiraginoSansGB-W3", "HiraginoSansGB-W6", "Hiragino Sans GB", "Heiti SC", "Noto Sans SC", "Microsoft YaHei",
    -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, "AppleColorEmoji", ".AppleColorEmojiUI",
    "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif;
}

.app-root {
  min-height: 100vh;
}

.bl-page {
  padding: 28rpx 28rpx 300rpx;
}

.bl-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18rpx 8rpx 10rpx;
}

.bl-header-title {
  font-size: 44rpx;
  font-weight: 700;
  letter-spacing: 0.5rpx;
}

.bl-header-center {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
}

.bl-header-back {
  width: 72rpx;
  height: 72rpx;
  border-radius: 9999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bl-icon-btn {
  width: 72rpx;
  height: 72rpx;
  border-radius: 9999rpx;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10rpx 30rpx rgba(17, 17, 17, 0.08);
}

.bl-card {
  background: #ffffff;
  border-radius: 28rpx;
  padding: 22rpx;
  box-shadow: 0 10rpx 26rpx rgba(17, 17, 17, 0.06);
}

.bl-card + .bl-card {
  margin-top: 18rpx;
}

.bl-card-soft {
  background: #eef4ff;
  border-radius: 28rpx;
  padding: 22rpx;
}

.bl-row {
  display: flex;
  align-items: center;
}

.bl-row-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.bl-muted {
  color: rgba(17, 17, 17, 0.55);
}

.bl-divider {
  height: 1rpx;
  background: rgba(17, 17, 17, 0.08);
}

.bl-btn-primary {
  width: 100%;
  height: 96rpx;
  border-radius: 9999rpx;
  background: #3d6afb;
  color: #ffffff;
  font-size: 34rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.bl-btn-primary.is-disabled {
  background: #d7d7d7;
  color: rgba(17, 17, 17, 0.4);
  font-weight: 600;
}

.bl-btn-arrow {
  width: 64rpx;
  height: 64rpx;
  border-radius: 9999rpx;
  background: rgba(255, 255, 255, 0.95);
  color: #3d6afb;
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  right: 16rpx;
  top: 50%;
  transform: translateY(-50%);
}

.bl-btn-secondary {
  padding: 0 26rpx;
  height: 66rpx;
  border-radius: 9999rpx;
  background: #f2f2f2;
  color: rgba(17, 17, 17, 0.9);
  font-size: 28rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bl-btn-secondary.is-dark {
  background: #2d2d2d;
  color: #ffffff;
}

.bl-input {
  width: 100%;
  height: 96rpx;
  border-radius: 24rpx;
  background: rgba(17, 17, 17, 0.04);
  padding: 0 22rpx;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.bl-input-field {
  flex: 1;
  font-size: 34rpx;
  font-weight: 700;
  color: #111111;
}

.bl-input-suffix {
  display: flex;
  align-items: center;
  gap: 10rpx;
  font-size: 30rpx;
  font-weight: 700;
  color: rgba(17, 17, 17, 0.8);
}

.bl-pill {
  padding: 10rpx 16rpx;
  border-radius: 9999rpx;
  font-size: 24rpx;
  font-weight: 700;
  background: #ff9500;
  color: #ffffff;
}

.bl-status-tag {
  position: absolute;
  top: 0;
  right: 0;
  height: 48rpx;
  padding: 0 18rpx;
  border-top-right-radius: 28rpx;
  border-bottom-left-radius: 18rpx;
  background: #3d6afb;
  color: #ffffff;
  font-size: 24rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bl-select-card {
  position: relative;
  padding: 24rpx;
  border-radius: 28rpx;
  background: #ffffff;
  box-shadow: 0 10rpx 26rpx rgba(17, 17, 17, 0.06);
}

.bl-select-card.is-selected {
  border: 4rpx solid #3d6afb;
  box-shadow: 0 10rpx 26rpx rgba(61, 106, 251, 0.14);
}

.bl-select-check {
  position: absolute;
  top: -8rpx;
  right: -8rpx;
  width: 104rpx;
  height: 76rpx;
  border-top-right-radius: 28rpx;
  border-bottom-left-radius: 30rpx;
  background: linear-gradient(135deg, #2f6bff 0%, #4c8dff 100%);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10rpx 22rpx rgba(61, 106, 251, 0.22);
  font-size: 38rpx;
  font-weight: 900;
}

.bl-toast-mask {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  pointer-events: none;
}

.bl-toast {
  width: 420rpx;
  height: 340rpx;
  border-radius: 54rpx;
  background: rgba(0, 0, 0, 0.78);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 22rpx;
  color: #ffffff;
}

.bl-toast-icon {
  width: 120rpx;
  height: 120rpx;
  border-radius: 9999rpx;
  background: rgba(255, 255, 255, 0.95);
  color: #111111;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 72rpx;
  font-weight: 900;
}

.bl-toast-text {
  font-size: 34rpx;
  font-weight: 700;
}

.bl-bottom-nav {
  position: fixed;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  width: 100% !important;
  height: 172rpx !important;
  border-radius: 0 !important;
  background: #ffffff !important;
  box-shadow: 0 -10rpx 30rpx rgba(17, 17, 17, 0.04) !important;
  display: flex !important;
  align-items: stretch !important;
  justify-content: space-between !important;
  padding: 0 !important;
  margin: 0 !important;
  box-sizing: border-box !important;
  z-index: 9999 !important;
}

.bl-bottom-item {
  flex: 1 1 0 !important;
  width: auto !important;
  min-width: 0 !important;
  height: 100% !important;
  border-radius: 0 !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
  color: rgba(17, 17, 17, 0.45) !important;
  background: transparent !important;
  box-shadow: none !important;
  padding: 0 !important;
  margin: 0 !important;
  box-sizing: border-box !important;
}

.bl-bottom-item.is-active {
  width: auto !important;
  min-width: 0 !important;
  height: 100% !important;
  background: transparent !important;
  box-shadow: none !important;
  color: #3d6afb !important;
  border-radius: 0 !important;
}

.bl-bottom-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 9999rpx;
  background: rgba(17, 17, 17, 0.2);
}

.bl-avatar {
  width: 44rpx;
  height: 44rpx;
  border-radius: 9999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 24rpx;
  font-weight: 800;
}
</style>
