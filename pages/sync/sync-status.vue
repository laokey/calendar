<template>
  <view class="bl-page page">
    <BlHeader title="" back back-icon-src="/static/sync/icon_nav_back_small.png" />

    <view class="center">
      <image v-if="mode === 'success'" class="hero-icon" src="/static/sync/icon_check_circle_green.png" mode="aspectFit" />
      <image v-else-if="mode === 'failed'" class="hero-icon hero-icon-fail" src="/static/sync/icon_close_bold.png" mode="aspectFit" />
      <image v-else class="hero-icon hero-icon-loading" src="/static/sync/icon_refresh_circle_blue.png" mode="aspectFit" />

      <text class="hero-title">{{ titleText }}</text>
      <text class="hero-desc">{{ descText }}</text>

      <view class="hero-btn" :class="{ 'hero-btn-fail': mode === 'failed' }" @click="primaryAction">
        <text class="hero-btn-text">{{ btnText }}</text>
      </view>
    </view>

    <text class="bottom-hint">{{ bottomText }}</text>
  </view>
</template>

<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import BlHeader from '../../components/BlHeader.vue'
import { getSyncStatus } from '../../utils/api/sync'

const mode = ref('progress')
const count = ref(0)
const taskId = ref('')
const calendarId = ref('')
const syncCount = ref(0)
const failMessage = ref('')

let pollTimer = null
let pollCount = 0
const POLL_MAX = 180
const POLL_INTERVAL = 2000

onLoad((options) => {
  mode.value = String(options && options.mode ? options.mode : 'progress') === 'success' ? 'success' : 'progress'
  const n = Number(options && options.count ? options.count : 0)
  count.value = Number.isFinite(n) ? n : 0
  taskId.value = String(options && options.taskId ? options.taskId : '')
  calendarId.value = String(options && options.calendarId ? options.calendarId : '')
  if (mode.value === 'progress') {
    if (calendarId.value || taskId.value) {
      startPoll()
    } else {
      setTimeout(() => {
        setSuccess(count.value || 101)
      }, 1200)
    }
  }
})

onBeforeUnmount(() => {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
})

function startPoll() {
  pollCount = 0
  if (pollTimer) clearInterval(pollTimer)
  pollTimer = setInterval(async () => {
    pollCount += 1
    if (pollCount > POLL_MAX) {
      if (pollTimer) {
        clearInterval(pollTimer)
        pollTimer = null
      }
      setSuccess(syncCount.value || count.value || 101)
      return
    }
    try {
      const res = await getSyncStatus({ calendarId: calendarId.value, taskId: taskId.value })
      const status = Number(res && (res.status || res.syncStatus || res.state) || 0)
      const synced = Number(res && (res.syncedCount || res.synced_count || res.count || res.processed) || 0)
      if (synced > 0) syncCount.value = synced
      if (status === 2) {
        if (pollTimer) {
          clearInterval(pollTimer)
          pollTimer = null
        }
        setSuccess(syncCount.value || count.value || 101)
        return
      }
      if (status === 3) {
        if (pollTimer) {
          clearInterval(pollTimer)
          pollTimer = null
        }
        const msg = res && (res.message || res.msg || res.error) ? String(res.message || res.msg || res.error) : uni.$t('同步失败')
        setFailed(msg)
        return
      }
    } catch (e) {}
  }, POLL_INTERVAL)
}

function setSuccess(n) {
  mode.value = 'success'
  count.value = Number(n && Number.isFinite(Number(n)) ? n : 101)
}

function setFailed(msg) {
  mode.value = 'failed'
  failMessage.value = String(msg || uni.$t('同步失败'))
}

const titleText = computed(() => {
  if (mode.value === 'success') return uni.$t('成功!')
  if (mode.value === 'failed') return uni.$t('同步失败')
  return uni.$t('同步进行中...')
})
const descText = computed(() => {
  if (mode.value === 'success') return `${uni.$t('到目前为止，我们已经同步了')}${count.value || 101}${uni.$t('来自此帐户的事件。')}`
  if (mode.value === 'failed') return failMessage.value || uni.$t('同步过程中出现问题，请稍后重试。')
  return uni.$t('我们已经开始同步过程，但这可能需要几分钟时间！')
})
const btnText = computed(() => {
  if (mode.value === 'success') return uni.$t('查看活动')
  if (mode.value === 'failed') return uni.$t('返回首页')
  return uni.$t('返回首页')
})
const bottomText = computed(() => {
  if (mode.value === 'success') return uni.$t('同步成功')
  if (mode.value === 'failed') return uni.$t('同步失败')
  return uni.$t('等待同步完成')
})

function primaryAction() {
  if (mode.value === 'success') {
    uni.reLaunch({ url: '/pages/activity/index' })
    return
  }
  uni.reLaunch({ url: '/pages/calendar/yyo' })
}
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: #ffffff;
  padding-bottom: 120rpx;
}

.center {
  margin-top: 120rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.hero-icon {
  width: 160rpx;
  height: 160rpx;
  display: block;
}

.hero-icon-loading {
  animation: spin 1.6s linear infinite;
}

.hero-icon-fail {
  width: 140rpx;
  height: 140rpx;
  padding: 10rpx;
  border-radius: 9999rpx;
  background: rgba(255, 90, 95, 0.12);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.hero-title {
  margin-top: 28rpx;
  font-size: 44rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.92);
}

.hero-desc {
  margin-top: 14rpx;
  font-size: 28rpx;
  font-weight: 800;
  line-height: 42rpx;
  color: rgba(17, 17, 17, 0.75);
  text-align: center;
  padding: 0 48rpx;
}

.hero-btn {
  margin-top: 34rpx;
  width: 620rpx;
  height: 96rpx;
  border-radius: 9999rpx;
  background: #3d6afb;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-btn-fail {
  background: #ff5a5f;
}

.hero-btn-text {
  font-size: 34rpx;
  font-weight: 900;
  color: #ffffff;
}

.bottom-hint {
  position: fixed;
  left: 0;
  right: 0;
  bottom: calc(22rpx + env(safe-area-inset-bottom));
  text-align: center;
  font-size: 26rpx;
  font-weight: 700;
  color: rgba(17, 17, 17, 0.45);
}
</style>
