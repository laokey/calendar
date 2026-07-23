<template>
  <view class="page">
    <view class="head" :style="{ paddingTop: safeTop + 'px' }">
      <view class="head-left" @click="back">
        <image class="back-img" src="/static/my/icon_back.png" mode="aspectFit" />
      </view>
      <text class="head-title">{{ $t('编辑信息') }}</text>
      <view class="head-right" />
    </view>

    <view class="avatar-wrap">
      <image v-if="profile.avatarUrl" class="avatar" :src="profile.avatarUrl" mode="aspectFill" />
      <view v-else class="avatar ph">
        <image class="ph-logo" src="/static/logo.png" mode="aspectFit" />
      </view>
      <view class="cam" @click="chooseAvatar">
        <image class="cam-img" src="/static/my/icon_perm_camera.png" mode="aspectFit" />
      </view>
    </view>

    <view class="card">
      <view class="row" @click="goNickname">
        <text class="label">{{ $t('姓名') }}</text>
        <view class="right">
          <text class="value">{{ profile.name }}</text>
          <image class="chev-img" src="/static/my/icon_chevron_right.png" mode="aspectFit" />
        </view>
      </view>
      <view class="row" @click="goEmail">
        <text class="label">{{ $t('邮箱') }}</text>
        <view class="right">
          <image class="chev-img" src="/static/my/icon_chevron_right.png" mode="aspectFit" />
        </view>
      </view>
      <picker mode="date" :value="birthdayPickerValue" @change="onBirthdayChange">
        <view class="row">
          <text class="label">{{ $t('生日') }}</text>
          <view class="right">
            <text class="value">{{ profile.birthday }}</text>
            <image class="chev-img" src="/static/my/icon_chevron_right.png" mode="aspectFit" />
          </view>
        </view>
      </picker>
      <view class="row" @click="goPassword">
        <text class="label">{{ $t('密码') }}</text>
        <view class="right">
          <image class="chev-img" src="/static/my/icon_chevron_right.png" mode="aspectFit" />
        </view>
      </view>
      <view class="row" @click="deleteAccount">
        <view class="left">
          <text class="label">{{ $t('账户删除') }}</text>
          <text class="value">{{ $t('删除账号后将无法恢复，请谨慎操作') }}</text>
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
import { ensureMeState, updateProfile } from '../../utils/meStore'
import { authApi, usersApi } from '../../utils/api'
import { getToken } from '../../utils/authToken'

const state = ref(ensureMeState())

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

const birthdayPickerValue = computed(() => {
  const v = profile.value.birthday || ''
  const parts = v.split('.')
  if (parts.length === 3) return `${parts[0]}-${parts[1]}-${parts[2]}`
  return '1993-11-12'
})

function chooseAvatar() {
  uni.showActionSheet({
    itemList: [uni.$t('相机'), uni.$t('从手机相册中选择')],
    success: (res) => {
      const idx = res.tapIndex
      const sourceType = idx === 0 ? ['camera'] : ['album']
      uni.chooseImage({
        count: 1,
        sourceType,
        success: async (r) => {
          const path = r && r.tempFilePaths && r.tempFilePaths[0] ? r.tempFilePaths[0] : ''
          if (!path) return
          uni.showLoading({ title: uni.$t('上传中') })
          try {
            const res = await usersApi.updateUserAvatar({ filePath: path })
            const avatarUrl =
              typeof res === 'string'
                ? String(res).trim()
                : res && typeof res === 'object'
                  ? String(res.data || res.url || res.avatarUrl || '').trim()
                  : ''
            const s = ensureMeState()
            updateProfile(s, { avatarUrl: avatarUrl || path })
            state.value = ensureMeState()
            uni.showToast({ title: uni.$t('已更新'), icon: 'none' })
          } catch (e) {
            const code = e && e.code !== undefined ? e.code : undefined
            if (code === 201 || code === '201') {
              uni.showToast({ title: uni.$t('用户不存在'), icon: 'none' })
              return
            }
            uni.showToast({ title: String((e && e.message) || uni.$t('上传失败')), icon: 'none' })
          } finally {
            try {
              uni.hideLoading()
            } catch (e) {}
          }
        },
      })
    },
  })
}

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

async function onBirthdayChange(e) {
  const v = e && e.detail && e.detail.value ? String(e.detail.value) : ''
  if (!v) return
  const parts = v.split('-')
  if (parts.length !== 3) return
  const text = `${parts[0]}.${parts[1]}.${parts[2]}`
  uni.showLoading({ title: uni.$t('保存中') })
  try {
    await usersApi.updateUserBrithDate({ brithDate: text })
    const s = ensureMeState()
    updateProfile(s, { birthday: text })
    state.value = ensureMeState()
    uni.showToast({ title: uni.$t('更新成功'), icon: 'none' })
  } catch (e) {
    const code = e && e.code !== undefined ? e.code : undefined
    if (code === 201 || code === '201') {
      uni.showToast({ title: uni.$t('用户不存在'), icon: 'none' })
      return
    }
    uni.showToast({ title: String((e && e.message) || uni.$t('更新失败')), icon: 'none' })
  } finally {
    try {
      uni.hideLoading()
    } catch (e) {}
  }
}

function back() {
  uni.navigateBack()
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
    content: uni.$t('删除账号后将无法恢复，请谨慎操作'),
    cancelText: uni.$t('取消'),
    confirmText: uni.$t('确定'),
    success: async (res) => {
      if (!res.confirm) return
      uni.showLoading({ title: uni.$t('处理中') })
      try {
        const token = getToken()
        const inviterEmail = String(uni.getStorageSync('auth_inviter_email') || '').trim()
        await authApi.unregister({ token, inviterEmail })
      } catch (e) {
      } finally {
        try {
          uni.hideLoading()
        } catch (e) {}
        uni.removeStorageSync('me_state_v1')
        uni.removeStorageSync('auth_logged_in')
        uni.reLaunch({ url: '/pages/login/index' })
      }
    },
  })
}
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: #ffffff;
  padding: 0 28rpx 48rpx;
}

.head {
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.head-left,
.head-right {
  width: 88rpx;
  height: 88rpx;
  display: flex;
  align-items: center;
}

.head-right {
  justify-content: flex-end;
}

.back-img {
  width: 36rpx;
  height: 36rpx;
  display: block;
  opacity: 0.88;
}

.head-title {
  font-size: 34rpx;
  font-weight: 900;
  color: #111111;
}

.avatar-wrap {
  margin-top: 34rpx;
  display: flex;
  justify-content: center;
  position: relative;
}

.avatar {
  width: 200rpx;
  height: 200rpx;
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
  width: 154rpx;
  height: 154rpx;
  opacity: 0.9;
}

.cam {
  position: absolute;
  right: 50%;
  bottom: 0;
  transform: translateX(100rpx);
  width: 62rpx;
  height:62rpx;
  border-radius: 9999rpx;
  background: #3d6afb;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 18rpx rgba(61, 106, 251, 0.22);
  border: 4rpx solid #f7f7f7;
}

.cam-img {
  width: 24rpx;
  height: 24rpx;
  filter: brightness(0) invert(1);
}

.card {
  margin-top: 42rpx;
  background: #fafafa;
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: 0 6rpx 18rpx rgba(17, 17, 17, 0.03);
}

.row {
  min-height: 100rpx;
  padding: 0rpx 24rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
  background: transparent;
}

.row + .row {
  border-top: 1rpx solid rgba(17, 17, 17, 0.05);
}

.label {
  font-size: 30rpx;
  font-weight: 800;
  color: #222222;
}

.right {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.value {
  font-size: 28rpx;
  font-weight: 600;
  color: #b0b0b0;
}

.chev-img {
  width: 20rpx;
  height: 20rpx;
  opacity: 0.42;
}

.left {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.left .value {
  font-size: 24rpx;
  font-weight: 500;
  color: #b4b4b4;
  line-height: 1.4;
}
</style>
