<template>
  <view class="page">
    <BlHeader title="编辑信息" back />

    <view class="avatar-wrap">
      <image v-if="profile.avatarUrl" class="avatar" :src="profile.avatarUrl" mode="aspectFill" />
      <view v-else class="avatar ph">
        <image class="ph-logo" src="../../ui/芝麻日历-登录注册/logo.png" mode="aspectFit" />
      </view>
      <view class="cam" @click="chooseAvatar">
        <image class="cam-img" src="/static/my/icon_perm_camera.png" mode="aspectFit" />
      </view>
    </view>

    <view class="card">
      <view class="row" @click="goNickname">
        <text class="label">姓名</text>
        <view class="right">
          <text class="value">{{ profile.name }}</text>
          <image class="chev-img" src="/static/my/icon_chevron_right.png" mode="aspectFit" />
        </view>
      </view>
      <view class="row" @click="goEmail">
        <text class="label">邮箱</text>
        <view class="right">
          <image class="chev-img" src="/static/my/icon_chevron_right.png" mode="aspectFit" />
        </view>
      </view>
      <picker mode="date" :value="birthdayPickerValue" @change="onBirthdayChange">
        <view class="row">
          <text class="label">生日</text>
          <view class="right">
            <text class="value muted">{{ profile.birthday }}</text>
            <image class="chev-img" src="/static/my/icon_chevron_right.png" mode="aspectFit" />
          </view>
        </view>
      </picker>
      <view class="row" @click="goPassword">
        <text class="label">密码</text>
        <view class="right">
          <image class="chev-img" src="/static/my/icon_chevron_right.png" mode="aspectFit" />
        </view>
      </view>
      <view class="row" @click="deleteAccount">
        <view class="left">
          <text class="label">账户删除</text>
          <text class="sub">删除账号后将无法恢复，请谨慎操作</text>
        </view>
        <view class="right">
          <image class="chev-img" src="/static/my/icon_chevron_right.png" mode="aspectFit" />
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import BlHeader from '../../components/BlHeader.vue'
import { ensureMeState, updateProfile } from '../../utils/meStore'

const state = ref(ensureMeState())

onShow(() => {
  state.value = ensureMeState()
})

const profile = computed(() => state.value.profile)

const birthdayPickerValue = computed(() => {
  const v = profile.value.birthday || ''
  const parts = v.split('.')
  if (parts.length === 3) return `${parts[0]}-${parts[1]}-${parts[2]}`
  return '1993-11-12'
})

function chooseAvatar() {
  uni.showActionSheet({
    itemList: ['相机', '从手机相册中选择'],
    success: (res) => {
      const idx = res.tapIndex
      const sourceType = idx === 0 ? ['camera'] : ['album']
      uni.chooseImage({
        count: 1,
        sourceType,
        success: (r) => {
          const path = r && r.tempFilePaths && r.tempFilePaths[0] ? r.tempFilePaths[0] : ''
          if (!path) return
          const s = ensureMeState()
          updateProfile(s, { avatarUrl: path })
          state.value = ensureMeState()
        },
      })
    },
  })
}

function onBirthdayChange(e) {
  const v = e && e.detail && e.detail.value ? String(e.detail.value) : ''
  if (!v) return
  const parts = v.split('-')
  if (parts.length !== 3) return
  const text = `${parts[0]}.${parts[1]}.${parts[2]}`
  const s = ensureMeState()
  updateProfile(s, { birthday: text })
  state.value = ensureMeState()
}

function goNickname() {
  uni.navigateTo({ url: '/pages/me/nickname' })
}

function goEmail() {
  uni.navigateTo({ url: '/pages/me/change-email' })
}

function goPassword() {
  uni.navigateTo({ url: '/pages/me/change-password' })
}

function deleteAccount() {
  uni.showModal({
    title: '',
    content: '删除账号后将无法恢复，请谨慎操作',
    cancelText: '取消',
    confirmText: '确定',
    success: (res) => {
      if (!res.confirm) return
      uni.removeStorageSync('me_state_v1')
      uni.removeStorageSync('auth_logged_in')
      uni.reLaunch({ url: '/pages/login/index' })
    },
  })
}
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: #ffffff;
}

.avatar-wrap {
  margin-top: 26rpx;
  display: flex;
  justify-content: center;
  position: relative;
}

.avatar {
  width: 170rpx;
  height: 170rpx;
  border-radius: 9999rpx;
  background: rgba(17, 17, 17, 0.06);
  overflow: hidden;
}

.ph {
  display: flex;
  align-items: center;
  justify-content: center;
}

.ph-logo {
  width: 110rpx;
  height: 110rpx;
  opacity: 0.9;
}

.cam {
  position: absolute;
  right: 50%;
  bottom: 0;
  transform: translateX(90rpx);
  width: 86rpx;
  height: 86rpx;
  border-radius: 9999rpx;
  background: #3d6afb;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10rpx 30rpx rgba(61, 106, 251, 0.25);
}

.cam-img {
  width: 40rpx;
  height: 40rpx;
  filter: brightness(0) invert(1);
}

.card {
  margin: 24rpx 28rpx 0;
  background: rgba(17, 17, 17, 0.03);
  border-radius: 28rpx;
  overflow: hidden;
}

.row {
  padding: 22rpx 22rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14rpx;
  background: transparent;
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
  color: rgba(17, 17, 17, 0.75);
}

.muted {
  color: rgba(17, 17, 17, 0.45);
}

.chev-img {
  width: 22rpx;
  height: 22rpx;
  opacity: 0.55;
}

.left {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.sub {
  font-size: 24rpx;
  font-weight: 700;
  color: rgba(17, 17, 17, 0.4);
  line-height: 34rpx;
}
</style>
