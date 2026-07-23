<template>
  <view class="page">
    <view class="head" :style="{ paddingTop: safeTop + 'px' }">
      <view class="head-left" @click="back">
        <text class="back">‹</text>
      </view>
      <text class="head-title">{{ title }}</text>
      <view class="head-right" />
    </view>

    <text v-if="mode === 'copy'" class="hint">{{ $t('将选定的照片复制到另一个相册') }}</text>
    <text v-else class="hint">{{ $t('将选定的照片转移到另一个相册') }}</text>

    <view class="device-row">
      <image class="mini-icon" src="/static/gallery/icon_video_camera.png" mode="aspectFit" />
      <text class="device-name">{{ activeDevice.name }}</text>
      <image class="device-arrow" src="/static/gallery/icon_arrow_up.png" mode="aspectFit" />
    </view>

    <view class="list">
      <view
        v-for="a in targets"
        :key="a.id"
        class="item"
        :class="{ active: a.id === targetAlbumId }"
        @click="targetAlbumId = a.id"
      >
        <text class="item-text">{{ a.name }}</text>
        <view class="radio" :class="{ checked: a.id === targetAlbumId }">
          <image v-if="a.id === targetAlbumId" class="radio-check" src="/static/common/icon_checkbox_checked.png" mode="aspectFit" />
        </view>
      </view>
    </view>

    <view class="btn" :class="{ disabled: !targetAlbumId }" @click="submit">
      <text class="btn-text">{{ buttonText }}</text>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import {
  copyPhotosToAlbum,
  ensureGalleryState,
  getActiveDevice,
  listAlbums,
  movePhotosToAlbum,
} from '../../utils/galleryStore'

const mode = ref('move')
const fromAlbumId = ref('')
const ids = ref([])
const targetAlbumId = ref('')
const state = ref(ensureGalleryState())

onLoad((options) => {
  mode.value = options && options.mode ? String(options.mode) : 'move'
  fromAlbumId.value = options && options.fromAlbumId ? String(options.fromAlbumId) : ''
  const raw = options && options.ids ? String(options.ids) : ''
  ids.value = raw ? raw.split(',').filter(Boolean) : []
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

const targets = computed(() => {
  const list = listAlbums(state.value, state.value.activeDeviceId)
  return list.filter((a) => a.id !== fromAlbumId.value)
})

const title = computed(() => (mode.value === 'copy' ? uni.$t('复制照片') : uni.$t('转移照片')))
const buttonText = computed(() => (mode.value === 'copy' ? uni.$t('复制照片') : uni.$t('转移照片')))

function back() {
  uni.navigateBack()
}

function submit() {
  if (!targetAlbumId.value || ids.value.length === 0) return
  uni.showModal({
    title: '',
    content: uni.$t('你的照片将被添加到选定的设备。'),
    showCancel: false,
    confirmText: uni.$t('好的'),
    success: () => {
      const s = ensureGalleryState()
      if (mode.value === 'copy') {
        copyPhotosToAlbum(s, fromAlbumId.value, targetAlbumId.value, ids.value)
      } else {
        movePhotosToAlbum(s, fromAlbumId.value, targetAlbumId.value, ids.value)
      }
      uni.navigateBack()
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
  padding: 10rpx 0 20rpx;
  font-size: 28rpx;
  font-weight: 700;
  color: rgba(17, 17, 17, 0.6);
}

.device-row {
  display: flex;
  align-items: center;
  gap: 10rpx;
  padding: 14rpx 0 10rpx;
}

.mini-icon {
  width: 34rpx;
  height: 24rpx;
}

.device-name {
  font-size: 32rpx;
  font-weight: 900;
}

.device-arrow {
  width: 28rpx;
  height: 28rpx;
  opacity: 0.55;
}

.list {
  margin-top: 6rpx;
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.item {
  height: 96rpx;
  border-radius: 22rpx;
  background: #ffffff;
  border: 2rpx solid rgba(17, 17, 17, 0.06);
  padding: 0 22rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
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
  width: 28rpx;
  height: 28rpx;
}

.btn {
  margin-top: 24rpx;
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
