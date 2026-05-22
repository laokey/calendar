<template>
  <view class="page">
    <view class="top" :style="{ paddingTop: safeTop + 'px' }">
      <view class="top-left" @click="toggleDeviceMenu">
        <image class="mini-icon" src="/static/gallery/icon_video_camera.png" mode="aspectFit" />
        <text class="top-title">{{ activeDevice.name }}</text>
        <image
          class="top-arrow"
          :src="showDeviceMenu ? '/static/gallery/icon_arrow_up.png' : '/static/gallery/icon_arrow_down.png'"
          mode="aspectFit"
        />
      </view>
      <view class="top-right" @click="openAddAlbum">
        <image class="plus" src="/static/gallery/icon_add.png" mode="aspectFit" />
      </view>
    </view>

    <view v-if="showDeviceMenu" class="mask" @click="showDeviceMenu = false">
      <view class="device-menu" @click.stop>
        <view
          v-for="d in state.devices"
          :key="d.id"
          class="device-item"
          :class="{ active: d.id === state.activeDeviceId }"
          @click="selectDevice(d.id)"
        >
          <view class="device-row">
            <image class="device-icon" src="/static/gallery/icon_video_camera.png" mode="aspectFit" />
            <text class="device-name">{{ d.name }}</text>
          </view>
          <image v-if="d.id === state.activeDeviceId" class="device-check" src="/static/gallery/icon_check.png" mode="aspectFit" />
        </view>
      </view>
    </view>

    <view v-if="albums.length === 0" class="empty">
      <view class="empty-hero">
        <view class="empty-icon">
          <image class="empty-pic" src="/static/gallery/bg_none_galley.png" mode="aspectFit" />
        </view>
      </view>
      <text class="empty-text">暂无相册，快来添加你的相册吧！～</text>
      <view class="empty-btn" @click="openAddAlbum">
        <text class="empty-btn-text">添加相册</text>
      </view>
    </view>

    <view v-else class="grid">
      <view v-for="a in albums" :key="a.id" class="card" @click="openAlbum(a.id)">
        <view class="cover">
          <image v-if="a.coverUri" class="cover-img" :src="a.coverUri" mode="aspectFill" />
          <view v-else class="cover-ph">
            <view class="ph-pic" />
          </view>
          <view class="count-badge"><text class="count-text">{{ a.count }}</text></view>
        </view>
        <text class="card-title">{{ a.name }}</text>
      </view>
    </view>

    <BlBottomNav active="gallery" />

    <view v-if="showAdd" class="sheet-mask" @click="closeAddAlbum">
      <view class="sheet" @click.stop>
        <view class="sheet-head">
          <text class="sheet-title">添加相册</text>
          <image class="sheet-x" src="/static/gallery/icon_close.png" mode="aspectFit" @click="closeAddAlbum" />
        </view>
        <view class="sheet-input">
          <input v-model="newAlbumName" class="sheet-field" placeholder="输入相册名称" placeholder-class="sheet-ph" />
        </view>
        <view class="sheet-btn" :class="{ disabled: !newAlbumName.trim() }" @click="createAlbum">
          <text class="sheet-btn-text">确定</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import BlBottomNav from '../../components/BlBottomNav.vue'
import { addAlbum, ensureGalleryState, getActiveDevice, listAlbums, setActiveDeviceId } from '../../utils/galleryStore'

const showDeviceMenu = ref(false)
const showAdd = ref(false)
const newAlbumName = ref('')

const state = ref(ensureGalleryState())

onShow(() => {
  state.value = ensureGalleryState()
})

const activeDevice = computed(() => getActiveDevice(state.value))

const albums = computed(() => {
  const list = listAlbums(state.value, state.value.activeDeviceId)
  return list.map((a) => {
    const photos = state.value.photosByAlbum[a.id] || []
    const coverUri = photos[0] ? photos[0].uri : ''
    return { ...a, count: photos.length, coverUri }
  })
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

function toggleDeviceMenu() {
  showDeviceMenu.value = !showDeviceMenu.value
}

function selectDevice(id) {
  const s = ensureGalleryState()
  state.value = setActiveDeviceId(s, id)
  showDeviceMenu.value = false
}

function openAlbum(albumId) {
  uni.navigateTo({ url: `/pages/gallery/album?albumId=${encodeURIComponent(albumId)}` })
}

function openAddAlbum() {
  showDeviceMenu.value = false
  showAdd.value = true
  newAlbumName.value = ''
}

function closeAddAlbum() {
  showAdd.value = false
}

function createAlbum() {
  const name = newAlbumName.value.trim()
  if (!name) return
  const s = ensureGalleryState()
  const album = addAlbum(s, s.activeDeviceId, name)
  state.value = ensureGalleryState()
  showAdd.value = false
  uni.navigateTo({ url: `/pages/gallery/album?albumId=${encodeURIComponent(album.id)}` })
}
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: #ffffff;
}

.top {
  padding: 18rpx 28rpx 14rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.top-left {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.mini-icon {
  width: 34rpx;
  height: 24rpx;
}

.top-title {
  font-size: 36rpx;
  font-weight: 900;
}

.top-arrow {
  width: 28rpx;
  height: 28rpx;
  opacity: 0.55;
}

.top-right {
  width: 80rpx;
  height: 80rpx;
  border-radius: 9999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.plus {
  width: 44rpx;
  height: 44rpx;
  opacity: 0.8;
}

.mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  z-index: 100;
}

.device-menu {
  margin-top: 140rpx;
  padding: 0 28rpx;
}

.device-item {
  background: #ffffff;
  border-radius: 22rpx;
  padding: 20rpx 22rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.device-item + .device-item {
  margin-top: 14rpx;
}

.device-item.active {
  background: #eef2ff;
}

.device-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.device-icon {
  width: 34rpx;
  height: 24rpx;
}

.device-name {
  font-size: 32rpx;
  font-weight: 900;
}

.device-check {
  width: 32rpx;
  height: 32rpx;
}

.empty {
  padding: 160rpx 28rpx 220rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.empty-hero {
  width: 240rpx;
  height: 240rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-icon {
  width: 200rpx;
  height: 200rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.empty-pic {
  width: 200rpx;
  height: 200rpx;
}

.empty-text {
  margin-top: 10rpx;
  font-size: 26rpx;
  font-weight: 700;
  color: rgba(17, 17, 17, 0.5);
}

.empty-btn {
  margin-top: 26rpx;
  width: 380rpx;
  height: 92rpx;
  border-radius: 9999rpx;
  background: #3d6afb;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-btn-text {
  color: #ffffff;
  font-size: 32rpx;
  font-weight: 900;
}

.grid {
  padding: 8rpx 28rpx 220rpx;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18rpx;
}

.card {
  border-radius: 28rpx;
  overflow: hidden;
  background: #ffffff;
  box-shadow: 0 10rpx 26rpx rgba(17, 17, 17, 0.06);
}

.cover {
  height: 240rpx;
  position: relative;
  background: rgba(17, 17, 17, 0.04);
}

.cover-img {
  width: 100%;
  height: 100%;
}

.cover-ph {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #eef2ff;
}

.ph-pic {
  width: 86rpx;
  height: 70rpx;
  border-radius: 16rpx;
  background: rgba(17, 17, 17, 0.12);
}

.count-badge {
  position: absolute;
  bottom: 12rpx;
  right: 12rpx;
  min-width: 58rpx;
  height: 44rpx;
  padding: 0 14rpx;
  border-radius: 9999rpx;
  background: rgba(17, 17, 17, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
}

.count-text {
  color: #ffffff;
  font-size: 24rpx;
  font-weight: 900;
}

.card-title {
  display: block;
  padding: 16rpx 18rpx 18rpx;
  font-size: 30rpx;
  font-weight: 900;
}

.sheet-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  z-index: 200;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.sheet {
  width: 100%;
  background: #ffffff;
  border-top-left-radius: 28rpx;
  border-top-right-radius: 28rpx;
  padding: 18rpx 28rpx 34rpx;
}

.sheet-head {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 10rpx 0 14rpx;
}

.sheet-title {
  font-size: 34rpx;
  font-weight: 900;
}

.sheet-x {
  position: absolute;
  right: 0;
  top: 0;
  width: 72rpx;
  height: 72rpx;
  padding: 20rpx;
  box-sizing: border-box;
  opacity: 0.55;
}

.sheet-input {
  margin-top: 12rpx;
  height: 96rpx;
  border-radius: 22rpx;
  background: rgba(17, 17, 17, 0.03);
  padding: 0 20rpx;
  border: 2rpx solid rgba(17, 17, 17, 0.06);
  display: flex;
  align-items: center;
}

.sheet-field {
  width: 100%;
  font-size: 34rpx;
  font-weight: 700;
}

.sheet-ph {
  color: rgba(17, 17, 17, 0.35);
  font-weight: 650;
}

.sheet-btn {
  margin-top: 20rpx;
  height: 100rpx;
  border-radius: 9999rpx;
  background: #3d6afb;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sheet-btn.disabled {
  background: rgba(17, 17, 17, 0.18);
}

.sheet-btn-text {
  color: #ffffff;
  font-size: 34rpx;
  font-weight: 900;
}

.sheet-btn.disabled .sheet-btn-text {
  color: rgba(17, 17, 17, 0.55);
}
</style>
