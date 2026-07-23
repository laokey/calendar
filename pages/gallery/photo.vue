<template>
  <view class="page">
    <view class="head" :style="{ paddingTop: safeTop + 'px' }">
      <view class="head-left" @click="back">
        <text class="back">‹</text>
      </view>
      <text class="head-title">{{ $t('相片详情') }}</text>
      <view class="head-right" @click="confirmDelete">
        <text class="danger-text">{{ $t('删除') }}</text>
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
        <view class="ops-left">
          <view class="op" @click="toggleLike">
            <image
              class="op-icon"
              :src="isLiked ? '/static/gallery/icon_heart_filled.png' : '/static/gallery/icon_heart_outline.png'"
              mode="aspectFit"
            />
          </view>
        </view>
        <view class="ops-right">
          <view class="op" @click="refresh">
            <image class="op-icon" src="/static/gallery/icon_refresh_outline.png" mode="aspectFit" />
          </view>
          <view class="op" @click="noopAction">
            <image class="op-icon" src="/static/gallery/icon_move.png" mode="aspectFit" />
          </view>
        </view>
      </view>

      <view class="title-wrap">
        <view class="pencil"><image class="pencil-icon" src="/static/gallery/icon_edit.png" mode="aspectFit" /></view>
        <input
          v-model="titleDraft"
          class="title-input"
          :placeholder="$t('添加标题...')"
          placeholder-class="ph"
          confirm-type="done"
          @confirm="saveTitle"
          @blur="saveTitle"
        />
      </view>

      <view class="info">
        <view class="info-left">
          <text class="info-text device-text">{{ deviceName }}</text>
        </view>
        <view class="info-right">
          <view class="clock-dot" />
          <text class="info-text">{{ uploadTime }}</text>
        </view>
      </view>

      <view class="comments">
        <text class="c-title">{{ $t('评论') }}({{ comments.length }})</text>
        <view v-for="c in comments" :key="c.id" class="c-item">
          <view class="c-line">
            <text class="c-user">{{ c.user }}</text>
            <text class="c-body">{{ c.text }}</text>
          </view>
          <text class="c-time">{{ formatRelativeTime(c.createdAt) }}</text>
        </view>
        <text v-if="!comments.length" class="c-empty">{{ $t('暂无评论') }}</text>
      </view>
    </view>

    <view class="composer">
      <input v-model="commentDraft" class="composer-input" :placeholder="$t('添加评论')" placeholder-class="ph" confirm-type="send" @confirm="send" />
      <view class="send" :class="{ disabled: !commentDraft.trim() }" @click="send">
        <image class="send-icon" src="/static/gallery/icon_send.png" mode="aspectFit" />
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { getCalendarDeviceList } from '../../utils/api/device'
import { addAlbumComment, deleteAlbumPhoto, getAlbumCommentList, getAlbumList, likeAlbum, unlikeAlbum, updateAlbumPhotoTitle } from '../../utils/api/gallery'

const albumId = ref('')
const photoId = ref('')
const rawAlbums = ref([])
const comments = ref([])

const titleDraft = ref('')
const commentDraft = ref('')
const savingTitle = ref(false)
const titleOverrides = ref({})
const likeOverrides = ref({})
const liking = ref(false)
const currentDeviceName = ref('')

onLoad((options) => {
  albumId.value = options && options.albumId ? String(options.albumId) : ''
  photoId.value = options && options.photoId ? String(options.photoId) : ''
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

const photo = computed(() => {
  const album = rawAlbums.value.find((it) => it.albumId === albumId.value)
  const list = album && Array.isArray(album.photos) ? album.photos : []
  const found = list.find((p) => p.id === photoId.value) || null
  if (!found) return null
  const override = titleOverrides.value && titleOverrides.value[photoId.value] ? String(titleOverrides.value[photoId.value]) : ''
  if (!override) return found
  return { ...found, title: override }
})

const currentAlbum = computed(() => rawAlbums.value.find((it) => it.albumId === albumId.value) || null)

const isLiked = computed(() => {
  const override = likeOverrides.value && likeOverrides.value[albumId.value] !== undefined ? likeOverrides.value[albumId.value] : undefined
  if (override !== undefined) return !!override
  const v = currentAlbum.value && currentAlbum.value.isLike !== undefined ? Number(currentAlbum.value.isLike) : 0
  return v === 1
})

const deviceName = computed(() => {
  if (String(currentDeviceName.value || '').trim()) return String(currentDeviceName.value).trim()
  const storedName = String(uni.getStorageSync('active_device_name_v1') || '').trim()
  if (storedName) return storedName
  const active = String(uni.getStorageSync('active_device_email_v1') || '').trim()
  const raw = uni.getStorageSync('calendar_detail_ctx_v1')
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (parsed && parsed.email && String(parsed.email).trim() === active) return String(parsed.name || active)
  } catch (e) {}
  return uni.$t('当前设备')
})

const uploadTime = computed(() => {
  if (!photo.value) return ''
  return String(photo.value.uploadTime || photo.value.createdAt || '').trim() || '--'
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

async function refresh() {
  try {
    const active = String(uni.getStorageSync('active_device_email_v1') || '').trim()
    currentDeviceName.value = ''
    if (active) {
      try {
        const devices = await getCalendarDeviceList()
        const current = Array.isArray(devices) ? devices.find((it) => String(it.deviceEmail || '').trim() === active) : null
        if (current && current.deviceName) currentDeviceName.value = String(current.deviceName)
      } catch (e) {}
    }
    rawAlbums.value = active ? await getAlbumList({ deviceEmail: active }) : []
    comments.value = albumId.value ? await getAlbumCommentList({ albumId: albumId.value }) : []
    titleDraft.value = photo.value ? photo.value.title || photo.value.name || '' : ''
  } catch (e) {
    rawAlbums.value = []
    comments.value = []
    uni.showToast({ title: String((e && e.message) || uni.$t('获取相片失败')), icon: 'none' })
  }
}

function noopAction() {
  uni.showToast({ title: uni.$t('当前接口暂不支持'), icon: 'none' })
}

async function toggleLike() {
  if (!albumId.value || liking.value) return
  liking.value = true
  const next = !isLiked.value
  likeOverrides.value = { ...(likeOverrides.value || {}), [albumId.value]: next }
  try {
    if (next) await likeAlbum({ albumId: albumId.value })
    else await unlikeAlbum({ albumId: albumId.value })
    await refresh()
  } catch (e) {
    likeOverrides.value = { ...(likeOverrides.value || {}), [albumId.value]: !next }
    uni.showToast({ title: String((e && e.message) || uni.$t('点赞失败')), icon: 'none' })
  } finally {
    liking.value = false
  }
}

function formatRelativeTime(input) {
  const raw = String(input || '').trim()
  if (!raw) return ''
  const normalized = raw.replace(/\./g, '/').replace('T', ' ')
  const ts = new Date(normalized).getTime()
  if (!Number.isFinite(ts)) return raw
  const diff = Date.now() - ts
  if (diff <= 0) return uni.$t('刚刚')
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  if (diff < hour) return `${Math.max(1, Math.floor(diff / minute))}${uni.$t('分钟前')}`
  if (diff < day) return `${Math.max(1, Math.floor(diff / hour))}${uni.$t('小时前')}`
  if (diff < 7 * day) return `${Math.max(1, Math.floor(diff / day))}${uni.$t('天前')}`
  return raw
}

async function saveTitle() {
  if (!photo.value || savingTitle.value) return
  const nextTitle = String(titleDraft.value || '').trim()
  const currentTitle = String(photo.value.title || '').trim()
  if (nextTitle === currentTitle) return
  savingTitle.value = true
  try {
    await updateAlbumPhotoTitle({
      photoId: photoId.value,
      photoTitle: nextTitle,
    })
    titleOverrides.value = { ...(titleOverrides.value || {}), [photoId.value]: nextTitle }
    titleDraft.value = nextTitle
    await refresh()
    uni.showToast({ title: uni.$t('标题已更新'), icon: 'none' })
  } catch (e) {
    titleDraft.value = currentTitle
    uni.showToast({ title: String((e && e.message) || uni.$t('更新标题失败')), icon: 'none' })
  } finally {
    savingTitle.value = false
  }
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

async function send() {
  const text = commentDraft.value.trim()
  if (!text || !photo.value) return
  try {
    await addAlbumComment({ albumId: albumId.value, comment: text })
    commentDraft.value = ''
    comments.value = await getAlbumCommentList({ albumId: albumId.value })
  } catch (e) {
    uni.showToast({ title: String((e && e.message) || uni.$t('发表评论失败')), icon: 'none' })
  }
}

function confirmDelete() {
  if (!photo.value) return
  uni.showModal({
    title: uni.$t('删除'),
    content: uni.$t('确认删除该照片？'),
    cancelText: uni.$t('取消'),
    confirmText: uni.$t('确定'),
    success: async (res) => {
      if (!res.confirm) return
      try {
        uni.showLoading({ title: uni.$t('删除中') })
        await deleteAlbumPhoto({ photoId: photoId.value })
        uni.navigateBack()
      } catch (e) {
        uni.showToast({ title: String((e && e.message) || uni.$t('删除照片失败')), icon: 'none' })
      } finally {
        try {
          uni.hideLoading()
        } catch (e) {}
      }
    },
  })
}
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: #f5f6fb;
  padding-bottom: calc(156rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(156rpx + env(safe-area-inset-bottom));
}

.head {
  position: sticky;
  top: 0;
  z-index: 999;
  background: #f5f6fb;
  padding: 18rpx 24rpx 16rpx;
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
  color: #111111;
}

.head-right {
  width: 120rpx;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 12rpx;
  cursor: pointer;
}

.danger-text {
  font-size: 28rpx;
  font-weight: 700;
  color: rgba(17, 17, 17, 0.34);
}

.body {
  padding: 0 22rpx;
}

.hero {
  border-radius: 24rpx;
  overflow: hidden;
  background: #ffffff;
  box-shadow: 0 6rpx 20rpx rgba(17, 17, 17, 0.03);
}

.hero-img {
  width: 100%;
  height: 700rpx;
  display: block;
}

.hero-video {
  width: 100%;
  height: 700rpx;
}

.ops {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18rpx 4rpx 10rpx;
}

.ops-left,
.ops-right {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.op {
  width: 64rpx;
  height: 64rpx;
  border-radius: 9999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
}

.op-icon {
  width: 38rpx;
  height: 38rpx;
  opacity: 0.82;
}

.title-wrap {
  height: 90rpx;
  border-radius: 18rpx;
  background: #ffffff;
  border: 2rpx solid #edf0f6;
  padding: 0 20rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.pencil {
  width: 34rpx;
  height: 34rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pencil-icon {
  width: 26rpx;
  height: 26rpx;
  opacity: 0.66;
}

.title-input {
  flex: 1;
  font-size: 28rpx;
  font-weight: 700;
  color: rgba(17, 17, 17, 0.85);
  background: transparent;
}

.ph {
  color: #a3abbd;
  font-weight: 600;
}

.info {
  margin-top: 16rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4rpx;
  color: #6e7483;
}

.info-left,
.info-right {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.mini-icon {
  width: 28rpx;
  height: 28rpx;
  opacity: 0.8;
}

.info-text {
  font-size: 24rpx;
  font-weight: 600;
}

.device-text {
  color: #70778a;
}

.clock-dot {
  width: 22rpx;
  height: 22rpx;
  border-radius: 9999rpx;
  border: 3rpx solid #b7bcc9;
  position: relative;
  box-sizing: border-box;
}

.clock-dot::before {
  content: '';
  position: absolute;
  left: 8rpx;
  top: 2rpx;
  width: 2rpx;
  height: 7rpx;
  background: #b7bcc9;
  border-radius: 2rpx;
}

.clock-dot::after {
  content: '';
  position: absolute;
  left: 8rpx;
  top: 8rpx;
  width: 6rpx;
  height: 2rpx;
  background: #b7bcc9;
  border-radius: 2rpx;
}

.comments {
  margin-top: 18rpx;
  min-height: 240rpx;
  border-radius: 24rpx;
  background: #ffffff;
  padding: 20rpx 22rpx 18rpx;
}

.c-title {
  display: block;
  font-size: 28rpx;
  font-weight: 900;
  margin-bottom: 12rpx;
}

.c-item {
  padding: 8rpx 0 14rpx;
}

.c-line {
  display: flex;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 8rpx;
}

.c-user {
  font-size: 26rpx;
  font-weight: 900;
  color: #3d6afb;
}

.c-body {
  font-size: 26rpx;
  font-weight: 700;
  color: rgba(17, 17, 17, 0.85);
}

.c-time {
  display: block;
  margin-top: 6rpx;
  font-size: 22rpx;
  font-weight: 600;
  color: #9aa1b1;
}

.c-empty {
  display: block;
  margin-top: 18rpx;
  font-size: 24rpx;
  color: #9aa1b1;
}

.composer {
  position: fixed;
  left: 22rpx;
  right: 22rpx;
  bottom: calc(18rpx + constant(safe-area-inset-bottom));
  bottom: calc(18rpx + env(safe-area-inset-bottom));
  display: flex;
  align-items: center;
  gap: 14rpx;
  padding: 0;
}

.composer-input {
  flex: 1;
  height: 82rpx;
  border-radius: 18rpx;
  background: #eef1ff;
  padding: 0 22rpx;
  font-size: 28rpx;
  font-weight: 700;
  color: #111111;
}

.send {
  width: 82rpx;
  height: 82rpx;
  border-radius: 18rpx;
  background: #4a6fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10rpx 20rpx rgba(74, 111, 255, 0.24);
}

.send.disabled {
  opacity: 0.45;
}

.send-icon {
  width: 48rpx;
  height: 48rpx;
}
</style>
