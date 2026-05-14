<template>
  <view class="page">
    <view class="profile" :style="{ paddingTop: safeTop + 'px' }" @click="goEdit">
      <image v-if="profile.avatarUrl" class="avatar" :src="profile.avatarUrl" mode="aspectFill" />
      <view v-else class="avatar ph-avatar">
        <image class="ph-logo" src="../../ui/芝麻日历-登录注册/logo.png" mode="aspectFit" />
      </view>
      <view class="p-meta">
        <text class="p-name">{{ profile.name }}</text>
        <text class="p-email">{{ profile.email }}</text>
      </view>
      <text class="chev">›</text>
    </view>

    <view class="quick">
      <view class="q-card blue" @click="goCards">
        <text class="q-title">卡片记录</text>
        <view class="q-ico"><text class="q-ico-text">✉</text></view>
      </view>
      <view class="q-card purple" @click="goDevice">
        <text class="q-title">设备</text>
        <view class="q-ico"><text class="q-ico-text">⌁</text></view>
      </view>
    </view>

    <view class="menu">
      <view class="m-item" @click="openSupport">
        <view class="m-left">
          <view class="m-icon"><text class="m-ico">🎧</text></view>
          <text class="m-text">客服</text>
        </view>
        <text class="m-chev">›</text>
      </view>
      <view class="m-item" @click="openSupport">
        <view class="m-left">
          <view class="m-icon"><text class="m-ico">❔</text></view>
          <text class="m-text">帮助中心</text>
        </view>
        <text class="m-chev">›</text>
      </view>
      <view class="m-item" @click="goCalendar">
        <view class="m-left">
          <view class="m-icon"><text class="m-ico">▦</text></view>
          <text class="m-text">芝麻日历</text>
        </view>
        <text class="m-chev">›</text>
      </view>
      <view class="m-item" @click="goAbout">
        <view class="m-left">
          <view class="m-icon"><text class="m-ico">👤</text></view>
          <text class="m-text">关于我们</text>
        </view>
        <text class="m-chev">›</text>
      </view>
      <view class="m-item" @click="goSettings">
        <view class="m-left">
          <view class="m-icon"><text class="m-ico">⚙</text></view>
          <text class="m-text">设置</text>
        </view>
        <text class="m-chev">›</text>
      </view>
    </view>

    <view v-if="supportVisible" class="mask" @click="supportVisible = false">
      <view class="dialog" @click.stop>
        <text class="d-title">专属客服一对一指导</text>
        <view class="qr">
          <view class="qr-box">
            <text class="qr-text">QR</text>
          </view>
        </view>
        <view class="d-btn" @click="copyWechat">
          <text class="d-btn-text">添加客服微信</text>
        </view>
      </view>
    </view>

    <BlBottomNav active="pause" />
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import BlBottomNav from '../../components/BlBottomNav.vue'
import { ensureMeState } from '../../utils/meStore'

const state = ref(ensureMeState())
const supportVisible = ref(false)

onShow(() => {
  state.value = ensureMeState()
})

const profile = computed(() => state.value.profile)

const safeTop = computed(() => {
  try {
    const info = uni.getSystemInfoSync()
    const insets = info && info.safeAreaInsets ? info.safeAreaInsets : null
    return insets && typeof insets.top === 'number' ? insets.top : 0
  } catch (e) {
    return 0
  }
})

function goEdit() {
  uni.navigateTo({ url: '/pages/me/edit' })
}

function goCards() {
  uni.navigateTo({ url: '/pages/me/card-records' })
}

function goDevice() {
  uni.navigateTo({ url: '/pages/me/device' })
}

function goSettings() {
  uni.navigateTo({ url: '/pages/me/settings' })
}

function goAbout() {
  uni.navigateTo({ url: '/pages/me/about' })
}

function goCalendar() {
  uni.navigateTo({ url: '/pages/calendar/yyo?active=1' })
}

function openSupport() {
  supportVisible.value = true
}

function copyWechat() {
  uni.setClipboardData({
    data: '芝麻日历客服',
    success: () => {
      uni.showToast({ title: '已复制', icon: 'none' })
      supportVisible.value = false
    },
  })
}
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: linear-gradient(180deg, #eaf2ff 0%, #ffffff 55%);
  padding-bottom: 220rpx;
}

.profile {
  padding: 42rpx 28rpx 18rpx;
  display: flex;
  align-items: center;
  gap: 18rpx;
}

.avatar {
  width: 92rpx;
  height: 92rpx;
  border-radius: 9999rpx;
  background: rgba(17, 17, 17, 0.06);
  overflow: hidden;
}

.ph-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
}

.ph-logo {
  width: 64rpx;
  height: 64rpx;
  opacity: 0.9;
}

.p-meta {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.p-name {
  font-size: 40rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.9);
}

.p-email {
  font-size: 26rpx;
  font-weight: 700;
  color: rgba(17, 17, 17, 0.55);
}

.chev {
  font-size: 44rpx;
  font-weight: 700;
  color: rgba(17, 17, 17, 0.35);
}

.quick {
  padding: 0 28rpx;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18rpx;
}

.q-card {
  height: 140rpx;
  border-radius: 28rpx;
  padding: 22rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 10rpx 26rpx rgba(17, 17, 17, 0.06);
}

.q-card.blue {
  background: linear-gradient(135deg, #5aa7ff 0%, #3d6afb 100%);
}

.q-card.purple {
  background: linear-gradient(135deg, #7f7bff 0%, #5c55ff 100%);
}

.q-title {
  font-size: 32rpx;
  font-weight: 900;
  color: #ffffff;
}

.q-ico {
  width: 74rpx;
  height: 74rpx;
  border-radius: 22rpx;
  background: rgba(255, 255, 255, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
}

.q-ico-text {
  color: #ffffff;
  font-size: 34rpx;
  font-weight: 900;
}

.menu {
  margin: 22rpx 28rpx 0;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 28rpx;
  overflow: hidden;
  box-shadow: 0 10rpx 26rpx rgba(17, 17, 17, 0.06);
}

.m-item {
  height: 96rpx;
  padding: 0 22rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.m-item + .m-item {
  border-top: 2rpx solid rgba(17, 17, 17, 0.05);
}

.m-left {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.m-icon {
  width: 52rpx;
  height: 52rpx;
  border-radius: 16rpx;
  background: rgba(17, 17, 17, 0.04);
  display: flex;
  align-items: center;
  justify-content: center;
}

.m-ico {
  font-size: 24rpx;
}

.m-text {
  font-size: 30rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.85);
}

.m-chev {
  font-size: 34rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.25);
}

.mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 28rpx;
}

.dialog {
  width: 100%;
  background: #ffffff;
  border-radius: 28rpx;
  padding: 28rpx 28rpx 26rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18rpx;
}

.d-title {
  font-size: 34rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.9);
}

.qr {
  width: 420rpx;
  height: 420rpx;
  border-radius: 18rpx;
  background: rgba(17, 17, 17, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
}

.qr-box {
  width: 360rpx;
  height: 360rpx;
  border-radius: 18rpx;
  background: rgba(17, 17, 17, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
}

.qr-text {
  color: rgba(17, 17, 17, 0.45);
  font-size: 44rpx;
  font-weight: 900;
}

.d-btn {
  margin-top: 6rpx;
  width: 100%;
  height: 96rpx;
  border-radius: 9999rpx;
  background: #3d6afb;
  display: flex;
  align-items: center;
  justify-content: center;
}

.d-btn-text {
  color: #ffffff;
  font-size: 32rpx;
  font-weight: 900;
}
</style>
