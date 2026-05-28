<template>
  <view class="login-page">
    <view class="hero" :style="{ paddingTop: safeTop + 'px' }">
      <image class="logo" src="/static/logo.png" mode="aspectFit" />
    </view>

    <view class="card">
      <text class="title">登录</text>

      <view class="field">
        <text class="label">邮箱</text>
        <view class="input-wrap">
          <input
            v-model="email"
            class="input"
            placeholder="请输入电子邮箱"
            placeholder-class="ph"
            confirm-type="next"
          />
          <view v-if="email" class="icon-btn" @click="email = ''">
            <text class="icon-text">×</text>
          </view>
        </view>
      </view>

      <view class="field">
        <text class="label">密码</text>
        <view class="input-wrap">
          <input
            v-model="password"
            class="input"
            :password="!showPassword"
            placeholder="请输入密码"
            placeholder-class="ph"
            confirm-type="done"
            @confirm="submit"
          />
          <view v-if="password" class="icon-btn" @click="password = ''">
            <text class="icon-text">×</text>
          </view>
          <view class="icon-btn" @click="showPassword = !showPassword">
            <text class="icon-text eye">{{ showPassword ? '○' : '◉' }}</text>
          </view>
        </view>
      </view>

      <view class="agree-row" @click="agreed = !agreed">
        <view class="checkbox" :class="{ checked: agreed }">
          <text v-if="agreed" class="check">✓</text>
        </view>
        <view class="agree-text">
          <text class="agree-muted">以阅读并同意</text>
          <text class="agree-link" @click.stop="openAgreement('user')">《用户协议》</text>
          <text class="agree-muted">和</text>
          <text class="agree-link" @click.stop="openAgreement('privacy')">《隐私政策》</text>
        </view>
      </view>

      <view class="btn" :class="{ disabled: !canSubmit }" @click="submit">
        <text class="btn-text">登录</text>
      </view>

      <view class="bottom-row">
        <text class="bottom-link" @click="goRegister">注册</text>
        <text class="bottom-link" @click="goReset">忘记密码？</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const email = ref('')
const password = ref('')
const agreed = ref(false)
const showPassword = ref(false)

onLoad(() => {
  const logged = !!uni.getStorageSync('auth_logged_in')
  if (logged) {
    uni.reLaunch({ url: '/pages/device/index' })
  }
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
  return agreed.value && email.value.trim().length > 0 && password.value.trim().length > 0
})

function openAgreement(type) {
  const title = type === 'privacy' ? '隐私政策' : '用户协议'
  uni.showModal({
    title,
    content: '此处为协议内容占位，后续可替换为真实内容或跳转到协议页面。',
    showCancel: false,
  })
}

function goRegister() {
  const v = email.value.trim()
  const url = v ? `/pages/register/index?email=${encodeURIComponent(v)}` : '/pages/register/index'
  uni.navigateTo({ url })
}

function goReset() {
  const v = email.value.trim()
  const url = v ? `/pages/reset-password/index?email=${encodeURIComponent(v)}` : '/pages/reset-password/index'
  uni.navigateTo({ url })
}

function submit() {
  if (!canSubmit.value) {
    if (!email.value.trim()) {
      uni.showToast({ title: '请输入邮箱', icon: 'none' })
      return
    }
    if (!password.value.trim()) {
      uni.showToast({ title: '请输入密码', icon: 'none' })
      return
    }
    if (!agreed.value) {
      uni.showToast({ title: '请先同意协议', icon: 'none' })
      return
    }
    return
  }

  uni.showLoading({ title: '登录中' })
  setTimeout(() => {
    uni.hideLoading()
    uni.setStorageSync('auth_email', email.value.trim())
    uni.setStorageSync('auth_logged_in', true)
    uni.reLaunch({ url: '/pages/device/index' })
  }, 600)
}
</script>

<style scoped lang="scss">
.login-page {
  min-height: 100vh;
  background: #ffffff;
}

.hero {
  height: 360rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo {
  width: 240rpx;
  height: 240rpx;
}

.card {
  margin: -40rpx 28rpx 0;
  background: #ffffff;
  border-radius: 28rpx;
  padding: 34rpx 28rpx 26rpx;
  box-shadow: 0 18rpx 46rpx rgba(17, 17, 17, 0.08);
}

.title {
  display: block;
  text-align: center;
  font-size: 44rpx;
  font-weight: 900;
  color: #111111;
  margin-bottom: 18rpx;
}

.field {
  margin-top: 18rpx;
}

.label {
  display: block;
  font-size: 30rpx;
  font-weight: 700;
  color: rgba(17, 17, 17, 0.8);
  padding: 0 8rpx 14rpx;
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

.icon-text {
  font-size: 40rpx;
  font-weight: 800;
  line-height: 1;
}

.eye {
  font-size: 30rpx;
  font-weight: 900;
}

.agree-row {
  margin-top: 18rpx;
  display: flex;
  align-items: flex-start;
  gap: 14rpx;
  padding: 8rpx 2rpx;
}

.checkbox {
  width: 38rpx;
  height: 38rpx;
  border-radius: 10rpx;
  border: 2rpx solid rgba(17, 17, 17, 0.2);
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 2rpx;
}

.checkbox.checked {
  background: #3d6afb;
  border-color: #3d6afb;
}

.check {
  color: #ffffff;
  font-size: 26rpx;
  font-weight: 900;
  line-height: 1;
}

.agree-text {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 6rpx;
  line-height: 40rpx;
}

.agree-muted {
  font-size: 26rpx;
  font-weight: 650;
  color: rgba(17, 17, 17, 0.55);
}

.agree-link {
  font-size: 26rpx;
  font-weight: 750;
  color: #3d6afb;
}

.btn {
  margin-top: 18rpx;
  height: 100rpx;
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

.bottom-row {
  margin-top: 22rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2rpx 6rpx 0;
}

.bottom-link {
  font-size: 28rpx;
  font-weight: 700;
  color: rgba(17, 17, 17, 0.7);
}
</style>
