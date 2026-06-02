<template>
  <view class="page">
    <view class="head" :style="{ paddingTop: safeTop + 'px' }">
      <view class="head-left" @click="back">
        <text class="back">‹</text>
      </view>
      <text class="head-title">传输列表</text>
      <view class="head-right" />
    </view>

    <view class="tabs">
      <view class="tab" :class="{ active: tab === 'uploading' }" @click="tab = 'uploading'">
        <text class="tab-text">上传中</text>
      </view>
      <view class="tab" :class="{ active: tab === 'failed' }" @click="tab = 'failed'">
        <text class="tab-text">上传失败</text>
      </view>
    </view>

    <view class="list">
      <view v-for="t in filtered" :key="t.id" class="item">
        <view class="thumb-wrap">
          <image v-if="t.type !== 'video' || t.thumbUri" class="thumb" :src="t.type === 'video' ? t.thumbUri : t.uri" mode="aspectFill" />
          <view v-else class="thumb ph" />
          <view v-if="t.type === 'video'" class="play">
            <image class="play-icon" src="/static/gallery/icon_play.png" mode="aspectFit" />
          </view>
        </view>
        <view class="meta">
          <view class="row">
            <text class="name">{{ t.name }}</text>
            <view class="x" @click="remove(t.id)"><image class="x-icon" src="/static/gallery/icon_close.png" mode="aspectFit" /></view>
          </view>
          <text class="time">{{ t.createdAt }}</text>

          <view v-if="t.status === 'uploading'" class="progress">
            <view class="bar">
              <view class="bar-in" :style="{ width: t.progress + '%' }" />
            </view>
          </view>

          <view v-else class="error" :class="{ net: t.errorCode === 'network', red: t.errorCode !== 'network' }">
            <text class="error-text">{{ t.errorText }}</text>
            <view v-if="t.errorCode === 'network'" class="retry" @click="retry(t.id)">
              <image class="retry-icon" src="/static/gallery/icon_refresh.png" mode="aspectFit" />
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { onHide, onLoad, onShow } from '@dcloudio/uni-app'
import { ensureGalleryState, removeTransfer, retryTransfer, tickTransfers } from '../../utils/galleryStore'

const tab = ref('uploading')
const state = ref(ensureGalleryState())
const timer = ref(null)
const albumId = ref('')
const autoBack = ref(false)
const redirected = ref(false)

onLoad((options) => {
  albumId.value = options && options.albumId ? String(options.albumId) : ''
  autoBack.value = !!(options && String(options.autoBack || '') === '1')
})

function maybeAutoBack(nextState) {
  if (!autoBack.value || redirected.value || !albumId.value) return
  const list = nextState && nextState.transfers ? nextState.transfers : []
  const hasUploading = list.some((t) => t.status === 'uploading')
  const hasFailed = list.some((t) => t.status === 'failed')
  if (hasUploading || hasFailed) return
  redirected.value = true
  if (timer.value) clearInterval(timer.value)
  timer.value = null
  uni.redirectTo({ url: `/pages/gallery/album?albumId=${encodeURIComponent(albumId.value)}` })
}

onShow(() => {
  state.value = ensureGalleryState()
  redirected.value = false
  if (timer.value) clearInterval(timer.value)
  timer.value = setInterval(() => {
    const s = ensureGalleryState()
    const next = tickTransfers(s)
    state.value = next
    maybeAutoBack(next)
  }, 650)
  maybeAutoBack(state.value)
})

onHide(() => {
  if (timer.value) clearInterval(timer.value)
  timer.value = null
})

onBeforeUnmount(() => {
  if (timer.value) clearInterval(timer.value)
  timer.value = null
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

const filtered = computed(() => {
  const list = state.value.transfers || []
  return list.filter((t) => t.status === tab.value)
})

function back() {
  uni.navigateBack()
}

function remove(id) {
  const s = ensureGalleryState()
  removeTransfer(s, id)
  state.value = ensureGalleryState()
  maybeAutoBack(state.value)
}

function retry(id) {
  const s = ensureGalleryState()
  retryTransfer(s, id)
  state.value = ensureGalleryState()
  tab.value = 'uploading'
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

.tabs {
  margin-top: 10rpx;
  height: 80rpx;
  border-radius: 9999rpx;
  background: #eef2ff;
  display: flex;
  align-items: center;
  padding: 8rpx;
}

.tab {
  flex: 1;
  height: 64rpx;
  border-radius: 9999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tab.active {
  background: #3d6afb;
}

.tab-text {
  font-size: 28rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.6);
}

.tab.active .tab-text {
  color: #ffffff;
}

.list {
  margin-top: 18rpx;
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.item {
  border-radius: 26rpx;
  background: #ffffff;
  box-shadow: 0 10rpx 26rpx rgba(17, 17, 17, 0.06);
  padding: 14rpx;
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.thumb-wrap {
  width: 110rpx;
  height: 110rpx;
  border-radius: 22rpx;
  overflow: hidden;
  position: relative;
  background: rgba(17, 17, 17, 0.08);
}

.thumb {
  width: 100%;
  height: 100%;
}

.thumb.ph {
  background: rgba(17, 17, 17, 0.08);
}

.play {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.play-icon {
  width: 44rpx;
  height: 44rpx;
  opacity: 0.95;
}

.meta {
  flex: 1;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10rpx;
}

.name {
  font-size: 30rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.85);
}

.x {
  width: 56rpx;
  height: 56rpx;
  border-radius: 9999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(17, 17, 17, 0.35);
}

.x-icon {
  width: 28rpx;
  height: 28rpx;
  opacity: 0.55;
}

.time {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  font-weight: 650;
  color: rgba(17, 17, 17, 0.45);
}

.progress {
  margin-top: 12rpx;
}

.bar {
  height: 10rpx;
  border-radius: 9999rpx;
  background: rgba(17, 17, 17, 0.12);
  overflow: hidden;
}

.bar-in {
  height: 100%;
  background: #3d6afb;
  border-radius: 9999rpx;
}

.error {
  margin-top: 12rpx;
  height: 56rpx;
  border-radius: 14rpx;
  padding: 0 14rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
}

.error.red {
  background: rgba(255, 75, 63, 0.1);
  color: #ff4b3f;
}

.error.net {
  background: rgba(61, 106, 251, 0.1);
  color: #3d6afb;
}

.error-text {
  font-size: 26rpx;
  font-weight: 800;
}

.retry {
  width: 64rpx;
  height: 56rpx;
  border-radius: 14rpx;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
}

.retry-icon {
  width: 44rpx;
  height: 44rpx;
}
</style>
