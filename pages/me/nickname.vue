<template>
  <view class="page">
    <BlHeader title="昵称" back />

    <view class="input-wrap">
      <input v-model="name" class="input" placeholder="请输入昵称" placeholder-class="ph" confirm-type="done" @confirm="save" />
      <view v-if="name" class="x" @click="name = ''"><text class="x-text">×</text></view>
    </view>

    <view class="btn" @click="save">
      <text class="btn-text">保存</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import BlHeader from '../../components/BlHeader.vue'
import { ensureMeState, updateProfile } from '../../utils/meStore'
import { usersApi } from '../../utils/api'

const name = ref('')

onLoad(() => {
  const s = ensureMeState()
  name.value = s.profile && s.profile.name ? s.profile.name : ''
})

async function save() {
  const v = name.value.trim()
  if (!v) {
    uni.showToast({ title: '请输入昵称', icon: 'none' })
    return
  }
  uni.showLoading({ title: '保存中' })
  try {
    await usersApi.updateUserNickname({ nickName: v })
    const s = ensureMeState()
    updateProfile(s, { name: v })
    uni.setStorageSync('auth_name', v)
    uni.navigateBack()
  } catch (e) {
    const code = e && e.code !== undefined ? e.code : undefined
    if (code === 201 || code === '201') {
      uni.showToast({ title: '用户不存在', icon: 'none' })
      return
    }
    uni.showToast({ title: String((e && e.message) || '保存失败'), icon: 'none' })
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

.input-wrap {
  margin-top: 28rpx;
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

.x {
  width: 56rpx;
  height: 56rpx;
  border-radius: 9999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(17, 17, 17, 0.5);
}

.x-text {
  font-size: 40rpx;
  font-weight: 800;
  line-height: 1;
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

.btn-text {
  color: #ffffff;
  font-size: 34rpx;
  font-weight: 900;
}
</style>
