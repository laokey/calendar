<template>
  <view class="page">
    <BlHeader :title="$t('修改邮箱')" back />

    <view class="stack">
      <view class="input-wrap">
        <input v-model="email" class="input" :placeholder="$t('新邮箱')" placeholder-class="ph" confirm-type="next" />
      </view>
      <view class="input-wrap code-wrap">
        <input v-model="code" class="input" :placeholder="$t('验证码')" placeholder-class="ph" confirm-type="next" />
        <view class="code-btn" :class="{ disabled: !canSendCode }" @click="sendCode">
          <text class="code-btn-text">{{ codeBtnText }}</text>
        </view>
      </view>
      <view class="input-wrap">
        <input
          v-model="password"
          class="input"
          :password="!showPassword"
          :placeholder="$t('当前密码')"
          placeholder-class="ph"
          confirm-type="done"
          @confirm="submit"
        />
        <view class="eye" @click="showPassword = !showPassword">
          <image
            class="eye-img"
            :src="showPassword ? '/static/my/icon_eye_open.png' : '/static/my/icon_eye_closed.png'"
            mode="aspectFit"
          />
        </view>
      </view>
    </view>

    <view class="btn" :class="{ disabled: !canSubmit }" @click="submit">
      <text class="btn-text">{{ $t('立即修改') }}</text>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import BlHeader from '../../components/BlHeader.vue'
import { ensureMeState, updateProfile } from '../../utils/meStore'
import { usersApi } from '../../utils/api'
import { onUnload } from '@dcloudio/uni-app'

const email = ref('')
const code = ref('')
const password = ref('')
const showPassword = ref(false)
const codeSeconds = ref(0)
const codeSending = ref(false)
let codeTimer = 0

const canSubmit = computed(() => {
  return email.value.trim() && code.value.trim() && password.value.trim()
})

function isEmail(value) {
  const v = String(value || '').trim()
  if (!v) return false
  return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(v)
}

function isSupportedEmail(value) {
  return /@163\.com$/i.test(String(value || '').trim())
}

const canSendCode = computed(() => {
  if (codeSending.value) return false
  if (codeSeconds.value > 0) return false
  return isEmail(email.value.trim()) && isSupportedEmail(email.value.trim())
})

const codeBtnText = computed(() => {
  if (codeSeconds.value > 0) return `${codeSeconds.value}s`
  return uni.$t('获取验证码')
})

function clearCodeTimer() {
  if (!codeTimer) return
  clearInterval(codeTimer)
  codeTimer = 0
}

function startCodeCountdown(seconds = 60) {
  clearCodeTimer()
  codeSeconds.value = seconds
  codeTimer = setInterval(() => {
    if (codeSeconds.value <= 1) {
      codeSeconds.value = 0
      clearCodeTimer()
      return
    }
    codeSeconds.value -= 1
  }, 1000)
}

onUnload(() => {
  clearCodeTimer()
})

async function sendCode() {
  if (!canSendCode.value) {
    if (!email.value.trim()) {
      uni.showToast({ title: uni.$t('请输入新邮箱'), icon: 'none' })
      return
    }
    if (!isEmail(email.value.trim())) {
      uni.showToast({ title: uni.$t('邮箱格式不正确'), icon: 'none' })
      return
    }
    if (!isSupportedEmail(email.value.trim())) {
      uni.showToast({ title: uni.$t('当前仅支持163邮箱'), icon: 'none' })
      return
    }
    return
  }
  codeSending.value = true
  uni.showLoading({ title: uni.$t('发送中') })
  try {
    await usersApi.sendEmailVerifyCode({ newEmail: email.value.trim() })
    uni.showToast({ title: uni.$t('验证码已发送'), icon: 'none' })
    startCodeCountdown(60)
  } catch (e) {
    uni.showToast({ title: String((e && e.message) || uni.$t('发送失败')), icon: 'none' })
  } finally {
    codeSending.value = false
    try {
      uni.hideLoading()
    } catch (e) {}
  }
}

async function submit() {
  if (!canSubmit.value) {
    uni.showToast({ title: uni.$t('请完善信息'), icon: 'none' })
    return
  }
  const v = email.value.trim()
  if (!isEmail(v)) {
    uni.showToast({ title: uni.$t('邮箱格式不正确'), icon: 'none' })
    return
  }
  if (!isSupportedEmail(v)) {
    uni.showToast({ title: uni.$t('当前仅支持163邮箱'), icon: 'none' })
    return
  }
  uni.showLoading({ title: uni.$t('修改中') })
  try {
    await usersApi.updateUserEmailAddress({ newEmail: v, verifyCode: code.value.trim(), password: password.value.trim() })
    const s = ensureMeState()
    updateProfile(s, { email: v })
    uni.setStorageSync('auth_email', v)
    uni.showToast({ title: uni.$t('修改成功'), icon: 'none' })
    setTimeout(() => uni.navigateBack(), 300)
  } catch (e) {
    const errCode = e && e.code !== undefined ? e.code : undefined
    if (errCode === 201 || errCode === '201') {
      uni.showToast({ title: uni.$t('用户不存在'), icon: 'none' })
      return
    }
    if (errCode === 202 || errCode === '202') {
      uni.showToast({ title: uni.$t('邮箱已被注册'), icon: 'none' })
      return
    }
    if (errCode === 203 || errCode === '203') {
      uni.showToast({ title: uni.$t('密码错误'), icon: 'none' })
      return
    }
    uni.showToast({ title: String((e && e.message) || uni.$t('修改失败')), icon: 'none' })
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
  background: #ffffff;
  padding: 0 28rpx;
}

.stack {
  margin-top: 28rpx;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.input-wrap {
  height: 98rpx;
  border-radius: 22rpx;
  background: #fafafa;
  border: 2rpx solid rgba(17, 17, 17, 0.06);
  padding: 0 18rpx;
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.code-wrap {
  gap: 12rpx;
}

.input {
  flex: 1;
  font-size: 34rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.85);
}

.ph {
  color: rgba(17, 17, 17, 0.35);
  font-weight: 650;
}

.eye {
  width: 56rpx;
  height: 56rpx;
  border-radius: 9999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(17, 17, 17, 0.5);
}

.eye-img {
  width: 34rpx;
  height: 34rpx;
  opacity: 0.7;
}

.code-btn {
  height: 72rpx;
  padding: 0 16rpx;
  border-radius: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.code-btn-text {
  font-size: 28rpx;
  font-weight: 900;
  color: #3d6afb;
}

.code-btn.disabled .code-btn-text {
  color: rgba(17, 17, 17, 0.32);
}

.btn {
  margin-top: 26rpx;
  height: 104rpx;
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
