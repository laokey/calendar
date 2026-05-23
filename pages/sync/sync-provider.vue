<template>
  <view class="bl-page page">
    <BlHeader :title="headerTitle" back back-icon-src="/static/sync/icon_nav_back_small.png" />

    <view class="card-list">
      <view class="opt" :class="{ on: mode === 'twoWay' }" @click="mode = 'twoWay'">
        <view class="opt-meta">
          <text class="opt-title">双向同步</text>
          <text class="opt-desc bl-muted">{{ twoWayDesc }}</text>
        </view>
        <image v-if="mode === 'twoWay'" class="opt-check" src="/static/sync/icon_radio_on_check_blue.png" mode="aspectFit" />
        <view v-else class="opt-off" />
      </view>

      <view class="opt" :class="{ on: mode === 'oneWay' }" @click="mode = 'oneWay'">
        <view class="opt-meta">
          <text class="opt-title">单向同步</text>
          <text class="opt-desc bl-muted">{{ oneWayDesc }}</text>
        </view>
        <image v-if="mode === 'oneWay'" class="opt-check" src="/static/sync/icon_radio_on_check_blue.png" mode="aspectFit" />
        <view v-else class="opt-off" />
      </view>
    </view>

    <view class="bottom-action">
      <view class="bl-btn-primary" @click="next"><text>同步新日历</text></view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import BlHeader from '../../components/BlHeader.vue'
import { addAccountSync, ensureSyncState, saveSyncState } from '../../utils/syncStore'

const provider = ref('google')
const mode = ref('twoWay')

onLoad((options) => {
  const p = String(options && options.provider ? options.provider : 'google')
  provider.value = p === 'outlook' ? 'outlook' : 'google'
})

const headerTitle = computed(() => (provider.value === 'outlook' ? '同步微软账号' : '同步Google账号'))

const twoWayDesc = computed(() => {
  if (provider.value === 'outlook') return '在芝麻日历上的更改将会同步发送Outlook日历'
  return '电子日历上的更改将发回Google日历'
})

const oneWayDesc = computed(() => {
  if (provider.value === 'outlook') return '在芝麻日历上的更改将不会同步Outlook日历'
  return '在芝麻日历上的更改不会发送回GoogleCalendar'
})

function upsertAccount() {
  const state = ensureSyncState()
  const email = provider.value === 'outlook' ? 'outlook_user@outlook.com' : '34tyf6756@gmail.com'
  const hit = (state.synced || []).find((x) => x && x.type === 'account' && x.provider === provider.value && x.email === email)
  if (hit) {
    hit.syncMode = mode.value
    state.activeId = hit.id
    saveSyncState(state)
    return hit.id
  }
  const item = addAccountSync(state, provider.value, { email, name: email, syncMode: mode.value })
  return item ? item.id : ''
}

function next() {
  const accountId = upsertAccount()
  uni.navigateTo({ url: `/pages/sync/sync-calendars?provider=${provider.value}&accountId=${encodeURIComponent(accountId)}` })
}
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: #ffffff;
  padding-bottom: 200rpx;
}

.card-list {
  margin-top: 12rpx;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.opt {
  background: rgba(17, 17, 17, 0.04);
  border-radius: 22rpx;
  padding: 26rpx 22rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 2rpx solid transparent;
}

.opt.on {
  background: rgba(61, 106, 251, 0.12);
  border-color: #3d6afb;
}

.opt-meta {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  flex: 1;
  min-width: 0;
}

.opt-title {
  font-size: 34rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.92);
}

.opt-desc {
  font-size: 26rpx;
  font-weight: 700;
  line-height: 36rpx;
}

.opt-check {
  width: 52rpx;
  height: 52rpx;
  display: block;
  flex-shrink: 0;
  margin-left: 18rpx;
}

.opt-off {
  width: 52rpx;
  height: 52rpx;
  border-radius: 999rpx;
  background: rgba(17, 17, 17, 0.12);
  flex-shrink: 0;
  margin-left: 18rpx;
}

.bottom-action {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 20rpx 28rpx calc(20rpx + env(safe-area-inset-bottom));
  background: #ffffff;
}
</style>
