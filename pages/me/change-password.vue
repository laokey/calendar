<template>
  <view class="page">
    <BlHeader :title="$t('重置密码')" back />

    <view class="stack">
      <view class="input-wrap">
        <input v-model="oldPwd" class="input" :password="!showOld" :placeholder="$t('原密码')" placeholder-class="ph" confirm-type="next" />
        <view class="eye" @click="showOld = !showOld">
          <image class="eye-img" :src="showOld ? '/static/my/icon_eye_open.png' : '/static/my/icon_eye_closed.png'" mode="aspectFit" />
        </view>
      </view>
      <view class="input-wrap code-wrap">
        <input v-model="code" class="input" :placeholder="$t('邮箱验证码')" placeholder-class="ph" confirm-type="next" />
        <view class="code-btn" :class="{ disabled: !canSendCode }" @click="sendCode">
          <text class="code-btn-text">{{ codeBtnText }}</text>
        </view>
      </view>
      <view class="input-wrap">
        <input v-model="newPwd" class="input" :password="!showNew" :placeholder="$t('新密码')" placeholder-class="ph" confirm-type="next" />
        <view class="eye" @click="showNew = !showNew">
          <image class="eye-img" :src="showNew ? '/static/my/icon_eye_open.png' : '/static/my/icon_eye_closed.png'" mode="aspectFit" />
        </view>
      </view>
      <view class="input-wrap">
        <input v-model="newPwd2" class="input" :password="!showNew2" :placeholder="$t('再次输入新密码')" placeholder-class="ph" confirm-type="done" @confirm="submit" />
        <view class="eye" @click="showNew2 = !showNew2">
          <image class="eye-img" :src="showNew2 ? '/static/my/icon_eye_open.png' : '/static/my/icon_eye_closed.png'" mode="aspectFit" />
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
import { onUnload } from '@dcloudio/uni-app'
import BlHeader from '../../components/BlHeader.vue'
import { usersApi } from '../../utils/api'

const oldPwd = ref('')
const code = ref('')
const newPwd = ref('')
const newPwd2 = ref('')

const showOld = ref(false)
const showNew = ref(false)
const showNew2 = ref(false)
const codeSeconds = ref(0)
const codeSending = ref(false)
let codeTimer = 0

const canSubmit = computed(() => {
  return oldPwd.value.trim() && code.value.trim() && newPwd.value.trim() && newPwd2.value.trim()
})

function getCurrentEmail() {
  try {
    return String(uni.getStorageSync('auth_email') || '').trim()
  } catch (e) {
    return ''
  }
}

function isSupportedEmail(value) {
  return /@163\.com$/i.test(String(value || '').trim())
}

const canSendCode = computed(() => {
  if (codeSending.value) return false
  if (codeSeconds.value > 0) return false
  return isSupportedEmail(getCurrentEmail())
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
  const email = getCurrentEmail()
  if (!email) {
    uni.showToast({ title: uni.$t('未获取到当前邮箱'), icon: 'none' })
    return
  }
  if (!isSupportedEmail(email)) {
    uni.showToast({ title: uni.$t('当前仅支持163邮箱'), icon: 'none' })
    return
  }
  if (!canSendCode.value) return
  codeSending.value = true
  uni.showLoading({ title: uni.$t('发送中') })
  try {
    await usersApi.sendResetPasswordVerifyCode()
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
  if (newPwd.value !== newPwd2.value) {
    uni.showToast({ title: uni.$t('两次密码不一致'), icon: 'none' })
    return
  }
  uni.showLoading({ title: uni.$t('修改中') })
  try {
    await usersApi.resetPassword({ oldPassword: oldPwd.value.trim(), newPassword: newPwd.value.trim(), verifyCode: code.value.trim() })
    uni.showToast({ title: uni.$t('修改成功'), icon: 'none' })
    setTimeout(() => uni.navigateBack(), 300)
  } catch (e) {
    const code = e && e.code !== undefined ? e.code : undefined
    if (code === 201 || code === '201') {
      uni.showToast({ title: uni.$t('用户不存在'), icon: 'none' })
      return
    }
    if (code === 202 || code === '202') {
      uni.showToast({ title: uni.$t('原密码错误'), icon: 'none' })
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
  min-width: 168rpx;
  height: 60rpx;
  border-radius: 9999rpx;
  background: rgba(61, 106, 251, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 18rpx;
}

.code-btn.disabled {
  background: rgba(17, 17, 17, 0.08);
}

.code-btn-text {
  color: #3d6afb;
  font-size: 26rpx;
  font-weight: 850;
  white-space: nowrap;
}

.code-btn.disabled .code-btn-text {
  color: rgba(17, 17, 17, 0.35);
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
