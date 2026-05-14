<template>
  <view class="page">
    <view class="head" :style="{ paddingTop: safeTop + 'px' }">
      <view class="head-left" @click="back"><text class="back">‹</text></view>
      <text class="title">预览</text>
      <view class="head-right" @click="refresh"><text class="refresh">↻</text></view>
    </view>

    <view v-if="record" class="pill">
      <text class="pill-text">{{ record.timeText }}</text>
    </view>

    <view v-if="record" class="imgs">
      <view class="img left">
        <image class="img-real" src="../../ui/芝麻日历-登录注册/logo.png" mode="aspectFill" />
      </view>
      <view class="img right">
        <view class="face">
          <text class="emoji">😀</text>
          <view class="sketch">
            <view class="eye" />
            <view class="eye" />
            <view class="mouth" />
          </view>
        </view>
      </view>
    </view>

    <view v-if="record" class="msg">
      <text class="msg-text">{{ record.message }}</text>
    </view>

    <text class="section">显示模式</text>
    <view class="mode">
      <view class="mode-ico"><text class="mode-ico-text">▶</text></view>
      <view class="mode-meta">
        <text class="mode-title">自动播放</text>
        <text class="mode-sub">收到相框后，祝福会自动打开</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { ensureMeState, findCardRecord, markCardRead } from '../../utils/meStore'

const id = ref('')
const state = ref(ensureMeState())

onLoad((options) => {
  id.value = options && options.id ? String(options.id) : ''
})

onShow(() => {
  state.value = ensureMeState()
  if (id.value) {
    const s = ensureMeState()
    markCardRead(s, id.value)
    state.value = ensureMeState()
  }
})

const record = computed(() => findCardRecord(state.value, id.value))

const safeTop = computed(() => {
  try {
    const info = uni.getSystemInfoSync()
    const insets = info && info.safeAreaInsets ? info.safeAreaInsets : null
    return insets && typeof insets.top === 'number' ? insets.top : 0
  } catch (e) {
    return 0
  }
})

function back() {
  uni.navigateBack()
}

function refresh() {
  state.value = ensureMeState()
}
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: linear-gradient(180deg, #eaf2ff 0%, #ffffff 55%);
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

.title {
  font-size: 34rpx;
  font-weight: 900;
}

.head-right {
  width: 120rpx;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.refresh {
  font-size: 34rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.55);
}

.pill {
  margin-top: 6rpx;
  display: flex;
  justify-content: center;
}

.pill-text {
  height: 64rpx;
  padding: 0 26rpx;
  border-radius: 9999rpx;
  background: rgba(61, 106, 251, 0.18);
  color: #3d6afb;
  font-size: 28rpx;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
}

.imgs {
  margin-top: 20rpx;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18rpx;
}

.img {
  height: 380rpx;
  border-radius: 26rpx;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.85);
  box-shadow: 0 10rpx 26rpx rgba(17, 17, 17, 0.06);
}

.img-real {
  width: 100%;
  height: 100%;
}

.face {
  height: 100%;
  background: rgba(255, 214, 77, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.emoji {
  position: absolute;
  top: 22rpx;
  left: 22rpx;
  font-size: 44rpx;
}

.sketch {
  width: 220rpx;
  height: 220rpx;
  border-radius: 26rpx;
  border: 6rpx solid rgba(17, 17, 17, 0.55);
  position: relative;
}

.eye {
  position: absolute;
  top: 72rpx;
  width: 30rpx;
  height: 30rpx;
  border-radius: 9999rpx;
  background: rgba(17, 17, 17, 0.55);
}

.eye:first-child {
  left: 62rpx;
}

.eye:last-child {
  right: 62rpx;
}

.mouth {
  position: absolute;
  left: 50%;
  bottom: 60rpx;
  width: 86rpx;
  height: 46rpx;
  border: 6rpx solid rgba(17, 17, 17, 0.55);
  border-top: 0;
  border-left: 0;
  border-right: 0;
  border-radius: 0 0 9999rpx 9999rpx;
  transform: translateX(-50%);
}

.msg {
  margin-top: 18rpx;
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.95);
  padding: 18rpx 18rpx;
  min-height: 140rpx;
  box-shadow: 0 10rpx 26rpx rgba(17, 17, 17, 0.06);
}

.msg-text {
  font-size: 28rpx;
  line-height: 42rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.85);
}

.section {
  display: block;
  margin-top: 24rpx;
  font-size: 28rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.85);
}

.mode {
  margin-top: 12rpx;
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 10rpx 26rpx rgba(17, 17, 17, 0.06);
  padding: 18rpx 18rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.mode-ico {
  width: 72rpx;
  height: 72rpx;
  border-radius: 22rpx;
  background: rgba(61, 106, 251, 0.12);
  border: 2rpx solid rgba(61, 106, 251, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
}

.mode-ico-text {
  font-size: 28rpx;
  font-weight: 900;
  color: #3d6afb;
  margin-left: 2rpx;
}

.mode-meta {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.mode-title {
  font-size: 30rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.85);
}

.mode-sub {
  font-size: 24rpx;
  font-weight: 700;
  color: rgba(17, 17, 17, 0.55);
}
</style>
