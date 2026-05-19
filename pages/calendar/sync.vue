<template>
  <view class="bl-page">
    <BlHeader title="同步新日历" back back-icon-src="/static/sync/icon_nav_back_small.png">
      <template #right>
        <text class="skip" @click="skip">跳过</text>
      </template>
    </BlHeader>

    <text class="hint bl-muted">请选择要同步的日历类型:</text>

    <view class="list">
      <view v-for="item in items" :key="item.title" class="row bl-card" @click="open(item.title)">
        <view class="icon-box">
          <image class="icon-img" :src="item.iconSrc" mode="aspectFit" />
        </view>
        <view class="meta">
          <text class="title">{{ item.title }}</text>
          <text v-if="item.sub" class="sub bl-muted">{{ item.sub }}</text>
        </view>
        <image class="chev-img" src="/static/sync/icon_chevron_right.png" mode="aspectFit" />
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import BlHeader from '../../components/BlHeader.vue'

const items = ref([
  { title: 'Google', iconSrc: '/static/sync/logo_google_calendar.png' },
  { title: 'Outlook', iconSrc: '/static/sync/logo_outlook.png' },
  { title: 'iCloud', iconSrc: '/static/sync/logo_icloud_calendar.png', sub: '同步刷新需要大约15分钟' },
  { title: 'Cozi', iconSrc: '/static/sync/logo_cozi.png', sub: '同步刷新需要大约15分钟' },
  { title: 'TeamSnap', iconSrc: '/static/sync/logo_teamsnap.png' },
  { title: 'Calendar URL', iconSrc: '/static/sync/icon_calendar_url.png' },
  { title: 'Subscribed Calendar', iconSrc: '/static/sync/icon_subscribed_calendar.png', sub: '同步刷新需要大约15分钟' },
])

function open(name) {
  uni.showToast({ title: name, icon: 'none' })
}

function skip() {
  uni.navigateBack()
}
</script>

<style scoped lang="scss">
.skip {
  font-size: 28rpx;
  font-weight: 800;
  color: #3d6afb;
}

.hint {
  display: block;
  padding: 10rpx 8rpx 18rpx;
  font-size: 26rpx;
  font-weight: 600;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.row {
  display: flex;
  align-items: center;
  gap: 18rpx;
  padding: 20rpx 22rpx;
}

.icon-box {
  width: 62rpx;
  height: 62rpx;
  border-radius: 18rpx;
  background: #f2f2f2;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.icon-img {
  width: 44rpx;
  height: 44rpx;
  display: block;
}

.meta {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.title {
  font-size: 30rpx;
  font-weight: 900;
}

.sub {
  font-size: 22rpx;
  font-weight: 600;
}

.chev-img {
  width: 44rpx;
  height: 44rpx;
  display: block;
}
</style>
