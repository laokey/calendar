<template>
  <view class="bl-page">
    <BlHeader :title="$t('同步新日历')" back back-icon-src="/static/sync/icon_nav_back_small.png">
      <template #right>
        <text class="skip" @click="skip">{{ $t('跳过') }}</text>
      </template>
    </BlHeader>

    <text class="hint bl-muted">{{ $t('请选择要同步的日历类型:') }}</text>

    <view class="list">
      <view v-for="item in items" :key="item.key" class="row" @click="open(item)">
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

    <view v-if="reminderOpen" class="mask" @click="reminderOpen = false">
      <view class="dialog" @click.stop>
        <text class="dialog-title">{{ $t('提示') }}</text>
        <text class="dialog-desc">{{ $t('同步刷新需要大约15分钟') }}</text>
        <view class="dialog-check" @click="dontRemind = !dontRemind">
          <view class="dot" :class="{ on: dontRemind }"><view v-if="dontRemind" class="dot-in" /></view>
          <text class="dialog-check-text">{{ $t('不再提示') }}</text>
        </view>
        <view class="dialog-ok" @click="confirmReminder"><text class="dialog-ok-text">{{ $t('确定') }}</text></view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import BlHeader from '../../components/BlHeader.vue'
import { ensureSyncState, setReminder15minHidden } from '../../utils/syncStore'

const items = ref([
  { key: 'google', title: 'Google', iconSrc: '/static/sync/logo_google_calendar.png' },
  { key: 'outlook', title: 'Outlook', iconSrc: '/static/sync/logo_outlook.png' },
  { key: 'icloud', title: 'iCloud', iconSrc: '/static/sync/logo_icloud_calendar.png', sub: uni.$t('同步刷新需要大约15分钟') },
  { key: 'cozi', title: 'Cozi', iconSrc: '/static/sync/logo_cozi.png', sub: uni.$t('同步刷新需要大约15分钟') },
  { key: 'teamsnap', title: 'TeamSnap', iconSrc: '/static/sync/logo_teamsnap.png' },
  { key: 'calendar-url', title: uni.$t('日历链接'), iconSrc: '/static/sync/icon_calendar_url.png' },
  { key: 'subscribed', title: uni.$t('同步已订阅日历'), iconSrc: '/static/sync/icon_subscribed_calendar.png', sub: uni.$t('同步刷新需要大约15分钟') },
])

const syncState = ref(ensureSyncState())
const reminderOpen = ref(false)
const dontRemind = ref(false)
const pendingKey = ref('')

function needReminder(key) {
  return key === 'icloud' || key === 'cozi' || key === 'subscribed'
}

function open(item) {
  const key = item && item.key ? String(item.key) : ''
  if (!key) return
  syncState.value = ensureSyncState()
  if (needReminder(key) && !syncState.value.reminder15minHidden) {
    pendingKey.value = key
    dontRemind.value = false
    reminderOpen.value = true
    return
  }
  goNext(key)
}

function skip() {
  uni.navigateBack()
}

function confirmReminder() {
  if (dontRemind.value) {
    setReminder15minHidden(syncState.value, true)
    syncState.value = ensureSyncState()
  }
  reminderOpen.value = false
  const key = pendingKey.value
  pendingKey.value = ''
  goNext(key)
}

function goNext(key) {
  if (key === 'google') {
    uni.navigateTo({ url: '/pages/sync/sync-provider?provider=google' })
    return
  }
  if (key === 'outlook') {
    uni.navigateTo({ url: '/pages/sync/sync-provider?provider=outlook' })
    return
  }
  if (key === 'calendar-url') {
    uni.navigateTo({ url: '/pages/sync/sync-url' })
    return
  }
  if (key === 'teamsnap') {
    uni.navigateTo({ url: '/pages/sync/sync-guide?type=teamsnap' })
    return
  }
  if (key === 'icloud') {
    uni.navigateTo({ url: '/pages/sync/sync-guide?type=icloud' })
    return
  }
  if (key === 'cozi') {
    uni.navigateTo({ url: '/pages/sync/sync-guide?type=cozi' })
    return
  }
  if (key === 'subscribed') {
    uni.navigateTo({ url: '/pages/sync/sync-guide?type=subscribed' })
    return
  }
  uni.showToast({ title: key, icon: 'none' })
}
</script>

<style scoped lang="scss">
.bl-page {
  background: #fff;
}
.skip {
  font-size: 28rpx;
  font-weight: 800;
  color: #3d6afb;
}

.hint {
  display: block;
  padding: 10rpx 0 18rpx;
  font-size: 28rpx;
  font-weight: 700;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 22rpx;
}

.row {
  display: flex;
  align-items: center;
  gap: 18rpx;
  padding: 22rpx 22rpx;
  background: rgba(17, 17, 17, 0.04);
  border-radius: 22rpx;
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

.mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.dialog {
  width: 640rpx;
  border-radius: 28rpx;
  background: #ffffff;
  padding: 36rpx 28rpx 26rpx;
}

.dialog-title {
  display: block;
  font-size: 34rpx;
  font-weight: 900;
  text-align: center;
  margin-bottom: 18rpx;
}

.dialog-desc {
  display: block;
  font-size: 28rpx;
  font-weight: 800;
  text-align: center;
  color: rgba(17, 17, 17, 0.78);
}

.dialog-check {
  margin-top: 22rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
}

.dot {
  width: 34rpx;
  height: 34rpx;
  border-radius: 999rpx;
  background: rgba(17, 17, 17, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
}

.dot.on {
  background: rgba(17, 17, 17, 0.18);
}

.dot-in {
  width: 14rpx;
  height: 14rpx;
  border-radius: 999rpx;
  background: rgba(17, 17, 17, 0.5);
}

.dialog-check-text {
  font-size: 28rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.75);
}

.dialog-ok {
  margin-top: 26rpx;
  height: 96rpx;
  border-radius: 9999rpx;
  background: #3d6afb;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dialog-ok-text {
  font-size: 34rpx;
  font-weight: 900;
  color: #ffffff;
}
</style>
