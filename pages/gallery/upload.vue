<template>
  <view class="page">
    <view class="head" :style="{ paddingTop: safeTop + 'px' }">
      <view class="head-left" @click="back">
        <text class="back">‹</text>
      </view>
      <text class="head-title">{{ $t('上传照片') }}</text>
      <view class="head-right" />
    </view>

    <text class="hint">{{ $t('选择相片上传到指定的相册') }}</text>

    <view class="device-row">
      <image class="mini-icon" src="/static/gallery/icon_video_camera.png" mode="aspectFit" />
      <text class="device-name">{{ activeDevice.name }}</text>
      <image class="device-arrow" src="/static/gallery/icon_arrow_up.png" mode="aspectFit" />
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
          <image v-if="a.id === targetAlbumId" class="radio-check" src="/static/common/icon_checkbox_checked.png" mode="aspectFit" />
        </view>
      </view>
    </view>

    <view class="actions">
      <view class="btn" :class="{ disabled: !targetAlbumId }" @click="pickFromAlbum">
        <text class="btn-text">{{ $t('相册') }}</text>
      </view>
      <view class="btn secondary" :class="{ disabled: !targetAlbumId }" @click="pickFromCamera">
        <text class="btn-text secondary-text">{{ $t('相机') }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { getCalendarDeviceList } from '../../utils/api/device'
import { getAlbumList } from '../../utils/api/gallery'

const targetAlbumId = ref('')
const devices = ref([])
const activeDeviceId = ref('')
const rawAlbums = ref([])

onLoad((options) => {
  const id = options && options.albumId ? String(options.albumId) : ''
  targetAlbumId.value = id
})

onShow(() => {
  refresh()
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

const activeDevice = computed(() => {
  const found = devices.value.find((it) => it.id === activeDeviceId.value)
  return found || devices.value[0] || { id: '', name: uni.$t('我的设备'), email: '' }
})

const albums = computed(() =>
  (rawAlbums.value || []).map((it) => ({
    id: it.albumId,
    name: it.albumName,
  })),
)

async function refresh() {
  try {
    const list = await getCalendarDeviceList()
    devices.value = (list || []).map((it) => ({
      id: String(it.deviceEmail || ''),
      email: String(it.deviceEmail || ''),
      name: String(it.deviceName || it.deviceEmail || uni.$t('日历设备')),
    }))
    const stored = String(uni.getStorageSync('active_device_email_v1') || '').trim()
    const nextActive = devices.value.find((it) => it.id === stored) ? stored : devices.value[0]?.id || ''
    activeDeviceId.value = nextActive
    if (nextActive) {
      const current = devices.value.find((it) => it.id === nextActive)
      if (current && current.name) uni.setStorageSync('active_device_name_v1', String(current.name))
    }
    rawAlbums.value = nextActive ? await getAlbumList({ deviceEmail: nextActive }) : []
    if (!targetAlbumId.value && rawAlbums.value[0] && rawAlbums.value[0].albumId) {
      targetAlbumId.value = String(rawAlbums.value[0].albumId)
    }
  } catch (e) {
    devices.value = []
    rawAlbums.value = []
    uni.showToast({ title: String((e && e.message) || uni.$t('获取相册失败')), icon: 'none' })
  }
}

function back() {
  uni.navigateBack()
}

function toSendItems(items) {
  const list = (items || []).map((x) => ({
    uri: x && x.uri ? String(x.uri) : '',
    type: x && x.type ? String(x.type) : 'image',
    thumbUri: x && x.thumbUri ? String(x.thumbUri) : '',
    name: x && x.name ? String(x.name) : (x && x.uri ? String(x.uri).split('/').pop() || 'media' : 'media'),
    note: x && x.note ? String(x.note) : '',
  }))
  uni.setStorageSync('gallery_pending_upload', JSON.stringify({ albumId: targetAlbumId.value, items: list.filter((x) => x.uri) }))
  uni.navigateTo({ url: `/pages/gallery/send?albumId=${encodeURIComponent(targetAlbumId.value)}` })
}

function toSendImages(paths) {
  const list = (paths || []).map((p) => ({
    uri: p,
    type: 'image',
    thumbUri: '',
    name: String(p).split('/').pop() || 'photo',
    note: '',
  }))
  toSendItems(list)
}

function pickImages(source, count) {
  uni.chooseImage({
    count,
    sourceType: [source],
    success: (res) => {
      const paths = res && res.tempFilePaths ? res.tempFilePaths : []
      if (!paths.length) return
      toSendImages(paths)
    },
  })
}

function pickVideo(source) {
  uni.chooseVideo({
    sourceType: [source],
    compressed: true,
    maxDuration: 60,
    success: (res) => {
      const uri = res && res.tempFilePath ? String(res.tempFilePath) : ''
      if (!uri) return
      const thumb = res && res.thumbTempFilePath ? String(res.thumbTempFilePath) : ''
      const dur = res && typeof res.duration === 'number' ? res.duration : 0
      uni.navigateTo({
        url: `/pages/gallery/video-edit?albumId=${encodeURIComponent(targetAlbumId.value)}&uri=${encodeURIComponent(
          uri,
        )}&thumbUri=${encodeURIComponent(thumb)}&duration=${encodeURIComponent(String(dur))}`,
      })
    },
  })
}

function pickFromAlbum() {
  if (!targetAlbumId.value) return
  uni.showActionSheet({
    itemList: [uni.$t('照片'), uni.$t('视频')],
    success: (res) => {
      const idx = res && typeof res.tapIndex === 'number' ? res.tapIndex : -1
      if (idx === 0) pickImages('album', 9)
      if (idx === 1) pickVideo('album')
    },
  })
}

function pickFromCamera() {
  if (!targetAlbumId.value) return
  uni.showActionSheet({
    itemList: [uni.$t('拍照'), uni.$t('录像')],
    success: (res) => {
      const idx = res && typeof res.tapIndex === 'number' ? res.tapIndex : -1
      if (idx === 0) pickImages('camera', 1)
      if (idx === 1) pickVideo('camera')
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
  width: 30rpx;
  height: 30rpx;
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
