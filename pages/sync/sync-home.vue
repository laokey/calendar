<template>
  <view class="bl-page page">
    <BlHeader title="同步日历" back back-icon-src="/static/sync/icon_nav_back_small.png" />

    <view v-if="syncedList.length" class="section">
      <text class="section-title">已同步列表</text>
      <view class="card-list">
        <view v-for="item in syncedList" :key="item.id" class="card" @click="openEdit(item.id)">
          <image class="card-icon" :src="providerIcon(item.provider)" mode="aspectFit" />
          <view class="card-meta">
            <text class="card-name">{{ item.name || item.email }}</text>
            <text class="card-sub bl-muted">{{ item.email }}</text>
          </view>
          <view class="card-right" @click.stop="setActive(item.id)">
            <image v-if="item.id === activeId" class="check-img" src="/static/sync/icon_radio_on_check_blue.png" mode="aspectFit" />
            <view v-else class="check-off" />
          </view>
        </view>
      </view>
    </view>

    <view class="section">
      <text class="section-title">手机上的日历</text>

      <view v-if="!calendarPerm" class="perm-card">
        <text class="perm-title">点击启用本地日历访问</text>
        <view class="perm-row">
          <text class="perm-label">启用本地日历权限</text>
          <switch :checked="calendarPerm" color="#3d6afb" @change="onPermToggle" />
        </view>
      </view>

      <view v-else class="card-list">
        <view v-for="c in localList" :key="c.id" class="lcard">
          <view class="date-icon">
            <view class="date-top"><text class="date-month">{{ c.month }}</text></view>
            <view class="date-main"><text class="date-day">{{ c.day }}</text></view>
          </view>
          <view class="lmeta">
            <text class="lname">{{ c.title }}</text>
            <text class="lsub bl-muted">{{ c.source }}</text>
            <text class="lsub bl-muted">{{ c.monthCount }} 本月事件</text>
          </view>
          <view class="lright">
            <view class="pill" :class="{ disabled: c.synced }" @click="syncLocal(c)">
              <text class="pill-text">{{ c.synced ? '已同步' : '同步' }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <view class="bottom-action">
      <view class="bl-btn-primary" @click="goNew"><text>同步新日历</text></view>
    </view>

    <view v-if="permDialogOpen" class="mask" @click="closePermDialog">
      <view class="dialog" @click.stop>
        <text class="dialog-text">需要日历权限以便查看系统本地日历的日历事件。</text>
        <view class="dialog-actions">
          <view class="btn btn-cancel" @click="denyPerm"><text class="btn-text">取消</text></view>
          <view class="btn btn-ok" @click="grantPerm"><text class="btn-text ok-text">继续</text></view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import BlHeader from '../../components/BlHeader.vue'
import { ensureMeState, updateSettings } from '../../utils/meStore'
import { ensureSyncState, listLocalCalendars, listSynced, markLocalSynced, setActiveSynced } from '../../utils/syncStore'

const meState = ref(ensureMeState())
const syncState = ref(ensureSyncState())

const permDialogOpen = ref(false)
const pendingPermValue = ref(false)

onShow(() => {
  meState.value = ensureMeState()
  syncState.value = ensureSyncState()
})

const calendarPerm = computed(() => {
  const p = meState.value && meState.value.settings && meState.value.settings.permissions ? meState.value.settings.permissions : {}
  return !!p.calendar
})

const syncedList = computed(() => listSynced(syncState.value))
const localList = computed(() => listLocalCalendars(syncState.value))
const activeId = computed(() => String(syncState.value && syncState.value.activeId ? syncState.value.activeId : ''))

function providerIcon(provider) {
  if (provider === 'outlook') return '/static/sync/logo_outlook.png'
  if (provider === 'url') return '/static/sync/icon_calendar_url.png'
  return '/static/sync/logo_google_calendar.png'
}

function goNew() {
  uni.navigateTo({ url: '/pages/sync/sync' })
}

function openEdit(id) {
  uni.navigateTo({ url: `/pages/sync/sync-edit?id=${encodeURIComponent(id)}` })
}

function setActive(id) {
  syncState.value = setActiveSynced(syncState.value, id)
}

function onPermToggle(e) {
  const next = !!(e && e.detail ? e.detail.value : false)
  if (!next) {
    const s = ensureMeState()
    updateSettings(s, { permissions: { ...(s.settings?.permissions || {}), calendar: false } })
    meState.value = ensureMeState()
    return
  }
  pendingPermValue.value = true
  permDialogOpen.value = true
}

function closePermDialog() {
  permDialogOpen.value = false
  pendingPermValue.value = false
}

function denyPerm() {
  closePermDialog()
}

function grantPerm() {
  const s = ensureMeState()
  updateSettings(s, { permissions: { ...(s.settings?.permissions || {}), calendar: true } })
  meState.value = ensureMeState()
  closePermDialog()
}

function syncLocal(c) {
  if (!c || c.synced) return
  markLocalSynced(syncState.value, c.id, true)
  syncState.value = ensureSyncState()
  uni.navigateTo({ url: `/pages/sync/sync-status?mode=progress&from=local&count=101` })
}
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: #ffffff;
  padding-bottom: 200rpx;
}

.section {
  margin-top: 10rpx;
}

.section-title {
  display: block;
  font-size: 34rpx;
  font-weight: 900;
  margin: 24rpx 0 16rpx;
}

.card-list {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.card {
  background: #ffffff;
  border-radius: 22rpx;
  padding: 18rpx 18rpx;
  display: flex;
  align-items: center;
  box-shadow: 0 10rpx 26rpx rgba(17, 17, 17, 0.06);
}

.card-icon {
  width: 62rpx;
  height: 62rpx;
  flex-shrink: 0;
}

.card-meta {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  padding: 0 14rpx;
  min-width: 0;
}

.card-name {
  font-size: 30rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.92);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-sub {
  font-size: 24rpx;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-right {
  width: 72rpx;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.check-img {
  width: 48rpx;
  height: 48rpx;
  display: block;
}

.check-off {
  width: 48rpx;
  height: 48rpx;
  border-radius: 999rpx;
  background: rgba(17, 17, 17, 0.08);
}

.perm-card {
  background: #ffffff;
  border-radius: 22rpx;
  padding: 22rpx;
  box-shadow: 0 10rpx 26rpx rgba(17, 17, 17, 0.06);
}

.perm-title {
  display: block;
  font-size: 30rpx;
  font-weight: 900;
  margin-bottom: 14rpx;
}

.perm-row {
  background: rgba(17, 17, 17, 0.04);
  border-radius: 16rpx;
  padding: 18rpx 18rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.perm-label {
  font-size: 28rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.8);
}

.lcard {
  background: #ffffff;
  border-radius: 22rpx;
  padding: 18rpx 18rpx;
  display: flex;
  align-items: center;
  gap: 18rpx;
  box-shadow: 0 10rpx 26rpx rgba(17, 17, 17, 0.06);
}

.date-icon {
  width: 74rpx;
  height: 74rpx;
  border-radius: 18rpx;
  overflow: hidden;
  background: #ffffff;
  box-shadow: inset 0 0 0 2rpx rgba(17, 17, 17, 0.08);
  flex-shrink: 0;
}

.date-top {
  height: 24rpx;
  background: #ff5a5f;
  display: flex;
  align-items: center;
  justify-content: center;
}

.date-month {
  font-size: 18rpx;
  font-weight: 900;
  color: #ffffff;
  letter-spacing: 1rpx;
}

.date-main {
  flex: 1;
  height: 50rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.date-day {
  font-size: 32rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.92);
}

.lmeta {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  min-width: 0;
}

.lname {
  font-size: 30rpx;
  font-weight: 900;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lsub {
  font-size: 22rpx;
  font-weight: 700;
}

.lright {
  flex-shrink: 0;
}

.pill {
  min-width: 132rpx;
  height: 66rpx;
  border-radius: 9999rpx;
  background: #3d6afb;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pill.disabled {
  background: rgba(17, 17, 17, 0.1);
}

.pill-text {
  font-size: 28rpx;
  font-weight: 900;
  color: #ffffff;
}

.bottom-action {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 20rpx 28rpx calc(20rpx + env(safe-area-inset-bottom));
  background: #ffffff;
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
  width: 630rpx;
  border-radius: 28rpx;
  background: #ffffff;
  padding: 36rpx 28rpx 26rpx;
}

.dialog-text {
  display: block;
  font-size: 28rpx;
  font-weight: 800;
  line-height: 42rpx;
  text-align: center;
  color: rgba(17, 17, 17, 0.86);
}

.dialog-actions {
  margin-top: 28rpx;
  display: flex;
  gap: 18rpx;
}

.btn {
  flex: 1;
  height: 88rpx;
  border-radius: 9999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-cancel {
  background: rgba(61, 106, 251, 0.12);
}

.btn-ok {
  background: #3d6afb;
}

.btn-text {
  font-size: 30rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.78);
}

.ok-text {
  color: #ffffff;
}
</style>
