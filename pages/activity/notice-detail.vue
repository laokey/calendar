<template>
  <view class="page">
    <view class="head" :style="{ paddingTop: safeTop + 'px' }">
      <view class="head-left" @click="back">
        <text class="back">‹</text>
      </view>
      <text class="head-title">通知详情</text>
      <view class="head-right" />
    </view>

    <view v-if="notice" class="content">
      <text class="title">{{ notice.subject }}</text>
      <text class="sub">报名时间:12.17–01.15</text>
      <view class="line" />
      <text class="body">{{ notice.content }}</text>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { ensureActivityState, findNotice } from '../../utils/activityStore'

const id = ref('')
const state = ref(ensureActivityState())

onLoad((options) => {
  id.value = options && options.id ? String(options.id) : ''
})

onShow(() => {
  state.value = ensureActivityState()
  if (id.value && !notice.value) {
    uni.showToast({ title: '通知不存在', icon: 'none' })
    setTimeout(() => uni.navigateBack(), 300)
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

const notice = computed(() => findNotice(state.value, id.value))

function back() {
  uni.navigateBack()
}
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: #ffffff;
  padding: 0 28rpx 40rpx;
}

.head {
  position: sticky;
  top: 0;
  z-index: 999;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
  padding: 18rpx 0 12rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.head-left {
  width: 120rpx;
  display: flex;
  align-items: center;
}

.back {
  font-size: 56rpx;
  font-weight: 700;
  line-height: 1;
  color: rgba(17, 17, 17, 0.85);
}

.head-title {
  font-size: 34rpx;
  font-weight: 900;
}

.head-right {
  width: 120rpx;
}

.content {
  margin-top: 6rpx;
}

.title {
  display: block;
  font-size: 44rpx;
  font-weight: 900;
  line-height: 58rpx;
  color: rgba(17, 17, 17, 0.9);
}

.sub {
  display: block;
  margin-top: 12rpx;
  font-size: 26rpx;
  font-weight: 700;
  color: rgba(17, 17, 17, 0.55);
}

.line {
  margin-top: 18rpx;
  height: 2rpx;
  background: rgba(17, 17, 17, 0.08);
}

.body {
  display: block;
  margin-top: 18rpx;
  font-size: 28rpx;
  font-weight: 700;
  color: rgba(17, 17, 17, 0.82);
  line-height: 44rpx;
  white-space: pre-wrap;
}
</style>
