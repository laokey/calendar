<template>
  <view class="page">
    <view class="head" :style="{ paddingTop: safeTop + 'px' }">
      <view class="head-left" @click="back">
        <text class="back">‹</text>
      </view>
      <text class="head-title">相片详情</text>
      <view class="head-right">
        <image class="danger" src="/static/gallery/icon_trash.png" mode="aspectFit" @click="confirmDelete" />
      </view>
    </view>

    <view v-if="photo" class="body">
      <view class="hero">
        <video
          v-if="photo.type === 'video'"
          id="photoVideo"
          class="hero-video"
          :src="photo.uri"
          :controls="true"
          :show-center-play-btn="true"
          :show-fullscreen-btn="true"
          :show-play-btn="true"
          :enable-progress-gesture="true"
          :initial-time="clipStart"
          object-fit="contain"
          @timeupdate="onVideoTimeUpdate"
        />
        <image v-else class="hero-img" :src="photo.uri" mode="aspectFill" />
      </view>

      <view class="ops">
        <view class="op" @click="toggleLike">
          <image
            class="op-icon"
            :src="photo.liked ? '/static/gallery/icon_heart_filled.png' : '/static/gallery/icon_heart_outline.png'"
            mode="aspectFit"
          />
        </view>
        <view class="op" @click="refresh">
          <image class="op-icon" src="/static/gallery/icon_refresh_outline.png" mode="aspectFit" />
        </view>
        <view class="op" @click="share">
          <image class="op-icon" src="/static/gallery/icon_move.png" mode="aspectFit" />
        </view>
      </view>

      <view class="title-wrap">
        <view class="pencil"><image class="pencil-icon" src="/static/gallery/icon_edit.png" mode="aspectFit" /></view>
        <input
          v-model="titleDraft"
          class="title-input"
          placeholder="添加标题..."
          placeholder-class="ph"
          @blur="saveTitle"
        />
      </view>

      <view class="info">
        <image class="mini-icon" src="/static/gallery/icon_video_camera.png" mode="aspectFit" />
        <text class="info-text">{{ deviceName }}</text>
        <view class="dot" />
        <text class="info-text">{{ photo.createdAt }}</text>
      </view>

      <view class="comments">
        <text class="c-title">评论({{ photo.comments ? photo.comments.length : 0 }})</text>
        <view v-for="c in photo.comments || []" :key="c.id" class="c-item">
          <text class="c-user">{{ c.user }}</text>
          <text class="c-body">{{ c.text }}</text>
          <text class="c-time">{{ c.createdAt }}</text>
        </view>
      </view>
    </view>

    <view class="composer">
      <input v-model="commentDraft" class="composer-input" placeholder="添加评论" placeholder-class="ph" confirm-type="send" @confirm="send" />
      <view class="send" :class="{ disabled: !commentDraft.trim() }" @click="send">
        <image class="send-icon" src="/static/gallery/icon_send.png" mode="aspectFit" />
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { addPhotoComment, deletePhotos, ensureGalleryState, getActiveDevice, updatePhoto } from '../../utils/galleryStore'

const albumId = ref('')
const photoId = ref('')
const state = ref(ensureGalleryState())

const titleDraft = ref('')
const commentDraft = ref('')

onLoad((options) => {
  albumId.value = options && options.albumId ? String(options.albumId) : ''
  photoId.value = options && options.photoId ? String(options.photoId) : ''
})

onShow(() => {
  state.value = ensureGalleryState()
  if (photo.value) titleDraft.value = photo.value.title || ''
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

const photo = computed(() => {
  const list = state.value.photosByAlbum[albumId.value] || []
  return list.find((p) => p.id === photoId.value) || null
})

const deviceName = computed(() => {
  const d = getActiveDevice(state.value)
  return d ? d.name.replace('的日历', '') : ''
})

const clipStart = computed(() => {
  const v = photo.value && typeof photo.value.clipStart === 'number' ? photo.value.clipStart : Number(photo.value?.clipStart || 0) || 0
  return Math.max(0, v)
})

const clipEnd = computed(() => {
  const v = photo.value && typeof photo.value.clipEnd === 'number' ? photo.value.clipEnd : Number(photo.value?.clipEnd || 0) || 0
  return Math.max(0, v)
})

function back() {
  uni.navigateBack()
}

function refresh() {
  state.value = ensureGalleryState()
}

function share() {
  uni.showToast({ title: '未实现', icon: 'none' })
}

function toggleLike() {
  if (!photo.value) return
  const s = ensureGalleryState()
  updatePhoto(s, albumId.value, photoId.value, { liked: !photo.value.liked })
  state.value = ensureGalleryState()
}

function saveTitle() {
  if (!photo.value) return
  const s = ensureGalleryState()
  updatePhoto(s, albumId.value, photoId.value, { title: titleDraft.value.trim() })
  state.value = ensureGalleryState()
}

function onVideoTimeUpdate(e) {
  const end = clipEnd.value
  if (!end) return
  const cur = e && e.detail && typeof e.detail.currentTime === 'number' ? e.detail.currentTime : 0
  if (cur >= end) {
    const ctx = uni.createVideoContext('photoVideo')
    ctx.pause()
  }
}

function send() {
  const text = commentDraft.value.trim()
  if (!text || !photo.value) return
  const user = uni.getStorageSync('auth_name') || 'REERT'
  const s = ensureGalleryState()
  addPhotoComment(s, albumId.value, photoId.value, { user, text })
  commentDraft.value = ''
  state.value = ensureGalleryState()
}

function confirmDelete() {
  if (!photo.value) return
  uni.showModal({
    title: '删除',
    content: '确认删除该照片？',
    cancelText: '取消',
    confirmText: '确定',
    success: (res) => {
      if (!res.confirm) return
      const s = ensureGalleryState()
      deletePhotos(s, albumId.value, [photoId.value])
      uni.navigateBack()
    },
  })
}
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: #ffffff;
  padding-bottom: 140rpx;
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
  width: 120rpx;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 12rpx;
}

.danger {
  width: 34rpx;
  height: 34rpx;
  opacity: 0.65;
}

.body {
  padding: 0 28rpx;
}

.hero {
  border-radius: 28rpx;
  overflow: hidden;
  background: rgba(17, 17, 17, 0.06);
}

.hero-img {
  width: 100%;
  height: 820rpx;
}

.hero-video {
  width: 100%;
  height: 820rpx;
}

.ops {
  height: 92rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8rpx;
}

.op {
  width: 84rpx;
  height: 84rpx;
  border-radius: 9999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(17, 17, 17, 0.65);
}

.op-icon {
  width: 40rpx;
  height: 40rpx;
  opacity: 0.75;
}

.title-wrap {
  height: 94rpx;
  border-radius: 22rpx;
  background: rgba(17, 17, 17, 0.03);
  border: 2rpx solid rgba(17, 17, 17, 0.06);
  padding: 0 18rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.pencil {
  width: 44rpx;
  height: 44rpx;
  border-radius: 14rpx;
  background: rgba(17, 17, 17, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
}

.pencil-icon {
  width: 22rpx;
  height: 22rpx;
  opacity: 0.6;
}

.title-input {
  flex: 1;
  font-size: 28rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.85);
}

.ph {
  color: rgba(17, 17, 17, 0.35);
  font-weight: 650;
}

.info {
  margin-top: 16rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
  color: rgba(17, 17, 17, 0.55);
}

.mini-icon {
  width: 34rpx;
  height: 24rpx;
}

.info-text {
  font-size: 24rpx;
  font-weight: 700;
}

.dot {
  width: 8rpx;
  height: 8rpx;
  border-radius: 9999rpx;
  background: rgba(17, 17, 17, 0.22);
}

.comments {
  margin-top: 18rpx;
  border-radius: 28rpx;
  background: rgba(17, 17, 17, 0.02);
  padding: 18rpx 18rpx 10rpx;
}

.c-title {
  display: block;
  font-size: 28rpx;
  font-weight: 900;
  margin-bottom: 10rpx;
}

.c-item {
  padding: 12rpx 0;
}

.c-user {
  font-size: 26rpx;
  font-weight: 900;
  color: #3d6afb;
}

.c-body {
  display: block;
  margin-top: 8rpx;
  font-size: 26rpx;
  font-weight: 750;
  color: rgba(17, 17, 17, 0.85);
}

.c-time {
  display: block;
  margin-top: 6rpx;
  font-size: 22rpx;
  font-weight: 650;
  color: rgba(17, 17, 17, 0.45);
}

.composer {
  position: fixed;
  left: 18rpx;
  right: 18rpx;
  bottom: 22rpx;
  height: 110rpx;
  border-radius: 26rpx;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 10rpx 30rpx rgba(17, 17, 17, 0.12);
  display: flex;
  align-items: center;
  gap: 14rpx;
  padding: 0 18rpx;
}

.composer-input {
  flex: 1;
  height: 76rpx;
  border-radius: 20rpx;
  background: rgba(17, 17, 17, 0.03);
  border: 2rpx solid rgba(17, 17, 17, 0.06);
  padding: 0 16rpx;
  font-size: 28rpx;
  font-weight: 750;
}

.send {
  width: 86rpx;
  height: 86rpx;
  border-radius: 26rpx;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
}

.send.disabled {
  opacity: 0.35;
}

.send-icon {
  width: 64rpx;
  height: 64rpx;
}
</style>
