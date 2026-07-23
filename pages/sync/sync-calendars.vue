<template>
  <view class="bl-page page">
    <BlHeader :title="$t('您想同步哪些日历')" back back-icon-src="/static/sync/icon_nav_back_small.png" />

    <view class="list">
      <view class="row" @click="toggleAll">
        <text class="row-title">Select All</text>
        <image v-if="allSelected" class="row-check" src="/static/sync/icon_radio_on_check_blue.png" mode="aspectFit" />
        <view v-else class="row-off" />
      </view>

      <view v-for="c in calendars" :key="c.id" class="row" @click="toggleOne(c.id)">
        <text class="row-title">{{ c.name }}</text>
        <image v-if="c.selected" class="row-check" src="/static/sync/icon_radio_on_check_blue.png" mode="aspectFit" />
        <view v-else class="row-off" />
      </view>
    </view>

    <view class="bottom-action">
      <view class="bl-btn-primary" :class="{ 'is-disabled': !canSync }" @click="sync">
        <text>{{ $t('同步日历') }}</text>
      </view>
      <view class="btn-outline" @click="reload"><text class="btn-outline-text">{{ $t('重新加载列表') }}</text></view>
      <text class="hint">{{ $t('没有看到所有的日历吗？') }}</text>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import BlHeader from '../../components/BlHeader.vue'
import { ensureSyncState, getProviderCalendars, setProviderCalendars } from '../../utils/syncStore'

const provider = ref('google')
const accountId = ref('')

const calendars = ref([])

onLoad((options) => {
  provider.value = String(options && options.provider ? options.provider : 'google') === 'outlook' ? 'outlook' : 'google'
  accountId.value = String(options && options.accountId ? options.accountId : '')
  const state = ensureSyncState()
  calendars.value = getProviderCalendars(state, provider.value)
})

const selectedCount = computed(() => calendars.value.filter((x) => x.selected).length)
const allSelected = computed(() => calendars.value.length > 0 && selectedCount.value === calendars.value.length)
const canSync = computed(() => selectedCount.value > 0)

function toggleAll() {
  const next = !allSelected.value
  calendars.value = calendars.value.map((x) => ({ ...x, selected: next }))
  persist()
}

function toggleOne(id) {
  calendars.value = calendars.value.map((x) => (x.id === id ? { ...x, selected: !x.selected } : x))
  persist()
}

function persist() {
  const state = ensureSyncState()
  setProviderCalendars(state, provider.value, calendars.value)
}

function reload() {
  uni.showToast({ title: uni.$t('加载中'), icon: 'none' })
  setTimeout(() => {
    const state = ensureSyncState()
    calendars.value = getProviderCalendars(state, provider.value)
    uni.showToast({ title: uni.$t('已刷新'), icon: 'none' })
  }, 350)
}

function sync() {
  if (!canSync.value) return
  uni.navigateTo({ url: `/pages/sync/sync-status?mode=progress&from=account&provider=${provider.value}&accountId=${encodeURIComponent(accountId.value)}&count=101` })
}
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: #ffffff;
  padding-bottom: 320rpx;
}

.list {
  margin-top: 10rpx;
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.row {
  background: rgba(17, 17, 17, 0.04);
  border-radius: 22rpx;
  padding: 26rpx 22rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.row-title {
  font-size: 30rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.92);
}

.row-check {
  width: 52rpx;
  height: 52rpx;
  display: block;
}

.row-off {
  width: 52rpx;
  height: 52rpx;
  border-radius: 999rpx;
  background: rgba(17, 17, 17, 0.12);
}

.bottom-action {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 22rpx 28rpx calc(22rpx + env(safe-area-inset-bottom));
  background: #ffffff;
}

.btn-outline {
  margin-top: 18rpx;
  width: 100%;
  height: 96rpx;
  border-radius: 9999rpx;
  border: 2rpx solid #3d6afb;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-outline-text {
  font-size: 34rpx;
  font-weight: 900;
  color: #3d6afb;
}

.hint {
  display: block;
  margin-top: 20rpx;
  text-align: center;
  font-size: 26rpx;
  font-weight: 700;
  color: rgba(17, 17, 17, 0.45);
}
</style>
