<template>
  <view class="page">
    <BlHeader :title="t('settings.title')" back />

    <view class="card">
      <view class="row" @click="goLanguage">
        <text class="label">{{ t('settings.switchLanguage') }}</text>
        <view class="right">
          <text class="value muted">{{ langText }}</text>
          <image class="chev-img" src="/static/my/icon_chevron_right.png" mode="aspectFit" />
        </view>
      </view>
      <view class="row" @click="goNotice">
        <text class="label">{{ t('settings.pushNotice') }}</text>
        <view class="right"><image class="chev-img" src="/static/my/icon_chevron_right.png" mode="aspectFit" /></view>
      </view>
      <view class="row" @click="restore">
        <text class="label">{{ t('settings.restoreSubscription') }}</text>
        <view class="right"><image class="chev-img" src="/static/my/icon_chevron_right.png" mode="aspectFit" /></view>
      </view>
      <view class="row" @click="goAgreement">
        <text class="label">{{ t('settings.userAgreement') }}</text>
        <view class="right"><image class="chev-img" src="/static/my/icon_chevron_right.png" mode="aspectFit" /></view>
      </view>
      <view class="row" @click="clear">
        <text class="label">{{ t('settings.clearCache') }}</text>
        <view class="right">
          <text class="value muted">{{ cacheText }}</text>
          <image class="chev-img" src="/static/my/icon_chevron_right.png" mode="aspectFit" />
        </view>
      </view>
      <view class="row" @click="goPermissions">
        <text class="label">{{ t('settings.systemPermissions') }}</text>
        <view class="right"><image class="chev-img" src="/static/my/icon_chevron_right.png" mode="aspectFit" /></view>
      </view>
    </view>

    <view class="logout" @click="logout">
      <text class="logout-text">{{ t('settings.logout') }}</text>
    </view>

    <view v-if="restoreVisible" class="dialog-mask" @click="restoreVisible = false">
      <view class="dialog-content" @click.stop>
        <text class="d-title">{{ t('settings.restoreTitle') }}</text>
        <text class="d-sub">{{ t('settings.restoreDesc') }}</text>
        <view class="d-actions">
          <view class="d-btn cancel" @click="restoreVisible = false"><text class="d-btn-text cancel-text">{{ t('settings.cancel') }}</text></view>
          <view class="d-btn confirm" @click="confirmRestore"><text class="d-btn-text confirm-text">{{ t('settings.restoreConfirm') }}</text></view>
        </view>
      </view>
    </view>

    <view v-if="logoutVisible" class="dialog-mask" @click="logoutVisible = false">
      <view class="dialog-content" @click.stop>
        <text class="d-title">{{ t('settings.logoutTitle') }}</text>
        <text class="d-sub">{{ t('settings.logoutDesc') }}</text>
        <view class="d-actions">
          <view class="d-btn cancel" @click="logoutVisible = false"><text class="d-btn-text cancel-text">{{ t('settings.cancel') }}</text></view>
          <view class="d-btn confirm" @click="confirmLogout"><text class="d-btn-text confirm-text">{{ t('settings.confirm') }}</text></view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useI18n } from 'vue-i18n'
import BlHeader from '../../components/BlHeader.vue'
import { clearCache, ensureMeState } from '../../utils/meStore'
import { authApi } from '../../utils/api'
import { getSystemNotificationEnabled, openSystemNotificationSettings } from '../../utils/notificationPermission'
import { getLanguageLabel } from '../../utils/i18n'

const state = ref(ensureMeState())
const restoreVisible = ref(false)
const logoutVisible = ref(false)
const openingNotice = ref(false)
const waitingForNotificationEnable = ref(false)
const { t } = useI18n()

onShow(async () => {
  state.value = ensureMeState()
  if (waitingForNotificationEnable.value) await continueNoticeAfterPermission()
})

const cacheText = computed(() => {
  const v = state.value.settings && typeof state.value.settings.cacheSizeMb === 'number' ? state.value.settings.cacheSizeMb : 0
  return `${v.toFixed(2)}M`
})

const langText = computed(() => {
  const v = state.value.settings && state.value.settings.language ? state.value.settings.language : 'system'
  return getLanguageLabel(v)
})

function goLanguage() {
  uni.navigateTo({ url: '/pages/me/language' })
}

function goPermissions() {
  uni.navigateTo({ url: '/pages/me/permissions' })
}

function goAgreement() {
  uni.navigateTo({ url: '/pages/me/agreement' })
}

async function goNotice() {
  if (openingNotice.value) return
  openingNotice.value = true
  try {
    if (await getSystemNotificationEnabled()) {
      waitingForNotificationEnable.value = false
      uni.navigateTo({ url: '/pages/me/push-notice' })
      return
    }

    waitingForNotificationEnable.value = true
    const opened = await openSystemNotificationSettings()
    if (!opened) {
      waitingForNotificationEnable.value = false
      uni.showToast({ title: t('settings.notificationUnsupported'), icon: 'none' })
    }
  } catch (e) {
    waitingForNotificationEnable.value = false
    uni.showToast({ title: t('settings.notificationFailed'), icon: 'none' })
  } finally {
    openingNotice.value = false
  }
}

async function continueNoticeAfterPermission() {
  try {
    if (!(await getSystemNotificationEnabled())) return
    waitingForNotificationEnable.value = false
    uni.navigateTo({ url: '/pages/me/push-notice' })
  } catch (e) {}
}

function restore() {
  restoreVisible.value = true
}

function confirmRestore() {
  restoreVisible.value = false
  uni.showToast({ title: t('settings.restored'), icon: 'none' })
}

function clear() {
  uni.showModal({
    title: '',
    content: t('settings.clearCacheConfirm'),
    cancelText: t('settings.cancel'),
    confirmText: t('settings.confirm'),
    success: (res) => {
      if (!res.confirm) return
      const s = ensureMeState()
      clearCache(s)
      state.value = ensureMeState()
      uni.showToast({ title: t('settings.cleared'), icon: 'none' })
    },
  })
}

function logout() {
  logoutVisible.value = true
}

async function confirmLogout() {
  logoutVisible.value = false
  uni.showLoading({ title: t('settings.loggingOut') })
  try {
    await authApi.logout()
  } catch (e) {
  } finally {
    try {
      uni.hideLoading()
    } catch (e) {}
    uni.removeStorageSync('auth_logged_in')
    uni.reLaunch({ url: '/pages/login/index' })
  }
}
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: #ffffff;
}

.card {
  margin: 18rpx 28rpx 0;
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
  font-size: 28rpx;
  font-weight: 800;
}

.muted {
  color: rgba(17, 17, 17, 0.45);
}

.chev-img {
  width: 22rpx;
  height: 22rpx;
  opacity: 0.55;
}

.logout {
  margin: 20rpx 28rpx 0;
  height: 104rpx;
  border-radius: 22rpx;
  background: rgba(61, 106, 251, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
}

.logout-text {
  font-size: 32rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.75);
}

.dialog-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 80rpx;
}

.dialog-content {
  width: 100%;
  background: #ffffff;
  border-radius: 32rpx;
  padding: 48rpx 40rpx 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24rpx;
}

.d-title {
  font-size: 36rpx;
  font-weight: 900;
  color: #111111;
}

.d-sub {
  font-size: 28rpx;
  font-weight: 500;
  color: #555555;
  text-align: center;
}

.d-actions {
  margin-top: 24rpx;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.d-btn {
  flex: 1;
  height: 96rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.d-btn.cancel {
  background: #f0f4ff;
}

.d-btn.confirm {
  background: #406DFF;
}

.d-btn-text {
  font-size: 32rpx;
  font-weight: 800;
}

.cancel-text {
  color: #406DFF;
}

.confirm-text {
  color: #ffffff;
}
</style>
