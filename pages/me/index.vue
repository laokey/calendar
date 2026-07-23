<template>
  <view class="page">
    <view class="profile" :style="{ paddingTop: safeTop + 22 + 'px' }" @click="goEdit">
      <image v-if="profile.avatarUrl" class="avatar" :src="profile.avatarUrl" mode="aspectFill" />
      <image v-else class="avatar" src="/static/my/avatar.jpg" mode="aspectFill" />
      <view class="p-meta">
        <text class="p-name">{{ profile.name }}</text>
        <text class="p-email">{{ profile.email }}</text>
      </view>
      <image class="chev-img" src="/static/my/icon_chevron_right.png" mode="aspectFit" />
    </view>

    <view class="quick">
      <view class="q-card blue" @click="goCards">
        <text class="q-title">{{ t('me.cardRecords') }}</text>
        <view class="q-ico"><image class="q-ico-img" src="/static/my/icon_card_record.png" mode="aspectFit" /></view>
      </view>
      <view class="q-card purple" @click="goDevice">
        <text class="q-title">{{ t('me.device') }}</text>
        <view class="q-ico"><image class="q-ico-img" src="/static/my/icon_device_record.png" mode="aspectFit" /></view>
      </view>
    </view>

    <view class="menu">
      <view class="m-item" @click="openSupport">
        <view class="m-left">
          <view class="m-icon"><image class="m-ico-img" src="/static/my/icon_support.png" mode="aspectFit" /></view>
          <text class="m-text">{{ t('me.support') }}</text>
        </view>
        <image class="m-chev-img" src="/static/my/icon_chevron_right.png" mode="aspectFit" />
      </view>
      <view class="m-item" @click="openSupport">
        <view class="m-left">
          <view class="m-icon"><image class="m-ico-img" src="/static/my/icon_help.png" mode="aspectFit" /></view>
          <text class="m-text">{{ t('me.helpCenter') }}</text>
        </view>
        <image class="m-chev-img" src="/static/my/icon_chevron_right.png" mode="aspectFit" />
      </view>
      <view class="m-item" @click="goCalendar">
        <view class="m-left">
          <view class="m-icon"><image class="m-ico-img" src="/static/my/icon_zhima.png" mode="aspectFit" /></view>
          <text class="m-text">{{ t('me.sesameCalendar') }}</text>
        </view>
        <image class="m-chev-img" src="/static/my/icon_chevron_right.png" mode="aspectFit" />
      </view>
      <view class="m-item" @click="goAbout">
        <view class="m-left">
          <view class="m-icon"><image class="m-ico-img" src="/static/my/icon_about.png" mode="aspectFit" /></view>
          <text class="m-text">{{ t('me.about') }}</text>
        </view>
        <image class="m-chev-img" src="/static/my/icon_chevron_right.png" mode="aspectFit" />
      </view>
      <view class="m-item" @click="goSettings">
        <view class="m-left">
          <view class="m-icon"><image class="m-ico-img" src="/static/my/icon_settings.png" mode="aspectFit" /></view>
          <text class="m-text">{{ t('me.settings') }}</text>
        </view>
        <image class="m-chev-img" src="/static/my/icon_chevron_right.png" mode="aspectFit" />
      </view>
    </view>

    <view v-if="supportVisible" class="mask" @click="supportVisible = false">
      <view class="dialog" @click.stop>
        <text class="d-title">{{ t('me.supportTitle') }}</text>
        <view class="qr">
          <view class="qr-box">
            <text class="qr-text">QR</text>
          </view>
        </view>
        <view class="d-btn" @click="copyWechat">
          <text class="d-btn-text">{{ t('me.addSupportWechat') }}</text>
        </view>
      </view>
    </view>

    <BlBottomNav active="pause" />
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useI18n } from 'vue-i18n'
import BlBottomNav from '../../components/BlBottomNav.vue'
import { ensureMeState, updateProfile } from '../../utils/meStore'
import { usersApi } from '../../utils/api'

const state = ref(ensureMeState())
const supportVisible = ref(false)
const { t } = useI18n()

onShow(() => {
  state.value = ensureMeState()
  refreshProfile()
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

async function refreshProfile() {
  const logged = !!uni.getStorageSync('auth_logged_in')
  if (!logged) return
  try {
    const info = await usersApi.getUserInfo()
    const patch = {}
    if (info.userName) {
      patch.name = info.userName
      uni.setStorageSync('auth_name', info.userName)
    }
    if (info.avatarUrl) patch.avatarUrl = info.avatarUrl
    if (info.brithDate) patch.birthday = String(info.brithDate).replace(/-/g, '.')
    if (!Object.keys(patch).length) return
    const s = ensureMeState()
    updateProfile(s, patch)
    state.value = ensureMeState()
  } catch (e) {}
}

function goEdit() {
  uni.navigateTo({ url: '/pages/me/edit' })
}

function goCards() {
  uni.navigateTo({ url: '/pages/me/card-records' })
}

function goDevice() {
  uni.navigateTo({ url: '/pages/device/manage' })
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
    data: t('me.supportWechatName'),
    success: () => {
      uni.showToast({ title: t('me.copied'), icon: 'none' })
      supportVisible.value = false
    },
  })
}
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background-color: #ffffff;
  background-image: url('/static/my/bg_my.png');
  background-repeat: no-repeat;
  background-position: top center;
  background-size: 100% auto;
  padding-bottom: 220rpx;
}

.profile {
  padding: 60rpx 40rpx 20rpx;
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.avatar {
  width: 112rpx;
  height: 112rpx;
  border-radius: 9999rpx;
  background: rgba(17, 17, 17, 0.06);
  overflow: hidden;
}

.p-meta {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.p-name {
  font-size: 40rpx;
  font-weight: 800;
  color: #111111;
}

.p-email {
  font-size: 26rpx;
  font-weight: 500;
  color: #888888;
}

.chev-img {
  width: 32rpx;
  height: 32rpx;
}

.quick {
  padding: 24rpx 32rpx 0;
  display: flex;
  gap: 20rpx;
}

.q-card {
  flex: 1;
  height: 140rpx;
  border-radius: 24rpx;
  padding: 0 0 0 28rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 8rpx 20rpx rgba(17, 17, 17, 0.04);
}

.q-card.blue {
  background:  linear-gradient( 156deg, #2886FF 0%, #DBEAFE 100%);
}

.q-card.purple {
  background: linear-gradient( 156deg, #636BFC 0%, #EEEEFF 100%);
}

.q-title {
  font-size: 30rpx;
  font-weight: 800;
  color: #ffffff;
}

.q-ico {
  width: 96rpx;
  height: 96rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 24rpx;
}

.q-ico-img {
  width: 96rpx;
  height: 96rpx;
}

.menu {
  margin: 32rpx 32rpx 0;
  background: #fafafa;
  border: 2rpx solid rgba(17, 17, 17, 0.06);
  border-radius: 32rpx;
  padding: 16rpx 0;
  box-shadow: 0 8rpx 24rpx rgba(17, 17, 17, 0.03);
}

.m-item {
  height: 104rpx;
  padding: 0 32rpx;
  background: #fafafa;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.m-left {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.m-icon {
  width: 40rpx;
  height: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.m-ico-img {
  width: 36rpx;
  height: 36rpx;
}

.m-text {
  font-size: 30rpx;
  font-weight: 500;
  color: #333333;
}

.m-chev-img {
  width: 24rpx;
  height: 24rpx;
  opacity: 0.4;
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
