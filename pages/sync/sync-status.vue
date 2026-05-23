<template>
  <view class="bl-page page">
    <BlHeader title="" back back-icon-src="/static/sync/icon_nav_back_small.png" />

    <view class="center">
      <image v-if="mode === 'success'" class="hero-icon" src="/static/sync/icon_check_circle_green.png" mode="aspectFit" />
      <image v-else class="hero-icon" src="/static/sync/icon_refresh_circle_blue.png" mode="aspectFit" />

      <text class="hero-title">{{ titleText }}</text>
      <text class="hero-desc">{{ descText }}</text>

      <view class="hero-btn" @click="primaryAction">
        <text class="hero-btn-text">{{ btnText }}</text>
      </view>
    </view>

    <text class="bottom-hint">{{ bottomText }}</text>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import BlHeader from '../../components/BlHeader.vue'

const mode = ref('progress')
const count = ref(0)

onLoad((options) => {
  mode.value = String(options && options.mode ? options.mode : 'progress') === 'success' ? 'success' : 'progress'
  const n = Number(options && options.count ? options.count : 0)
  count.value = Number.isFinite(n) ? n : 0
  if (mode.value === 'progress') {
    setTimeout(() => {
      uni.redirectTo({ url: `/pages/sync/sync-status?mode=success&count=${encodeURIComponent(String(count.value || 101))}` })
    }, 1200)
  }
})

const titleText = computed(() => (mode.value === 'success' ? '成功!' : '同步进行中...'))
const descText = computed(() => {
  if (mode.value === 'success') return `到目前为止，我们已经同步了${count.value || 101}来自此帐户的事件。`
  return '我们已经开始同步过程，但这可能需要几分钟时间！'
})
const btnText = computed(() => (mode.value === 'success' ? '查看活动' : '返回首页'))
const bottomText = computed(() => (mode.value === 'success' ? '同步成功' : '等待同步完成'))

function primaryAction() {
  uni.reLaunch({ url: '/pages/activity/index' })
}
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: #ffffff;
  padding-bottom: 120rpx;
}

.center {
  margin-top: 120rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.hero-icon {
  width: 160rpx;
  height: 160rpx;
  display: block;
}

.hero-title {
  margin-top: 28rpx;
  font-size: 44rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.92);
}

.hero-desc {
  margin-top: 14rpx;
  font-size: 28rpx;
  font-weight: 800;
  line-height: 42rpx;
  color: rgba(17, 17, 17, 0.75);
  text-align: center;
  padding: 0 48rpx;
}

.hero-btn {
  margin-top: 34rpx;
  width: 620rpx;
  height: 96rpx;
  border-radius: 9999rpx;
  background: #3d6afb;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-btn-text {
  font-size: 34rpx;
  font-weight: 900;
  color: #ffffff;
}

.bottom-hint {
  position: fixed;
  left: 0;
  right: 0;
  bottom: calc(22rpx + env(safe-area-inset-bottom));
  text-align: center;
  font-size: 26rpx;
  font-weight: 700;
  color: rgba(17, 17, 17, 0.45);
}
</style>
