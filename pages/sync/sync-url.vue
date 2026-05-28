<template>
  <view class="bl-page page">
    <BlHeader title="同步日历URL账户" back back-icon-src="/static/sync/icon_nav_back_small.png" />

    <view class="input-wrap">
      <input v-model="url" class="input" placeholder="日历链接" placeholder-class="ph" />
    </view>

    <view class="btn" :class="{ disabled: !canSubmit }" @click="submit">
      <text class="btn-text">同步日历链接</text>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import BlHeader from '../../components/BlHeader.vue'
import { addUrlSync, ensureSyncState } from '../../utils/syncStore'

const url = ref('')
const canSubmit = computed(() => url.value.trim().length > 0)

function submit() {
  if (!canSubmit.value) return
  const state = ensureSyncState()
  addUrlSync(state, { url: url.value.trim(), name: '地址' })
  uni.navigateTo({ url: '/pages/sync/sync-status?mode=progress&from=url&count=101' })
}
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: #ffffff;
}

.input-wrap {
  margin-top: 14rpx;
  background: #fafafa;
  border-radius: 22rpx;
  padding: 22rpx;
}

.input {
  width: 100%;
  font-size: 30rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.92);
}

.ph {
  color: rgba(17, 17, 17, 0.35);
  font-weight: 700;
}

.btn {
  margin-top: 22rpx;
  width: 100%;
  height: 96rpx;
  border-radius: 9999rpx;
  background: #3d6afb;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn.disabled {
  background: rgba(17, 17, 17, 0.15);
}

.btn-text {
  font-size: 34rpx;
  font-weight: 900;
  color: #ffffff;
}
</style>
