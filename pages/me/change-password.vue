<template>
  <view class="page">
    <BlHeader title="重置密码" back />

    <view class="stack">
      <view class="input-wrap">
        <input v-model="oldPwd" class="input" :password="!showOld" placeholder="原密码" placeholder-class="ph" confirm-type="next" />
        <view class="eye" @click="showOld = !showOld">
          <image class="eye-img" :src="showOld ? '/static/my/icon_eye_open.png' : '/static/my/icon_eye_closed.png'" mode="aspectFit" />
        </view>
      </view>
      <view class="input-wrap">
        <input v-model="newPwd" class="input" :password="!showNew" placeholder="新密码" placeholder-class="ph" confirm-type="next" />
        <view class="eye" @click="showNew = !showNew">
          <image class="eye-img" :src="showNew ? '/static/my/icon_eye_open.png' : '/static/my/icon_eye_closed.png'" mode="aspectFit" />
        </view>
      </view>
      <view class="input-wrap">
        <input v-model="newPwd2" class="input" :password="!showNew2" placeholder="再次输入新密码" placeholder-class="ph" confirm-type="done" @confirm="submit" />
        <view class="eye" @click="showNew2 = !showNew2">
          <image class="eye-img" :src="showNew2 ? '/static/my/icon_eye_open.png' : '/static/my/icon_eye_closed.png'" mode="aspectFit" />
        </view>
      </view>
    </view>

    <view class="btn" :class="{ disabled: !canSubmit }" @click="submit">
      <text class="btn-text">立即修改</text>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import BlHeader from '../../components/BlHeader.vue'

const oldPwd = ref('')
const newPwd = ref('')
const newPwd2 = ref('')

const showOld = ref(false)
const showNew = ref(false)
const showNew2 = ref(false)

const canSubmit = computed(() => {
  return oldPwd.value.trim() && newPwd.value.trim() && newPwd2.value.trim()
})

function submit() {
  if (!canSubmit.value) {
    uni.showToast({ title: '请完善信息', icon: 'none' })
    return
  }
  if (newPwd.value !== newPwd2.value) {
    uni.showToast({ title: '两次密码不一致', icon: 'none' })
    return
  }
  uni.showToast({ title: '修改成功', icon: 'none' })
  setTimeout(() => uni.navigateBack(), 300)
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
