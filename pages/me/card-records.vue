<template>
  <view class="page">
    <view class="head" :style="{ paddingTop: safeTop + 'px' }">
      <view class="head-left" @click="back"><image class="back-img" src="/static/my/icon_back.png" mode="aspectFit" /></view>
      <text class="title">卡片记录</text>
      <view class="head-right" @click="clearAll"><text class="clear-text">清除</text></view>
    </view>

    <view v-if="items.length === 0" class="empty">
      <image class="empty-img" src="/static/my/img_empty_cards.png" mode="widthFix" />
      <text class="empty-text">尚无卡片记录</text>
    </view>

    <view v-else class="list">
      <view v-for="it in items" :key="it.id" class="card">
        <view class="top">
          <view class="env"><image class="env-img" src="/static/my/icon_cards.png" mode="aspectFit" /></view>
          <view class="meta">
            <text class="c-title">{{ it.title }}</text>
            <text class="c-sub">设备：{{ it.device }}</text>
            <text class="c-sub">时间：{{ it.timeText }}</text>
          </view>
        </view>

        <view class="bottom">
          <text class="badge" :class="{ unread: it.status === 'unread' }">{{ it.status === 'unread' ? '未读' : '已读' }}</text>
          <view class="actions">
            <view class="a-btn" @click="resend(it)"><image class="a-img" src="/static/my/logo_share.png" mode="aspectFit" /></view>
            <view class="a-btn" @click="preview(it)"><image class="a-img" src="/static/task/icon_edit_square.png" mode="aspectFit" /></view>
            <view class="a-btn danger" @click="remove(it)"><image class="a-img" src="/static/task/icon_trash_red.png" mode="aspectFit" /></view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { cardsApi } from '../../utils/api'
import { saveCardDraft } from '../../utils/cardStore'

const CARD_PREVIEW_STORAGE_KEY = 'card_record_preview_v1'
const CARD_RECORD_HIDDEN_IDS_KEY = 'card_record_hidden_ids_v1'
const onlineItems = ref([])

onShow(() => {
  refreshOnline()
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

const items = computed(() => {
  return onlineItems.value
})

function back() {
  uni.navigateBack()
}

function readHiddenIds() {
  try {
    const raw = uni.getStorageSync(CARD_RECORD_HIDDEN_IDS_KEY)
    const list = Array.isArray(raw) ? raw : typeof raw === 'string' && raw.trim() ? JSON.parse(raw) : []
    return Array.isArray(list) ? list.map((x) => String(x || '').trim()).filter(Boolean) : []
  } catch (e) {
    return []
  }
}

function writeHiddenIds(list) {
  try {
    uni.setStorageSync(CARD_RECORD_HIDDEN_IDS_KEY, Array.isArray(list) ? list : [])
  } catch (e) {}
}

function preview(it) {
  if (!it) return
  try {
    uni.setStorageSync(CARD_PREVIEW_STORAGE_KEY, {
      ...it,
      id: String(it.id || '').trim(),
    })
  } catch (e) {}
  uni.navigateTo({ url: `/pages/me/card-preview?id=${encodeURIComponent(String(it.id || '').trim())}` })
}

function resend(it) {
  if (!it) return
  saveCardDraft({
    photoPath: '',
    imageUrl: String(it.imageUrl || '').trim(),
    resourceType: 1,
    templateKey: 'birthday_1',
    doodle: it && it.doodle && typeof it.doodle === 'object'
      ? it.doodle
      : {
          strokes: [],
          stickers: [],
          texts: [],
          brushColor: '#111111',
          textColor: '#111111',
          canvasWidthPx: 0,
          canvasHeightPx: 0,
        },
    message: String(it.message || '').trim(),
    playMode: Number(it.playMode) === 1 ? 'manual' : 'auto',
    scheduleEnabled: false,
    scheduleDate: '',
    scheduleTime: '',
  })
  uni.navigateTo({ url: '/pages/cards/share' })
}

function remove(it) {
  const id = it && it.id ? String(it.id).trim() : ''
  if (!id) return
  uni.showModal({
    title: '',
    content: '删除该记录？',
    cancelText: '取消',
    confirmText: '确定',
    success: (res) => {
      if (!res.confirm) return
      const hidden = readHiddenIds()
      if (!hidden.includes(id)) hidden.push(id)
      writeHiddenIds(hidden)
      onlineItems.value = onlineItems.value.filter((x) => String(x && x.id ? x.id : '') !== id)
      uni.showToast({ title: '删除成功', icon: 'none' })
    },
  })
}

function clearAll() {
  if (!onlineItems.value.length) return
  uni.showModal({
    title: '',
    content: '清除全部卡片记录？',
    cancelText: '取消',
    confirmText: '确定',
    success: (res) => {
      if (!res.confirm) return
      const hidden = new Set(readHiddenIds())
      onlineItems.value.forEach((item) => {
        const id = String(item && item.id ? item.id : '').trim()
        if (id) hidden.add(id)
      })
      writeHiddenIds(Array.from(hidden))
      onlineItems.value = []
      uni.showToast({ title: '已清除', icon: 'none' })
    },
  })
}

async function refreshOnline() {
  const logged = !!uni.getStorageSync('auth_logged_in')
  if (!logged) {
    onlineItems.value = []
    return
  }
  try {
    const hiddenIds = new Set(readHiddenIds())
    const list = await cardsApi.getGreetingCardList()
    onlineItems.value = (list || [])
      .map((c) => {
        const isTimer = Number(c && c.isTimer) === 1
        const timeText = isTimer ? `${c.timedDate || ''} ${c.timedTime || ''}`.trim() : ''
        return {
          id: String(c.cardId || ''),
          title: '贺卡',
          device: String(c.deviceEmail || ''),
          timeText,
          status: 'read',
          message: String(c.greetings || ''),
          imageUrl: String(c.imageUrl || ''),
          doodle: c && c.doodle ? c.doodle : null,
          hasDoodle: !!(c && c.hasDoodle),
          contentText: String(c && c.contentText ? c.contentText : ''),
          playMode: Number(c.playMode || 0) || 0,
        }
      })
      .filter((item) => item.id && !hiddenIds.has(String(item.id)))
  } catch (e) {
    onlineItems.value = []
  }
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
  background: #ffffff;
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

.back-img {
  width: 44rpx;
  height: 44rpx;
  opacity: 0.9;
}

.title {
  font-size: 34rpx;
  font-weight: 900;
  color: #111111;
}

.head-right {
  width: 120rpx;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.clear-text {
  font-size: 28rpx;
  font-weight: 700;
  color: #3d6afb;
}

.empty {
  padding: 220rpx 0 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.empty-img {
  width: 280rpx;
}

.empty-text {
  margin-top: 18rpx;
  font-size: 26rpx;
  font-weight: 500;
  color: #888888;
}

.list {
  margin-top: 16rpx;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.card {
  border-radius: 24rpx;
  background: #f8f8f8;
  box-shadow: none;
  padding: 32rpx;
}

.top {
  display: flex;
  align-items: flex-start;
  gap: 24rpx;
}

.env {
  width: 120rpx;
  height: 120rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.env-img {
  width: 120rpx;
  height: 120rpx;
}

.meta {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.c-title {
  font-size: 32rpx;
  font-weight: 800;
  color: #111111;
}

.c-sub {
  font-size: 26rpx;
  font-weight: 500;
  color: #888888;
}

.bottom {
  margin-top: 24rpx;
  padding: 8px 18rpx;
  background: #ffffff;
  border-radius: 16rpx;
  border: 2rpx solid rgba(17, 17, 17, 0.05);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.badge {
  font-size: 28rpx;
  font-weight: 500;
  color: #888888;
}

.badge.unread {
  color: #ff3b30;
}

.actions {
  display: flex;
  background: #ffffff;
  align-items: center;
  gap: 16rpx;
}

.a-btn {
  width: 40rpx;
  height: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.a-img {
  width: 30rpx;
  height: 30rpx;
  opacity: 0.8;
}

.a-img.send {
  width: 28rpx;
  height: 28rpx;
}

.a-btn.danger .a-img {
  opacity: 1;
}

</style>
