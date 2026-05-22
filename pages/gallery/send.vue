<template>
  <view class="page">
    <view class="head" :style="{ paddingTop: safeTop + 'px' }">
      <view class="head-left" @click="back">
        <text class="back">‹</text>
      </view>
      <text class="head-title">上传</text>
      <view class="head-right">
        <text class="danger" @click="clearAll">删除</text>
      </view>
    </view>

    <text class="hint">已发送{{ selectedCount }}张照片/视频</text>

    <view class="rows">
      <view v-for="(it, idx) in items" :key="it.uri" class="row">
        <view class="thumb-wrap">
          <image class="thumb" :src="it.uri" mode="aspectFill" />
          <view class="thumb-badge" :class="{ active: !!it.selected }" @click.stop="toggleSelected(idx)">
            <text v-if="it.selected" class="thumb-check">✓</text>
          </view>
        </view>
        <view class="note">
          <textarea
            v-model="it.note"
            class="note-field"
            placeholder="相片的想法或是说明..."
            placeholder-class="ph"
            :maxlength="120"
          />
        </view>
      </view>
    </view>

    <view class="send" :class="{ disabled: selectedCount === 0 }" @click="submit">
      <text class="send-text">发送</text>
    </view>
  </view>
</template>

<script setup>
import { computed, reactive } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { addTransferTasks, ensureGalleryState } from '../../utils/galleryStore'

const payload = reactive({ albumId: '', items: [] })

onLoad((options) => {
  payload.albumId = options && options.albumId ? String(options.albumId) : ''
  const raw = uni.getStorageSync('gallery_pending_upload')
  if (!raw) return
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (parsed && parsed.albumId) payload.albumId = String(parsed.albumId)
    payload.items = Array.isArray(parsed.items)
      ? parsed.items.map((x) => ({ ...x, selected: x && typeof x.selected === 'boolean' ? x.selected : true }))
      : []
  } catch (e) {
    payload.items = []
  }
})

const items = computed(() => payload.items)
const selectedCount = computed(() => (payload.items || []).filter((x) => x && x.selected).length)

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

function clearAll() {
  if (!items.value.length) {
    uni.navigateBack()
    return
  }
  uni.showModal({
    title: '',
    content: '删除已选择的内容？',
    cancelText: '取消',
    confirmText: '确定',
    success: (res) => {
      if (!res.confirm) return
      payload.items = []
      uni.removeStorageSync('gallery_pending_upload')
      uni.navigateBack()
    },
  })
}

function toggleSelected(index) {
  const list = payload.items || []
  const it = list[index]
  if (!it) return
  it.selected = !it.selected
}

function submit() {
  const selected = (items.value || []).filter((x) => x && x.selected)
  if (!selected.length || !payload.albumId) return
  const s = ensureGalleryState()
  const deviceId = s.activeDeviceId
  addTransferTasks(s, { deviceId, albumId: payload.albumId, items: selected })
  uni.removeStorageSync('gallery_pending_upload')
  uni.navigateTo({ url: `/pages/gallery/transfers?albumId=${encodeURIComponent(payload.albumId)}&autoBack=1` })
}
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: #ffffff;
  padding: 0 28rpx calc(160rpx + constant(safe-area-inset-bottom));
  padding: 0 28rpx calc(160rpx + env(safe-area-inset-bottom));
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
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.danger {
  font-size: 28rpx;
  font-weight: 800;
  color: #3d6afb;
}

.hint {
  display: block;
  margin-top: 8rpx;
  font-size: 30rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.85);
}

.rows {
  margin-top: 20rpx;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.row {
  display: flex;
  align-items: stretch;
  gap: 18rpx;
}

.thumb-wrap {
  width: 180rpx;
  height: 180rpx;
  border-radius: 22rpx;
  overflow: hidden;
  position: relative;
  background: rgba(17, 17, 17, 0.06);
}

.thumb {
  width: 100%;
  height: 100%;
}

.thumb-badge {
  position: absolute;
  top: 10rpx;
  right: 10rpx;
  width: 36rpx;
  height: 36rpx;
  border-radius: 9999rpx;
  background: rgba(255, 255, 255, 0.95);
  border: 2rpx solid rgba(17, 17, 17, 0.14);
  display: flex;
  align-items: center;
  justify-content: center;
}

.thumb-badge.active {
  background: #3d6afb;
  border-color: #3d6afb;
}

.thumb-check {
  color: #ffffff;
  font-size: 22rpx;
  font-weight: 900;
  line-height: 1;
}

.note {
  flex: 1;
  height: 180rpx;
  border-radius: 22rpx;
  background: rgba(17, 17, 17, 0.03);
  border: 2rpx solid rgba(17, 17, 17, 0.06);
  padding: 16rpx 18rpx;
}

.note-field {
  width: 100%;
  height: 100%;
  font-size: 28rpx;
  font-weight: 700;
  color: rgba(17, 17, 17, 0.85);
  line-height: 38rpx;
}

.ph {
  color: rgba(17, 17, 17, 0.35);
  font-weight: 650;
}

.send {
  position: fixed;
  left: 28rpx;
  right: 28rpx;
  bottom: calc(24rpx + constant(safe-area-inset-bottom));
  bottom: calc(24rpx + env(safe-area-inset-bottom));
  height: 104rpx;
  border-radius: 9999rpx;
  background: #3d6afb;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.send.disabled {
  background: rgba(17, 17, 17, 0.18);
}

.send-text {
  color: #ffffff;
  font-size: 34rpx;
  font-weight: 900;
}

.send.disabled .send-text {
  color: rgba(17, 17, 17, 0.55);
}
</style>
