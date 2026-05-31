<template>
  <view class="page">
    <view class="head" :style="{ paddingTop: safeTop + 'px' }">
      <view class="head-left" @click="back">
        <image class="back-img" src="/static/login/icon_back.png" mode="aspectFit" />
      </view>
      <text class="head-title">重置密码</text>
      <view class="head-right" />
    </view>

    <view class="panel">
      <text class="label">邮箱</text>
      <view class="input-wrap">
        <input v-model="email" class="input" placeholder="请输入邮箱" placeholder-class="ph" confirm-type="done" @confirm="submit" />
        <view v-if="email" class="icon-btn" @click="email = ''"><image class="icon-img" src="/static/login/icon_clear.png" mode="aspectFit" /></view>
      </view>
    </view>

    <view class="btn" :class="{ disabled: !canSubmit }" @click="submit">
      <text class="btn-text">重置密码</text>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const email = ref('')

onLoad((options) => {
  if (options && options.email) email.value = String(options.email)
})

const safeTop = computed(() => {
  try {
    const info = uni.getSystemInfoSync()
    const insets = info && info.safeAreaInsets ? info.safeAreaInsets : null
    return insets && typeof insets.top === 'number' ? insets.top : 0
  } catch (e) {
    return 0
  }
})

const canSubmit = computed(() => {
  return email.value.trim().length > 0
})

function back() {
  uni.navigateBack()
}

function submit() {
  if (!canSubmit.value) {
    uni.showToast({ title: '请输入邮箱', icon: 'none' })
    return
  }

  uni.showLoading({ title: '发送中' })
  setTimeout(() => {
    uni.hideLoading()
    uni.showToast({ title: '已发送重置邮件', icon: 'none' })
    setTimeout(() => {
      uni.navigateBack()
    }, 600)
  }, 700)
}
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background-color: #ffffff;
  background-image: url('/static/login/bg_auth_top.png');
  background-repeat: no-repeat;
  background-position: top center;
  background-size: 100% auto;
  padding: 0 28rpx;
}

.head {
  position: sticky;
  top: 0;
  z-index: 999;
  padding: 18rpx 0 12rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: transparent;
}

.head-left,
.head-right {
  width: 120rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
}

.head-right {
  justify-content: flex-end;
}

.back-img {
  width: 44rpx;
  height: 44rpx;
  display: block;
  opacity: 0.92;
}

.head-title {
  font-size: 34rpx;
  font-weight: 900;
  color: #111111;
}

.panel {
  margin-top: 18rpx;
  background: #ffffff;
  border-radius: 28rpx;
  padding: 26rpx 22rpx 28rpx;
  box-shadow: 0 10rpx 26rpx rgba(17, 17, 17, 0.06);
}

.label {
  display: block;
  font-size: 30rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.78);
  padding: 0 6rpx 14rpx;
}

.input-wrap {
  height: 98rpx;
  border-radius: 22rpx;
  background: #fafafa;
  padding: 0 18rpx;
  display: flex;
  align-items: center;
  gap: 10rpx;
  border: 2rpx solid rgba(17, 17, 17, 0.06);
}

.input {
  flex: 1;
  font-size: 34rpx;
  font-weight: 700;
  color: #111111;
}

.ph {
  color: rgba(17, 17, 17, 0.35);
  font-weight: 650;
}

.icon-btn {
  width: 56rpx;
  height: 56rpx;
  border-radius: 9999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(17, 17, 17, 0.5);
}

.icon-img {
  width: 34rpx;
  height: 34rpx;
  opacity: 0.72;
}

.btn {
  margin-top: 28rpx;
  height: 102rpx;
  border-radius: 9999rpx;
  background: #3d6afb;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn.disabled {
  background: rgba(17, 17, 17, 0.18);
}

.btn-text {
  color: #ffffff;
  font-size: 34rpx;
  font-weight: 900;
}

.btn.disabled .btn-text {
  color: rgba(17, 17, 17, 0.55);
}
</style>
