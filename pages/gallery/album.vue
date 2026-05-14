<template>
  <view class="page">
    <view class="head" :style="{ paddingTop: safeTop + 'px' }">
      <view class="head-left" @click="back">
        <text class="back">‹</text>
      </view>
      <text class="head-title">{{ headerTitle }}</text>
      <view class="head-right">
        <view v-if="selectMode" class="pill" @click="toggleSelectAll">
          <text class="pill-text">✓ 全选</text>
        </view>
        <text v-else class="danger" @click="confirmDeleteAlbum">删除</text>
      </view>
    </view>

    <view class="cover">
      <image v-if="coverUri" class="cover-img" :src="coverUri" mode="aspectFill" />
      <view v-else class="cover-ph">
        <view class="cover-ph-icon" />
      </view>

      <view class="cover-info">
        <view class="cover-line">
          <text class="album-name">{{ album?.name }}</text>
          <view class="edit" @click="openRename">
            <text class="edit-icon">✎</text>
          </view>
        </view>
        <text class="sub">数量:{{ photos.length }}</text>
        <text class="sub">创建:{{ album?.createdAt }}</text>
      </view>
    </view>

    <view class="tools">
      <view class="tool-left" @click="openSlideshow">
        <view class="play">
          <text class="play-icon">▶</text>
        </view>
        <text class="tool-text">幻灯片</text>
      </view>
      <text v-if="!selectMode" class="choose" @click="enterSelect">选择</text>
      <text v-else class="choose" @click="exitSelect">完成</text>
    </view>

    <view v-if="photos.length === 0" class="empty">
      <view class="empty-icon">
        <view class="empty-pic" />
        <view class="empty-plus"><text class="empty-plus-text">+</text></view>
      </view>
      <text class="empty-text">暂无照片</text>
      <view class="empty-btn" @click="openUpload">
        <text class="empty-btn-text">添加照片</text>
      </view>
    </view>

    <view v-else class="grid">
      <view v-for="p in photos" :key="p.id" class="cell" @click="tapPhoto(p.id)">
        <image class="cell-img" :src="p.uri" mode="aspectFill" />
        <view v-if="p.type === 'video'" class="video"><text class="video-icon">▶</text></view>

        <view v-if="selectMode" class="sel" @click.stop="togglePhoto(p.id)">
          <view class="sel-box" :class="{ checked: selectedSet.has(p.id) }">
            <text v-if="selectedSet.has(p.id)" class="sel-check">✓</text>
          </view>
        </view>
      </view>
    </view>

    <view class="fab" @click="openUpload">
      <text class="fab-text">+</text>
    </view>

    <view v-if="selectMode" class="bar">
      <text class="bar-left">{{ selectedCount }}/{{ photos.length }}项已选择</text>
      <view class="bar-actions">
        <view class="bar-btn" @click="openMove"><text class="bar-icon">↗</text></view>
        <view class="bar-btn" @click="openCopy"><text class="bar-icon">⧉</text></view>
        <view class="bar-btn" @click="confirmDeleteSelected"><text class="bar-icon">🗑</text></view>
      </view>
    </view>

    <view v-if="renameVisible" class="sheet-mask" @click="closeRename">
      <view class="sheet" @click.stop>
        <view class="sheet-head">
          <text class="sheet-title">编辑名称</text>
          <text class="sheet-x" @click="closeRename">×</text>
        </view>
        <view class="sheet-input">
          <input v-model="renameValue" class="sheet-field" placeholder="输入相册名称" placeholder-class="sheet-ph" />
        </view>
        <view class="sheet-btn" :class="{ disabled: !renameValue.trim() }" @click="submitRename">
          <text class="sheet-btn-text">确定</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import {
  deleteAlbum,
  deletePhotos,
  ensureGalleryState,
  listAlbums,
  listPhotos,
  renameAlbum,
} from '../../utils/galleryStore'

const albumId = ref('')
const state = ref(ensureGalleryState())
const selectMode = ref(false)
const selectedIds = ref([])
const renameVisible = ref(false)
const renameValue = ref('')

onLoad((options) => {
  albumId.value = options && options.albumId ? String(options.albumId) : ''
})

onShow(() => {
  state.value = ensureGalleryState()
  if (albumId.value && !album.value) {
    uni.showToast({ title: '相册不存在', icon: 'none' })
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

const album = computed(() => {
  const all = listAlbums(state.value, state.value.activeDeviceId)
  return all.find((a) => a.id === albumId.value) || null
})

const photos = computed(() => listPhotos(state.value, albumId.value))

const coverUri = computed(() => {
  const list = photos.value
  return list[0] ? list[0].uri : ''
})

const headerTitle = computed(() => {
  if (selectMode.value) return '选择'
  return album.value ? album.value.name : ''
})

const selectedSet = computed(() => new Set(selectedIds.value))
const selectedCount = computed(() => selectedIds.value.length)

function back() {
  uni.navigateBack()
}

function enterSelect() {
  if (photos.value.length === 0) return
  selectMode.value = true
  selectedIds.value = []
}

function exitSelect() {
  selectMode.value = false
  selectedIds.value = []
}

function togglePhoto(id) {
  const next = new Set(selectedIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selectedIds.value = Array.from(next)
}

function toggleSelectAll() {
  if (selectedIds.value.length === photos.value.length) {
    selectedIds.value = []
    return
  }
  selectedIds.value = photos.value.map((p) => p.id)
}

function tapPhoto(id) {
  if (selectMode.value) {
    togglePhoto(id)
    return
  }
  uni.navigateTo({ url: `/pages/gallery/photo?albumId=${encodeURIComponent(albumId.value)}&photoId=${encodeURIComponent(id)}` })
}

function openSlideshow() {
  if (photos.value.length === 0) return
  uni.navigateTo({ url: `/pages/gallery/slideshow?albumId=${encodeURIComponent(albumId.value)}` })
}

function openUpload() {
  uni.navigateTo({ url: `/pages/gallery/upload?albumId=${encodeURIComponent(albumId.value)}` })
}

function confirmDeleteAlbum() {
  if (!album.value) return
  uni.showModal({
    title: '删除相册',
    content: '相册一旦删除将无法恢复',
    cancelText: '取消',
    confirmText: '确定',
    success: (res) => {
      if (!res.confirm) return
      const s = ensureGalleryState()
      deleteAlbum(s, albumId.value)
      uni.navigateBack()
    },
  })
}

function confirmDeleteSelected() {
  if (selectedIds.value.length === 0) return
  uni.showModal({
    title: '删除图片',
    content: `将删除${selectedIds.value.length}张照片，删除后无法恢复`,
    cancelText: '取消',
    confirmText: '确定',
    success: (res) => {
      if (!res.confirm) return
      const s = ensureGalleryState()
      deletePhotos(s, albumId.value, selectedIds.value)
      state.value = ensureGalleryState()
      exitSelect()
    },
  })
}

function openMove() {
  if (selectedIds.value.length === 0) return
  uni.navigateTo({
    url: `/pages/gallery/choose-album?mode=move&fromAlbumId=${encodeURIComponent(albumId.value)}&ids=${encodeURIComponent(
      selectedIds.value.join(','),
    )}`,
  })
}

function openCopy() {
  if (selectedIds.value.length === 0) return
  uni.navigateTo({
    url: `/pages/gallery/choose-album?mode=copy&fromAlbumId=${encodeURIComponent(albumId.value)}&ids=${encodeURIComponent(
      selectedIds.value.join(','),
    )}`,
  })
}

function openRename() {
  if (!album.value) return
  renameValue.value = album.value.name
  renameVisible.value = true
}

function closeRename() {
  renameVisible.value = false
}

function submitRename() {
  const v = renameValue.value.trim()
  if (!v) return
  const s = ensureGalleryState()
  renameAlbum(s, albumId.value, v)
  state.value = ensureGalleryState()
  renameVisible.value = false
}
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: #ffffff;
  padding-bottom: 180rpx;
}

.head {
  position: sticky;
  top: 0;
  z-index: 999;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
  padding: 18rpx 18rpx 12rpx;
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
  padding-left: 12rpx;
}

.head-title {
  font-size: 34rpx;
  font-weight: 900;
}

.head-right {
  width: 180rpx;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 12rpx;
}

.danger {
  font-size: 28rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.35);
}

.pill {
  height: 56rpx;
  padding: 0 16rpx;
  border-radius: 9999rpx;
  background: #3d6afb;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pill-text {
  color: #ffffff;
  font-size: 26rpx;
  font-weight: 900;
}

.cover {
  margin: 0 28rpx;
  height: 320rpx;
  border-radius: 28rpx;
  overflow: hidden;
  position: relative;
  background: #eef2ff;
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
}

.cover-ph-icon {
  width: 110rpx;
  height: 90rpx;
  border-radius: 18rpx;
  background: rgba(17, 17, 17, 0.12);
}

.cover-info {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 18rpx 18rpx 16rpx;
  background: rgba(0, 0, 0, 0.45);
}

.cover-line {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.album-name {
  color: #ffffff;
  font-size: 30rpx;
  font-weight: 900;
}

.edit {
  width: 46rpx;
  height: 46rpx;
  border-radius: 9999rpx;
  background: rgba(255, 255, 255, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
}

.edit-icon {
  color: #ffffff;
  font-size: 22rpx;
  font-weight: 900;
}

.sub {
  display: block;
  margin-top: 8rpx;
  color: rgba(255, 255, 255, 0.85);
  font-size: 24rpx;
  font-weight: 650;
}

.tools {
  padding: 18rpx 28rpx 12rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.tool-left {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.play {
  width: 44rpx;
  height: 44rpx;
  border-radius: 10rpx;
  border: 2rpx solid rgba(17, 17, 17, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
}

.play-icon {
  font-size: 20rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.65);
  margin-left: 2rpx;
}

.tool-text {
  font-size: 28rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.75);
}

.choose {
  font-size: 28rpx;
  font-weight: 900;
  color: #3d6afb;
}

.empty {
  padding: 180rpx 28rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.empty-icon {
  width: 150rpx;
  height: 150rpx;
  border-radius: 40rpx;
  background: rgba(61, 106, 251, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.empty-pic {
  width: 84rpx;
  height: 70rpx;
  border-radius: 14rpx;
  background: rgba(17, 17, 17, 0.08);
}

.empty-plus {
  position: absolute;
  bottom: 18rpx;
  right: 18rpx;
  width: 52rpx;
  height: 52rpx;
  border-radius: 9999rpx;
  background: rgba(17, 17, 17, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-plus-text {
  color: #ffffff;
  font-size: 34rpx;
  font-weight: 900;
  line-height: 1;
}

.empty-text {
  margin-top: 12rpx;
  font-size: 26rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.5);
}

.empty-btn {
  margin-top: 24rpx;
  width: 360rpx;
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
  padding: 4rpx 18rpx 0;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10rpx;
}

.cell {
  height: 220rpx;
  border-radius: 14rpx;
  overflow: hidden;
  position: relative;
  background: rgba(17, 17, 17, 0.04);
}

.cell-img {
  width: 100%;
  height: 100%;
}

.video {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-icon {
  width: 64rpx;
  height: 64rpx;
  border-radius: 9999rpx;
  background: rgba(0, 0, 0, 0.45);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  font-weight: 900;
  padding-left: 4rpx;
}

.sel {
  position: absolute;
  top: 10rpx;
  right: 10rpx;
}

.sel-box {
  width: 36rpx;
  height: 36rpx;
  border-radius: 10rpx;
  background: rgba(255, 255, 255, 0.92);
  border: 2rpx solid rgba(17, 17, 17, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
}

.sel-box.checked {
  background: #3d6afb;
  border-color: #3d6afb;
}

.sel-check {
  color: #ffffff;
  font-size: 22rpx;
  font-weight: 900;
  line-height: 1;
}

.fab {
  position: fixed;
  right: 28rpx;
  bottom: 58rpx;
  width: 118rpx;
  height: 118rpx;
  border-radius: 9999rpx;
  background: #3d6afb;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.fab-text {
  color: #ffffff;
  font-size: 58rpx;
  font-weight: 700;
  line-height: 1;
  margin-top: -4rpx;
}

.bar {
  position: fixed;
  left: 18rpx;
  right: 18rpx;
  bottom: 24rpx;
  height: 120rpx;
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 10rpx 30rpx rgba(17, 17, 17, 0.12);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 22rpx;
  z-index: 60;
}

.bar-left {
  font-size: 28rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.75);
}

.bar-actions {
  display: flex;
  align-items: center;
  gap: 22rpx;
}

.bar-btn {
  width: 76rpx;
  height: 76rpx;
  border-radius: 22rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(17, 17, 17, 0.7);
}

.bar-icon {
  font-size: 34rpx;
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
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 44rpx;
  font-weight: 700;
  color: rgba(17, 17, 17, 0.55);
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
