<template>
  <view class="page">
    <view class="head" :style="{ paddingTop: safeTop + 'px' }">
      <view class="head-left" @click="back">
        <image class="back-img" src="/static/login/icon_back.png" mode="aspectFit" />
      </view>
      <text class="head-title">注册</text>
      <view class="head-right" />
    </view>

    <text class="hint">请输入您的163电子邮箱</text>

    <view class="panel">
      <view class="field">
        <text class="label">邮箱</text>
        <view class="input-wrap">
          <input
            v-model="email"
            type="email"
            class="input"
            placeholder="请输入邮箱"
            placeholder-class="ph"
            confirm-type="next"
            @blur="onEmailBlur"
            @confirm="onEmailConfirm"
          />
          <view v-if="email" class="icon-btn" @click="email = ''"><image class="icon-img" src="/static/login/icon_clear.png" mode="aspectFit" /></view>
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
            confirm-type="next"
          />
          <view v-if="password" class="icon-btn" @click="password = ''"><image class="icon-img" src="/static/login/icon_clear.png" mode="aspectFit" /></view>
          <view class="icon-btn" @click="showPassword = !showPassword">
            <image class="icon-img" :src="showPassword ? '/static/login/icon_eye_open.png' : '/static/login/icon_eye_closed.png'" mode="aspectFit" />
          </view>
        </view>
      </view>

      <view class="field">
        <text class="label">姓名</text>
        <view class="input-wrap">
          <input v-model="name" class="input" placeholder="请输入姓名" placeholder-class="ph" confirm-type="done" @confirm="submit" />
          <view v-if="name" class="icon-btn" @click="name = ''"><image class="icon-img" src="/static/login/icon_clear.png" mode="aspectFit" /></view>
        </view>
      </view>

      <text class="tip">当前注册仅支持163邮箱。</text>
    </view>

    <view class="btn" :class="{ disabled: !canSubmit }" @click="submit">
      <text class="btn-text">创建账号</text>
    </view>

    <view class="agree-row" @click="agreed = !agreed">
      <image class="checkbox-img" :src="agreed ? '/static/login/icon_checkbox_on.png' : '/static/login/icon_checkbox_off.png'" mode="aspectFit" />
      <view class="agree-text">
        <text class="agree-muted">以阅读并同意</text>
        <text class="agree-link" @click.stop="openAgreement('user')">《用户协议》</text>
        <text class="agree-muted">和</text>
        <text class="agree-link" @click.stop="openAgreement('privacy')">《隐私政策》</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { authApi } from '../../utils/api'

const email = ref('')
const password = ref('')
const name = ref('')
const agreed = ref(false)
const showPassword = ref(false)
const safeTop = computed(() => {
  try {
    const info = uni.getSystemInfoSync()
    const insets = info && info.safeAreaInsets ? info.safeAreaInsets : null
    return insets && typeof insets.top === 'number' ? insets.top : 0
  } catch (e) {
    return 0
  }
})

onLoad((options) => {
  if (options && options.email) email.value = String(options.email)
})

const canSubmit = computed(() => {
  return agreed.value && email.value.trim().length > 0 && password.value.trim().length > 0 && name.value.trim().length > 0
})

function isEmail(value) {
  const v = String(value || '').trim()
  if (!v) return false
  return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(v)
}

function isSupportedEmail(value) {
  return /@163\.com$/i.test(String(value || '').trim())
}

function validateEmail() {
  const v = email.value.trim()
  if (!v) return true
  if (!isEmail(v)) {
    uni.showToast({ title: '邮箱格式不正确', icon: 'none' })
    return false
  }
  if (!isSupportedEmail(v)) {
    uni.showToast({ title: '当前仅支持163邮箱', icon: 'none' })
    return false
  }
  return true
}

function onEmailBlur() {
  validateEmail()
}

function onEmailConfirm() {
  validateEmail()
}

function back() {
  uni.navigateBack()
}

function openAgreement() {
  uni.navigateTo({ url: '/pages/me/agreement' })
}

async function submit() {
  if (!canSubmit.value) {
    if (!email.value.trim()) {
      uni.showToast({ title: '请输入邮箱', icon: 'none' })
      return
    }
    if (!password.value.trim()) {
      uni.showToast({ title: '请输入密码', icon: 'none' })
      return
    }
    if (!name.value.trim()) {
      uni.showToast({ title: '请输入姓名', icon: 'none' })
      return
    }
    if (!agreed.value) {
      uni.showToast({ title: '请先同意协议', icon: 'none' })
      return
    }
    return
  }

  if (!validateEmail()) return

  const v = email.value.trim()
  const n = name.value.trim()
  const p = password.value.trim()
  uni.showLoading({ title: '创建中' })
  try {
    const res = await authApi.register({ account: v, password: p, userName: n })
    if (res && typeof res === 'object' && res.code !== undefined && res.code !== 200 && res.code !== '200') {
      if (res.code === 201 || res.code === '201') {
        uni.showToast({ title: '该邮箱已注册', icon: 'none' })
        return
      }
      uni.showToast({ title: '注册失败', icon: 'none' })
      return
    }
    uni.setStorageSync('auth_policy_agreed', true)
    uni.showToast({ title: '注册成功，请登录', icon: 'none' })
    setTimeout(() => {
      uni.redirectTo({ url: `/pages/login/index?email=${encodeURIComponent(v)}` })
    }, 350)
  } catch (e) {
    const code = e && e.code !== undefined ? e.code : undefined
    if (code === 201 || code === '201') {
      uni.showToast({ title: '该邮箱已注册', icon: 'none' })
      return
    }
    if (code === 202 || code === '202') {
      uni.showToast({ title: '注册失败', icon: 'none' })
      return
    }
    uni.showToast({ title: String((e && e.message) || '注册失败'), icon: 'none' })
  } finally {
    try {
      uni.hideLoading()
    } catch (e) {}
  }
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

.hint {
  display: block;
  margin-top: 16rpx;
  font-size: 28rpx;
  font-weight: 700;
  color: rgba(17, 17, 17, 0.6);
  padding: 0 6rpx;
}

.panel {
  margin-top: 18rpx;
  background: #ffffff;
  border-radius: 28rpx;
  padding: 24rpx 22rpx;
  box-shadow: 0 10rpx 26rpx rgba(17, 17, 17, 0.06);
}

.field + .field {
  margin-top: 22rpx;
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
}

.icon-img {
  width: 34rpx;
  height: 34rpx;
  opacity: 0.72;
}

.tip {
  display: block;
  margin-top: 18rpx;
  padding: 0 6rpx;
  font-size: 26rpx;
  line-height: 40rpx;
  font-weight: 500;
  color: #333333;
}

.btn {
  margin-top: 24rpx;
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

.agree-row {
  margin-top: 22rpx;
  display: flex;
  align-items: flex-start;
  gap: 14rpx;
  padding: 8rpx 2rpx;
}

.checkbox-img {
  width: 44rpx;
  height: 44rpx;
  margin-top: -2rpx;
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
</style>
