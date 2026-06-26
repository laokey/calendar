<template>
  <view class="page">
    <view class="head" :style="{ paddingTop: safeTop + 'px' }">
      <view class="head-left" @click="back"><image class="back-img" src="/static/my/icon_back.png" mode="aspectFit" /></view>
      <text class="title">卡片记录</text>
      <view class="head-right" />
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
            <view class="a-btn" @click="preview(it)"><image class="a-img" src="/static/task/icon_edit_square.png" mode="aspectFit" /></view>
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

function preview(it) {
  if (!it) return
  const url = String(it.imageUrl || '').trim()
  if (url) {
    uni.previewImage({ urls: [url] })
  }
  const msg = String(it.message || '').trim()
  if (msg) {
    uni.showModal({ title: '祝福语', content: msg, showCancel: false })
  }
}

async function refreshOnline() {
  const logged = !!uni.getStorageSync('auth_logged_in')
  if (!logged) {
    onlineItems.value = []
    return
  }
  try {
    const list = await cardsApi.getGreetingCardList()
    onlineItems.value = (list || []).map((c) => {
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
      }
    })
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
  gap: 24rpx;
}

.a-btn {
  display: flex;
  align-items: center;
  justify-content: center;
}

.a-img {
  width: 40rpx;
  height: 40rpx;
  opacity: 0.8;
}

.a-btn.danger .a-img {
  opacity: 1;
}

</style>
