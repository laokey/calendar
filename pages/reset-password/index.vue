<template>
  <view class="page">
    <BlHeader title="重置密码" back />

    <view class="panel">
      <text class="label">邮箱</text>
      <view class="input-wrap">
        <input v-model="email" class="input" placeholder="请输入邮箱" placeholder-class="ph" confirm-type="done" @confirm="submit" />
        <view v-if="email" class="icon-btn" @click="email = ''"><text class="icon-text">×</text></view>
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
import BlHeader from '../../components/BlHeader.vue'

const email = ref('')

onLoad((options) => {
  if (options && options.email) email.value = String(options.email)
})

const canSubmit = computed(() => {
  return email.value.trim().length > 0
})

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
  background: linear-gradient(180deg, #eaf2ff 0%, #ffffff 45%);
  padding: 0 28rpx;
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
  background: rgba(17, 17, 17, 0.03);
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
