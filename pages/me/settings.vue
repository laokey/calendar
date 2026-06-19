<template>
  <view class="page">
    <BlHeader title="设置" back />

    <view class="card">
      <view class="row" @click="goLanguage">
        <text class="label">切换语言</text>
        <view class="right">
          <text class="value muted">{{ langText }}</text>
          <image class="chev-img" src="/static/my/icon_chevron_right.png" mode="aspectFit" />
        </view>
      </view>
      <view class="row" @click="goNotice">
        <text class="label">推送通知</text>
        <view class="right"><image class="chev-img" src="/static/my/icon_chevron_right.png" mode="aspectFit" /></view>
      </view>
      <view class="row" @click="restore">
        <text class="label">恢复订阅</text>
        <view class="right"><image class="chev-img" src="/static/my/icon_chevron_right.png" mode="aspectFit" /></view>
      </view>
      <view class="row" @click="goAgreement">
        <text class="label">用户协议</text>
        <view class="right"><image class="chev-img" src="/static/my/icon_chevron_right.png" mode="aspectFit" /></view>
      </view>
      <view class="row" @click="clear">
        <text class="label">清除缓存</text>
        <view class="right">
          <text class="value muted">{{ cacheText }}</text>
          <image class="chev-img" src="/static/my/icon_chevron_right.png" mode="aspectFit" />
        </view>
      </view>
      <view class="row" @click="goPermissions">
        <text class="label">系统权限管理</text>
        <view class="right"><image class="chev-img" src="/static/my/icon_chevron_right.png" mode="aspectFit" /></view>
      </view>
    </view>

    <view class="logout" @click="logout">
      <text class="logout-text">退出登录</text>
    </view>

    <view v-if="restoreVisible" class="dialog-mask" @click="restoreVisible = false">
      <view class="dialog-content" @click.stop>
        <text class="d-title">恢复订阅？</text>
        <text class="d-sub">已开通Plus会员？您可尝试恢复订阅服务</text>
        <view class="d-actions">
          <view class="d-btn cancel" @click="restoreVisible = false"><text class="d-btn-text cancel-text">取消</text></view>
          <view class="d-btn confirm" @click="confirmRestore"><text class="d-btn-text confirm-text">恢复订阅</text></view>
        </view>
      </view>
    </view>

    <view v-if="logoutVisible" class="dialog-mask" @click="logoutVisible = false">
      <view class="dialog-content" @click.stop>
        <text class="d-title">你确定吗？</text>
        <text class="d-sub">确定要退出登录吗？</text>
        <view class="d-actions">
          <view class="d-btn cancel" @click="logoutVisible = false"><text class="d-btn-text cancel-text">取消</text></view>
          <view class="d-btn confirm" @click="confirmLogout"><text class="d-btn-text confirm-text">确定</text></view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import BlHeader from '../../components/BlHeader.vue'
import { clearCache, ensureMeState } from '../../utils/meStore'

const state = ref(ensureMeState())
const restoreVisible = ref(false)
const logoutVisible = ref(false)

onShow(() => {
  state.value = ensureMeState()
})

const cacheText = computed(() => {
  const v = state.value.settings && typeof state.value.settings.cacheSizeMb === 'number' ? state.value.settings.cacheSizeMb : 0
  return `${v.toFixed(2)}M`
})

const langText = computed(() => {
  const v = state.value.settings && state.value.settings.language ? state.value.settings.language : 'system'
  if (v === 'system') return '遵循系统语言'
  return v
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

function goNotice() {
  uni.navigateTo({ url: '/pages/me/push-notice' })
}

function restore() {
  restoreVisible.value = true
}

function confirmRestore() {
  restoreVisible.value = false
  uni.showToast({ title: '已恢复', icon: 'none' })
}

function clear() {
  uni.showModal({
    title: '',
    content: '确定清除缓存？',
    cancelText: '取消',
    confirmText: '确定',
    success: (res) => {
      if (!res.confirm) return
      const s = ensureMeState()
      clearCache(s)
      state.value = ensureMeState()
      uni.showToast({ title: '已清除', icon: 'none' })
    },
  })
}

function logout() {
  logoutVisible.value = true
}

function confirmLogout() {
  logoutVisible.value = false
  uni.removeStorageSync('auth_logged_in')
  uni.reLaunch({ url: '/pages/login/index' })
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
