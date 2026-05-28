<template>
  <view class="page">
    <BlHeader title="注册" back />

    <text class="hint">请输入您的个人电子邮箱</text>

    <view class="panel">
      <view class="field">
        <text class="label">邮箱</text>
        <view class="input-wrap">
          <input v-model="email" class="input" placeholder="请输入邮箱" placeholder-class="ph" confirm-type="next" />
          <view v-if="email" class="icon-btn" @click="email = ''"><text class="icon-text">×</text></view>
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
          <view v-if="password" class="icon-btn" @click="password = ''"><text class="icon-text">×</text></view>
          <view class="icon-btn" @click="showPassword = !showPassword">
            <text class="icon-text eye">{{ showPassword ? '○' : '◉' }}</text>
          </view>
        </view>
      </view>

      <view class="field">
        <text class="label">姓名</text>
        <view class="input-wrap">
          <input v-model="name" class="input" placeholder="请输入姓名" placeholder-class="ph" confirm-type="done" @confirm="submit" />
          <view v-if="name" class="icon-btn" @click="name = ''"><text class="icon-text">×</text></view>
        </view>
      </view>
    </view>

    <text class="tip">请使用您日常使用的邮箱注册，否则可能影响部分功能的使用。</text>

    <view class="btn" :class="{ disabled: !canSubmit }" @click="submit">
      <text class="btn-text">创建账号</text>
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
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import BlHeader from '../../components/BlHeader.vue'

const email = ref('')
const password = ref('')
const name = ref('')
const agreed = ref(false)
const showPassword = ref(false)

onLoad((options) => {
  if (options && options.email) email.value = String(options.email)
})

const canSubmit = computed(() => {
  return agreed.value && email.value.trim().length > 0 && password.value.trim().length > 0 && name.value.trim().length > 0
})

function openAgreement(type) {
  const title = type === 'privacy' ? '隐私政策' : '用户协议'
  uni.showModal({
    title,
    content: '此处为协议内容占位，后续可替换为真实内容或跳转到协议页面。',
    showCancel: false,
  })
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

  uni.showLoading({ title: '创建中' })
  setTimeout(() => {
    uni.hideLoading()
    uni.setStorageSync('auth_email', email.value.trim())
    uni.setStorageSync('auth_name', name.value.trim())
    uni.setStorageSync('auth_logged_in', true)
    uni.reLaunch({ url: '/pages/device/index' })
  }, 700)
}
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: #ffffff;
  padding: 0 28rpx;
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

.tip {
  display: block;
  margin-top: 18rpx;
  padding: 0 6rpx;
  font-size: 26rpx;
  line-height: 40rpx;
  font-weight: 700;
  color: rgba(17, 17, 17, 0.5);
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
</style>
