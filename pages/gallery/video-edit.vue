<template>
  <view class="page">
    <view class="head" :style="{ paddingTop: safeTop + 'px' }">
      <view class="head-left" @click="back">
        <text class="back-text">‹</text>
      </view>
      <text class="head-title">{{ $t('剪辑') }}</text>
      <view class="head-right" />
    </view>

    <view class="player">
      <video
        id="editVideo"
        class="video"
        :src="uri"
        :controls="false"
        :show-center-play-btn="true"
        :show-fullscreen-btn="false"
        :show-play-btn="true"
        :enable-progress-gesture="false"
        object-fit="cover"
        @loadedmetadata="onLoadedMetadata"
      />
    </view>

    <view class="time-row">
      <text class="time">{{ formatTime(startTime) }}</text>
      <text class="time">{{ formatTime(endTime) }}</text>
    </view>

    <view class="track-wrap">
      <view class="track" @click.stop>
        <view class="thumbs">
          <view v-for="n in 8" :key="n" class="thumb">
            <image v-if="thumbUri" class="thumb-img" :src="thumbUri" mode="aspectFill" />
            <view v-else class="thumb-ph" />
          </view>
        </view>

        <movable-area class="area">
          <view class="shade left" :style="{ width: leftX + 'px' }" />
          <view class="shade right" :style="{ left: rightX + 'px', width: Math.max(0, trackW - rightX) + 'px' }" />

          <view class="range" :style="{ left: leftX + 'px', width: Math.max(0, rightX - leftX) + 'px' }" />

          <movable-view
            class="handle"
            :x="leftX"
            :y="0"
            direction="horizontal"
            :out-of-bounds="false"
            :disabled="!ready"
            @changing="onLeftChanging"
            @change="onLeftChangeEnd"
          >
            <view class="handle-knob" />
          </movable-view>

          <movable-view
            class="handle right-h"
            :x="rightX - handleW"
            :y="0"
            direction="horizontal"
            :out-of-bounds="false"
            :disabled="!ready"
            @changing="onRightChanging"
            @change="onRightChangeEnd"
          >
            <view class="handle-knob" />
          </movable-view>
        </movable-area>
      </view>

      <text class="hint">{{ $t('拖动剪辑视频') }}</text>
    </view>

    <view class="bottom">
      <view class="btn" :class="{ disabled: !canSend }" @click="send">
        <text class="btn-text">{{ $t('发送') }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, nextTick, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const albumId = ref('')
const uri = ref('')
const thumbUri = ref('')
const duration = ref(0)

const safeTop = computed(() => {
  try {
    const info = uni.getSystemInfoSync()
    const insets = info && info.safeAreaInsets ? info.safeAreaInsets : null
    return insets && typeof insets.top === 'number' ? insets.top : 0
  } catch (e) {
    return 0
  }
})

const handleW = 18
const minGapPx = 26

const ready = ref(false)
const trackW = ref(0)
const leftX = ref(0)
const rightX = ref(0)

const startTime = ref(0)
const endTime = ref(0)

const ctx = ref(null)

onLoad((options) => {
  albumId.value = options && options.albumId ? String(options.albumId) : ''
  uri.value = options && options.uri ? decodeURIComponent(String(options.uri)) : ''
  thumbUri.value = options && options.thumbUri ? decodeURIComponent(String(options.thumbUri)) : ''
  duration.value = options && options.duration ? Math.max(0, Number(options.duration) || 0) : 0
  endTime.value = duration.value
  ctx.value = uni.createVideoContext('editVideo')

  nextTick(() => {
    uni.createSelectorQuery()
      .select('.track')
      .boundingClientRect((rect) => {
        const w = rect && rect.width ? Math.floor(rect.width) : 0
        trackW.value = w
        leftX.value = 0
        rightX.value = w
        syncTimes()
        ready.value = w > 0
      })
      .exec()
  })
})

const canSend = computed(() => !!(albumId.value && uri.value && endTime.value > startTime.value))

function back() {
  uni.navigateBack()
}

function formatTime(sec) {
  const s = Math.max(0, Math.floor(Number(sec) || 0))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const ss = s % 60
  const pad = (n) => String(n).padStart(2, '0')
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(ss)}`
  return `${pad(m)}:${pad(ss)}`
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
}

function xToTime(x) {
  const w = trackW.value || 0
  if (!w || !duration.value) return 0
  const r = clamp(x / w, 0, 1)
  return r * duration.value
}

function syncTimes() {
  startTime.value = xToTime(leftX.value)
  endTime.value = xToTime(rightX.value)
}

function seekStart() {
  if (!ctx.value) return
  ctx.value.seek(startTime.value || 0)
}

function seekEnd() {
  if (!ctx.value) return
  const t = Math.max(0, (endTime.value || 0) - 0.2)
  ctx.value.seek(t)
}

function onLeftChanging(e) {
  const x = e && e.detail && typeof e.detail.x === 'number' ? e.detail.x : 0
  const max = Math.max(0, rightX.value - minGapPx)
  leftX.value = clamp(x, 0, max)
  syncTimes()
}

function onLeftChangeEnd() {
  seekStart()
}

function onRightChanging(e) {
  const x = e && e.detail && typeof e.detail.x === 'number' ? e.detail.x : 0
  const realX = x + handleW
  const min = Math.min(trackW.value, leftX.value + minGapPx)
  rightX.value = clamp(realX, min, trackW.value)
  syncTimes()
}

function onRightChangeEnd() {
  seekEnd()
}

function onLoadedMetadata(e) {
  const d = e && e.detail && typeof e.detail.duration === 'number' ? e.detail.duration : 0
  if (d > 0 && (!duration.value || Math.abs(duration.value - d) > 0.2)) {
    duration.value = d
    endTime.value = d
    syncTimes()
  }
}

function send() {
  if (!canSend.value) return
  const item = {
    uri: uri.value,
    type: 'video',
    thumbUri: thumbUri.value,
    name: uri.value.split('/').pop() || 'video',
    note: '',
    clipStart: startTime.value,
    clipEnd: endTime.value,
  }
  uni.setStorageSync('gallery_pending_upload', JSON.stringify({ albumId: albumId.value, items: [item] }))
  uni.navigateTo({ url: `/pages/gallery/send?albumId=${encodeURIComponent(albumId.value)}` })
}
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: #ffffff;
  padding: 0 28rpx calc(180rpx + constant(safe-area-inset-bottom));
  padding: 0 28rpx calc(180rpx + env(safe-area-inset-bottom));
}

.head {
  position: sticky;
  top: 0;
  z-index: 10;
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

.back-text {
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

.player {
  margin-top: 18rpx;
  border-radius: 22rpx;
  overflow: hidden;
  background: rgba(17, 17, 17, 0.08);
}

.video {
  width: 100%;
  height: 360rpx;
}

.time-row {
  margin-top: 18rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.time {
  font-size: 26rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.75);
}

.track-wrap {
  margin-top: 18rpx;
}

.track {
  border-radius: 18rpx;
  background: rgba(17, 17, 17, 0.03);
  border: 2rpx solid rgba(17, 17, 17, 0.06);
  padding: 12rpx;
  position: relative;
}

.thumbs {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 8rpx;
}

.thumb {
  height: 92rpx;
  border-radius: 12rpx;
  overflow: hidden;
  background: rgba(17, 17, 17, 0.08);
}

.thumb-img {
  width: 100%;
  height: 100%;
}

.thumb-ph {
  width: 100%;
  height: 100%;
  background: rgba(17, 17, 17, 0.08);
}

.area {
  position: absolute;
  left: 12rpx;
  right: 12rpx;
  top: 12rpx;
  height: 92rpx;
}

.shade {
  position: absolute;
  top: 0;
  height: 92rpx;
  background: rgba(255, 255, 255, 0.72);
}

.shade.left {
  left: 0;
}

.shade.right {
}

.range {
  position: absolute;
  top: 0;
  height: 92rpx;
  border-radius: 12rpx;
  border: 4rpx solid #3d6afb;
  box-sizing: border-box;
}

.handle {
  width: 18px;
  height: 92rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.handle-knob {
  width: 18px;
  height: 92rpx;
  border-radius: 12rpx;
  background: #3d6afb;
}

.hint {
  display: block;
  margin-top: 12rpx;
  text-align: center;
  font-size: 24rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.4);
}

.bottom {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 0 28rpx calc(34rpx + constant(safe-area-inset-bottom));
  padding: 0 28rpx calc(34rpx + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
}

.btn {
  height: 96rpx;
  border-radius: 9999rpx;
  background: #3d6afb;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn.disabled {
  opacity: 0.45;
}

.btn-text {
  color: #ffffff;
  font-size: 32rpx;
  font-weight: 900;
}
</style>
