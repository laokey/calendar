<template>
  <view class="page">
    <view class="head" :style="{ paddingTop: safeTop + 'px' }">
      <view class="head-left" @click="back">
        <text class="back">‹</text>
      </view>
      <text class="head-title">上传照片</text>
      <view class="head-right" />
    </view>

    <text class="hint">选择相片上传到指定的相册</text>

    <view class="device-row">
      <view class="mini-icon" />
      <text class="device-name">{{ activeDevice.name }}</text>
      <text class="device-arrow">▴</text>
    </view>

    <view class="list">
      <view
        v-for="a in albums"
        :key="a.id"
        class="item"
        :class="{ active: a.id === targetAlbumId }"
        @click="targetAlbumId = a.id"
      >
        <text class="item-text">{{ a.name }}</text>
        <view class="radio" :class="{ checked: a.id === targetAlbumId }">
          <text v-if="a.id === targetAlbumId" class="radio-check">✓</text>
        </view>
      </view>
    </view>

    <view class="actions">
      <view class="btn" :class="{ disabled: !targetAlbumId }" @click="pickFromAlbum">
        <text class="btn-text">相册</text>
      </view>
      <view class="btn secondary" :class="{ disabled: !targetAlbumId }" @click="pickFromCamera">
        <text class="btn-text secondary-text">相机</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { ensureGalleryState, getActiveDevice, listAlbums } from '../../utils/galleryStore'

const state = ref(ensureGalleryState())
const targetAlbumId = ref('')

onLoad((options) => {
  const id = options && options.albumId ? String(options.albumId) : ''
  targetAlbumId.value = id
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

const activeDevice = computed(() => getActiveDevice(state.value))
const albums = computed(() => listAlbums(state.value, state.value.activeDeviceId))

function back() {
  uni.navigateBack()
}

function toSend(paths) {
  const list = (paths || []).map((p) => ({
    uri: p,
    type: 'image',
    name: String(p).split('/').pop() || 'photo',
    note: '',
  }))
  uni.setStorageSync('gallery_pending_upload', JSON.stringify({ albumId: targetAlbumId.value, items: list }))
  uni.navigateTo({ url: `/pages/gallery/send?albumId=${encodeURIComponent(targetAlbumId.value)}` })
}

function pickFromAlbum() {
  if (!targetAlbumId.value) return
  uni.chooseImage({
    count: 9,
    sourceType: ['album'],
    success: (res) => {
      const paths = res && res.tempFilePaths ? res.tempFilePaths : []
      if (!paths.length) return
      toSend(paths)
    },
  })
}

function pickFromCamera() {
  if (!targetAlbumId.value) return
  uni.chooseImage({
    count: 1,
    sourceType: ['camera'],
    success: (res) => {
      const paths = res && res.tempFilePaths ? res.tempFilePaths : []
      if (!paths.length) return
      toSend(paths)
    },
  })
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

.hint {
  display: block;
  padding: 10rpx 0 22rpx;
  font-size: 28rpx;
  font-weight: 700;
  color: rgba(17, 17, 17, 0.6);
}

.device-row {
  display: flex;
  align-items: center;
  gap: 10rpx;
  padding: 0 0 10rpx;
}

.mini-icon {
  width: 34rpx;
  height: 24rpx;
  border-radius: 6rpx;
  background: linear-gradient(135deg, #ffd24d 0%, #3d6afb 100%);
}

.device-name {
  font-size: 32rpx;
  font-weight: 900;
}

.device-arrow {
  font-size: 26rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.55);
  margin-top: 2rpx;
}

.list {
  margin-top: 10rpx;
  padding: 10rpx 0;
  border-radius: 28rpx;
  background: rgba(17, 17, 17, 0.02);
}

.item {
  height: 96rpx;
  margin: 0 14rpx;
  border-radius: 22rpx;
  background: #ffffff;
  padding: 0 22rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 2rpx solid rgba(17, 17, 17, 0.06);
}

.item + .item {
  margin-top: 12rpx;
}

.item.active {
  background: #eef2ff;
  border-color: rgba(61, 106, 251, 0.8);
}

.item-text {
  font-size: 30rpx;
  font-weight: 900;
}

.radio {
  width: 44rpx;
  height: 44rpx;
  border-radius: 9999rpx;
  background: rgba(17, 17, 17, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(17, 17, 17, 0.35);
}

.radio.checked {
  background: #3d6afb;
  color: #ffffff;
}

.radio-check {
  font-size: 26rpx;
  font-weight: 900;
}

.actions {
  margin-top: 34rpx;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.btn {
  height: 104rpx;
  border-radius: 9999rpx;
  background: #3d6afb;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn.secondary {
  background: #eef2ff;
}

.btn.disabled {
  background: rgba(17, 17, 17, 0.18);
}

.btn.secondary.disabled {
  background: rgba(17, 17, 17, 0.08);
}

.btn-text {
  color: #ffffff;
  font-size: 34rpx;
  font-weight: 900;
}

.secondary-text {
  color: #3d6afb;
}
</style>
