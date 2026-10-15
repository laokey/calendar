<template>
  <view class="login-page">
    <view class="hero">
      <image class="hero-img" src="/static/login/hero_login.png" mode="widthFix" />
    </view>

    <view class="card">
      <text class="title">{{ $t('登录') }}</text>

      <view class="field">
        <text class="label">{{ $t('邮箱') }}</text>
        <view class="input-wrap">
          <input
            v-model="email"
            type="email"
            class="input"
            :placeholder="$t('请输入电子邮箱')"
            placeholder-class="ph"
            confirm-type="next"
            @blur="onEmailBlur"
            @confirm="onEmailConfirm"
          />
          <view v-if="email" class="icon-btn" @click="email = ''">
            <image class="icon-img" src="/static/login/icon_clear.png" mode="aspectFit" />
          </view>
        </view>
      </view>

      <view class="field">
        <text class="label">{{ $t('密码') }}</text>
        <view class="input-wrap">
          <input
            v-model="password"
            class="input"
            :password="!showPassword"
            :placeholder="$t('请输入密码')"
            placeholder-class="ph"
            confirm-type="done"
            @confirm="submit"
          />
          <view v-if="password" class="icon-btn" @click="password = ''">
            <image class="icon-img" src="/static/login/icon_clear.png" mode="aspectFit" />
          </view>
          <view class="icon-btn" @click="showPassword = !showPassword">
            <image
              class="icon-img"
              :src="showPassword ? '/static/login/icon_eye_open.png' : '/static/login/icon_eye_closed.png'"
              mode="aspectFit"
            />
          </view>
        </view>
      </view>

      <view class="agree-row" @click="agreed = !agreed">
        <image class="checkbox-img" :src="agreed ? '/static/login/icon_checkbox_on.png' : '/static/login/icon_checkbox_off.png'" mode="aspectFit" />
        <view class="agree-text">
          <text class="agree-muted">{{ $t('已阅读并同意') }}</text>
          <text class="agree-link" @click.stop="openAgreement">{{ $t('《用户协议》') }}</text>
          <text class="agree-muted">{{ $t('和') }}</text>
          <text class="agree-link" @click.stop="openAgreement">{{ $t('《隐私政策》') }}</text>
        </view>
      </view>

      <view class="btn" :class="{ disabled: !canSubmit }" @click="submit">
        <text class="btn-text">{{ $t('登录') }}</text>
      </view>

      <view class="bottom-row">
        <text class="bottom-link" @click="goRegister">{{ $t('注册') }}</text>
        <text class="bottom-link" @click="goReset">{{ $t('忘记密码？') }}</text>
      </view>
    </view>

    <view v-if="policyVisible" class="dialog-mask">
      <view class="dialog-content" @click.stop>
        <text class="d-title">{{ $t('服务协议及隐私政策') }}</text>
        <text class="d-sub">
          {{ $t('为了更好的保障您的合法权益，请您阅读并同意以下协议') }}
          <text class="d-link" @click.stop="openAgreement('user')">{{ $t('《用户协议》') }}</text>
          {{ $t('和') }}
          <text class="d-link" @click.stop="openAgreement('privacy')">{{ $t('《隐私政策》') }}</text>
        </text>
        <view class="d-actions">
          <view class="d-btn cancel" @click="rejectPolicy"><text class="d-btn-text cancel-text">{{ $t('不同意') }}</text></view>
          <view class="d-btn confirm" @click="acceptPolicy"><text class="d-btn-text confirm-text">{{ $t('同意') }}</text></view>
        </view>
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
const agreed = ref(false)
const showPassword = ref(false)
const policyVisible = ref(false)

function normalizeRouteEmail(value) {
  const raw = value === undefined || value === null ? '' : String(value).trim()
  if (!raw || raw === 'null' || raw === 'undefined') return ''
  let decoded = raw
  try {
    decoded = decodeURIComponent(raw)
  } catch (e) {}
  return decoded.replace(/\s+/g, '').trim()
}

onLoad((options) => {
  if (options && options.email) email.value = normalizeRouteEmail(options.email)
  const logged = !!uni.getStorageSync('auth_logged_in')
  if (logged) {
    uni.reLaunch({ url: '/pages/device/index' })
    return
  }
  const policy = !!uni.getStorageSync('auth_policy_agreed')
  if (!policy) policyVisible.value = true
})

const canSubmit = computed(() => {
  return agreed.value && email.value.trim().length > 0 && password.value.trim().length > 0
})

function isEmail(value) {
  const v = String(value || '').trim()
  if (!v) return false
  return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(v)
}

function validateEmail() {
  const v = email.value.trim()
  if (!v) return true
  if (isEmail(v)) return true
  uni.showToast({ title: uni.$t('邮箱格式不正确'), icon: 'none' })
  return false
}

function onEmailBlur() {
  validateEmail()
}

function onEmailConfirm() {
  validateEmail()
}

function openAgreement() {
  uni.navigateTo({ url: '/pages/me/agreement' })
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

async function submit() {
  if (policyVisible.value) {
    uni.showToast({ title: uni.$t('请先同意协议'), icon: 'none' })
    return
  }
  if (!canSubmit.value) {
    if (!email.value.trim()) {
      uni.showToast({ title: uni.$t('请输入邮箱'), icon: 'none' })
      return
    }
    if (!password.value.trim()) {
      uni.showToast({ title: uni.$t('请输入密码'), icon: 'none' })
      return
    }
    if (!agreed.value) {
      uni.showToast({ title: uni.$t('请先同意协议'), icon: 'none' })
      return
    }
    return
  }

  if (!validateEmail()) return

  const v = email.value.trim()
  const p = password.value.trim()
  uni.showLoading({ title: uni.$t('登录中') })
  try {
    const res = await authApi.login({ account: v, password: p })
    if (res && typeof res === 'object' && res.code !== undefined && res.code !== 200 && res.code !== '200') {
      if (res.code === 201 || res.code === '201') {
        uni.showToast({ title: uni.$t('账号不存在，请先注册'), icon: 'none' })
        setTimeout(() => goRegister(), 350)
        return
      }
      uni.showToast({ title: uni.$t('登录失败'), icon: 'none' })
      return
    }
    uni.setStorageSync('auth_email', v)
    uni.setStorageSync('auth_logged_in', true)
    uni.reLaunch({ url: '/pages/device/index' })
  } catch (e) {
    const code = e && e.code !== undefined ? e.code : undefined
    if (code === 201 || code === '201') {
      uni.showToast({ title: uni.$t('账号不存在，请先注册'), icon: 'none' })
      setTimeout(() => goRegister(), 350)
      return
    }
    uni.showToast({ title: String((e && e.message) || uni.$t('登录失败')), icon: 'none' })
  } finally {
    try {
      uni.hideLoading()
    } catch (e) {}
  }
}

function acceptPolicy() {
  uni.setStorageSync('auth_policy_agreed', true)
  policyVisible.value = false
}

function rejectPolicy() {
  uni.showToast({ title: uni.$t('需要同意协议才可继续使用'), icon: 'none' })
}
</script>

<style scoped lang="scss">
.login-page {
  min-height: 100vh;
  position: relative;
  background-color: #ffffff;
  background-image: url('/static/login/bg_auth_gradient.png');
  background-repeat: no-repeat;
  background-position: top center;
  background-size: 100% auto;
  overflow: hidden;
}

.hero {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 0;
}

.hero-img {
  width: 100%;
  display: block;
}

.card {
  position: absolute;
  left: 28rpx;
  right: 28rpx;
  top: 55%;
  transform: translateY(-50%);
  z-index: 1;
  background: #ffffff;
  border-radius: 28rpx;
  padding: 34rpx 28rpx 26rpx;
  box-shadow: 0 18rpx 46rpx rgba(17, 17, 17, 0.08);
}

.title {
  display: block;
  text-align: center;
  font-size: 44rpx;
  font-weight: 600;
  color: #333333;
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
}

.icon-img {
  width: 34rpx;
  height: 34rpx;
  opacity: 0.72;
}

.agree-row {
  margin-top: 18rpx;
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
  font-weight: 500;
  color: #666666;
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
  line-height: 1.3;
}

.d-link {
  color: #406dff;
  font-weight: 600;
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
  background: #406dff;
}

.d-btn-text {
  font-size: 28rpx;
  font-weight: 500;
  color: #666666;
}

.cancel-text {
  color: #406dff;
}

.confirm-text {
  color: #ffffff;
}
</style>
