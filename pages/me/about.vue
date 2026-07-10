<template>
  <view class="page">
    <BlHeader title="关于我们" back />

    <view class="hero">
      <image class="logo" src="/static/logo.png" mode="aspectFit" />
      <view class="pill">
        <text class="pill-text">当前版本:V{{ currentVersion }}</text>
      </view>
    </view>

    <view class="card">
      <view class="row" @click="checkUpdate">
        <view class="left">
          <view class="ico"><image class="ico-img" src="/static/my/icon_info.png" mode="aspectFit" /></view>
          <text class="label">版本</text>
        </view>
        <view class="right">
          <text class="value muted">{{ versionStatusText }}</text>
          <image class="chev-img" src="/static/my/icon_chevron_right.png" mode="aspectFit" />
        </view>
      </view>
      <view class="row" @click="open('小红书')">
        <view class="left">
          <view class="ico"><image class="ico-img" src="/static/my/icon_xhs.png" mode="aspectFit" /></view>
          <text class="label">小红书</text>
        </view>
        <view class="right"><image class="chev-img" src="/static/my/icon_chevron_right.png" mode="aspectFit" /></view>
      </view>
      <view class="row" @click="open('微信公众号')">
        <view class="left">
          <view class="ico"><image class="ico-img" src="/static/my/icon_wechat.png" mode="aspectFit" /></view>
          <text class="label">微信公众号</text>
        </view>
        <view class="right"><image class="chev-img" src="/static/my/icon_chevron_right.png" mode="aspectFit" /></view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import BlHeader from '../../components/BlHeader.vue'
import { usersApi } from '../../utils/api'

const FALLBACK_VERSION = '1.0.0'

const currentVersion = ref(resolveCurrentVersion())
const versionInfo = ref(null)
const versionLoading = ref(false)

const latestVersion = computed(() => {
  const v = versionInfo.value && versionInfo.value.latestVersion ? String(versionInfo.value.latestVersion).trim() : ''
  return v || currentVersion.value
})

const hasUpdate = computed(() => compareVersion(latestVersion.value, currentVersion.value) > 0)

const versionStatusText = computed(() => {
  if (versionLoading.value) return '检测中...'
  if (hasUpdate.value) return `发现新版本 V${latestVersion.value}`
  return '已是最新版本'
})

onShow(() => {
  currentVersion.value = resolveCurrentVersion()
  fetchVersionInfo(false)
})

function normalizeVersionText(value) {
  return String(value || '')
    .trim()
    .replace(/^v/i, '')
}

function resolveCurrentVersion() {
  let version = ''
  // #ifdef APP-PLUS
  if (typeof plus !== 'undefined' && plus.runtime && plus.runtime.version) version = plus.runtime.version
  // #endif
  if (!version) {
    try {
      const info = uni.getSystemInfoSync()
      version = info && info.appVersion ? info.appVersion : ''
    } catch (e) {}
  }
  version = normalizeVersionText(version)
  return version || FALLBACK_VERSION
}

function compareVersion(a, b) {
  const pa = normalizeVersionText(a)
    .split('.')
    .map((x) => Number(x) || 0)
  const pb = normalizeVersionText(b)
    .split('.')
    .map((x) => Number(x) || 0)
  const len = Math.max(pa.length, pb.length)
  for (let i = 0; i < len; i += 1) {
    const av = pa[i] || 0
    const bv = pb[i] || 0
    if (av > bv) return 1
    if (av < bv) return -1
  }
  return 0
}

async function fetchVersionInfo(showError) {
  if (versionLoading.value) return versionInfo.value
  versionLoading.value = true
  try {
    const info = await usersApi.getAppVersion()
    versionInfo.value = info
    return info
  } catch (e) {
    if (showError) {
      uni.showToast({ title: String((e && e.message) || '获取版本信息失败'), icon: 'none' })
    }
    return null
  } finally {
    versionLoading.value = false
  }
}

function openDownloadUrl(url) {
  const target = String(url || '').trim()
  if (!target) {
    uni.showToast({ title: '下载地址缺失', icon: 'none' })
    return
  }
  if (typeof plus !== 'undefined' && plus.runtime && typeof plus.runtime.openURL === 'function') {
    plus.runtime.openURL(target)
    return
  }
  if (typeof window !== 'undefined' && typeof window.open === 'function') {
    window.open(target, '_blank')
    return
  }
  uni.setClipboardData({
    data: target,
    success: () => uni.showToast({ title: '下载地址已复制', icon: 'none' }),
  })
}

async function checkUpdate() {
  const info = await fetchVersionInfo(true)
  if (!info) return
  if (!hasUpdate.value) {
    uni.showToast({ title: '已是最新版本', icon: 'none' })
    return
  }
  const content = info.updateLog || `检测到新版本 V${latestVersion.value}，是否立即更新？`
  uni.showModal({
    title: `发现新版本 V${latestVersion.value}`,
    content,
    confirmText: '立即更新',
    cancelText: info.isForce ? '' : '稍后',
    showCancel: !info.isForce,
    success: (res) => {
      if (info.isForce || (res && res.confirm)) openDownloadUrl(info.downloadUrl)
    },
  })
}

function open(title) {
  uni.showToast({ title: `${title}未实现`, icon: 'none' })
}
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: #ffffff;
}

.hero {
  margin-top: 38rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18rpx;
}

.logo {
  width: 220rpx;
  height: 220rpx;
}

.pill {
  height: 70rpx;
  padding: 0 26rpx;
  border-radius: 9999rpx;
  background: rgba(61, 106, 251, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
}

.pill-text {
  font-size: 28rpx;
  font-weight: 900;
  color: #406DFF;
}

.card {
  margin: 22rpx 28rpx 0;
  background: rgba(17, 17, 17, 0.03);
  border-radius: 28rpx;
  overflow: hidden;
}

.row {
  height: 96rpx;
  padding: 0 22rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.row + .row {
  border-top: 2rpx solid rgba(17, 17, 17, 0.06);
}

.left {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.ico {
  width: 44rpx;
  height: 44rpx;
  border-radius: 14rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ico-img {
  width: 40rpx;
  height: 40rpx;
}

.label {
  font-size: 30rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.9);
}

.right {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.value {
  font-size: 26rpx;
  font-weight: 800;
  max-width: 360rpx;
  text-align: right;
}

.muted {
  color: rgba(17, 17, 17, 0.45);
}

.chev-img {
  width: 22rpx;
  height: 22rpx;
  opacity: 0.55;
}
</style>
