<template>
  <view class="page">
    <BlHeader title="通知" back />

    <view class="content">
      <view class="intro">
        <text class="intro-text">获取有关</text>
        <text class="intro-text intro-highlight">{{ currentDeviceName }}</text>
        <text class="intro-text">的事件和任务的推送通知。</text>
      </view>

      <view v-if="!systemNotifyEnabled" class="permission-card">
        <text class="permission-text">系统推送通知未开启，当前仍可保存通知设置，开启后才会实际收到提醒。</text>
        <view class="permission-btn" @click="openSystemNotificationSettings">
          <text class="permission-btn-text">打开推送通知</text>
        </view>
      </view>

      <view v-if="systemNotifyEnabled" class="list">
        <view class="item">
          <view class="item-head">
            <text class="item-title">{{ eventNotify.notifyTitle || '事件发生时' }}</text>
            <switch
              class="item-switch"
              :checked="eventNotify.status === 1"
              :disabled="saving"
              color="#4A6CFF"
              @change="onToggle(0, $event)"
            />
          </view>
        </view>

        <view class="item">
          <view class="item-head">
            <text class="item-title">{{ advanceNotify.notifyTitle || '活动前几分钟' }}</text>
            <switch
              class="item-switch"
              :checked="advanceNotify.status === 1"
              :disabled="saving"
              color="#4A6CFF"
              @change="onToggle(1, $event)"
            />
          </view>

          <view v-if="advanceNotify.status === 1" class="slider-wrap">
            <view class="slider-shell" :class="{ disabled: saving }">
              <view class="slider-rail">
                <view class="slider-fill" :style="{ width: `${advanceFillPercent}%` }" />
                <view class="slider-thumb" :style="{ left: `${advanceFillPercent}%` }">
                  <view class="slider-thumb-dot" />
                </view>
              </view>
              <slider
                class="slider-hit"
                :value="advanceSliderStep"
                :min="0"
                :max="minuteOptions.length - 1"
                :step="1"
                :disabled="saving"
                activeColor="rgba(0,0,0,0)"
                backgroundColor="rgba(0,0,0,0)"
                block-size="20"
                block-color="rgba(0,0,0,0)"
                @change="onAdvanceMinuteChange"
              />
            </view>
            <view class="slider-labels">
              <text
                v-for="minute in minuteOptions"
                :key="minute"
                class="slider-label"
                :class="{ active: minute === advanceNotify.advanceMinutes }"
              >
                {{ minute }}
              </text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import BlHeader from '../../components/BlHeader.vue'
import { noticeApi } from '../../utils/api'
import { getSystemNotificationEnabled, openSystemNotificationSettings as openNativeNotificationSettings } from '../../utils/notificationPermission'

const minuteOptions = [5, 10, 15, 30, 60, 120]
const saving = ref(false)
const loading = ref(false)
const deviceName = ref('')
const deviceEmail = ref('')
const systemNotifyEnabled = ref(true)
const notifyList = ref(createDefaultNotifyList())

const currentDeviceName = computed(() => deviceName.value || '当前设备')
const eventNotify = computed(() => getNotifyItem(0))
const advanceNotify = computed(() => getNotifyItem(1))
const advanceSliderStep = computed(() => minuteToStep(advanceNotify.value.advanceMinutes))
const advanceFillPercent = computed(() => {
  const max = minuteOptions.length - 1
  if (max <= 0) return 0
  return (advanceSliderStep.value / max) * 100
})

onLoad((options) => {
  readPageContext(options)
})

onShow(async () => {
  readPageContext()
  await refreshSystemNotificationPermission()
  loadNotifyList()
})

function createDefaultNotifyList() {
  return [
    { notifyIndex: 0, notifyTitle: '事件发生时', advanceMinutes: 10, status: 0 },
    { notifyIndex: 1, notifyTitle: '活动前几分钟', advanceMinutes: 10, status: 0 },
  ]
}

function cloneNotifyList(list) {
  return (Array.isArray(list) ? list : []).map((item) => ({ ...item }))
}

function normalizeMinute(value) {
  const num = Number(value)
  if (!Number.isFinite(num)) return 10
  let best = minuteOptions[0]
  let diff = Math.abs(num - best)
  for (const minute of minuteOptions) {
    const nextDiff = Math.abs(num - minute)
    if (nextDiff < diff) {
      best = minute
      diff = nextDiff
    }
  }
  return best
}

function normalizeNotifyList(list) {
  const base = createDefaultNotifyList()
  const remote = Array.isArray(list) ? list : []
  return base.map((item) => {
    const found = remote.find((x) => Number(x && x.notifyIndex) === item.notifyIndex)
    if (!found) return { ...item }
    return {
      notifyIndex: item.notifyIndex,
      notifyTitle: String(found.notifyTitle || item.notifyTitle),
      advanceMinutes: normalizeMinute(found.advanceMinutes),
      status: Number(found.status) === 1 ? 1 : 0,
    }
  })
}

function getNotifyItem(notifyIndex) {
  return notifyList.value.find((item) => item.notifyIndex === notifyIndex) || createDefaultNotifyList()[notifyIndex] || createDefaultNotifyList()[0]
}

function updateLocalNotify(notifyIndex, patch) {
  notifyList.value = normalizeNotifyList(
    notifyList.value.map((item) => (item.notifyIndex === notifyIndex ? { ...item, ...(patch || {}) } : item)),
  )
}

function minuteToStep(value) {
  const minute = normalizeMinute(value)
  const idx = minuteOptions.findIndex((item) => item === minute)
  return idx >= 0 ? idx : 1
}

function stepToMinute(step) {
  const idx = Math.max(0, Math.min(minuteOptions.length - 1, Number(step) || 0))
  return minuteOptions[idx]
}

function decodeQueryValue(value) {
  const raw = value === undefined || value === null ? '' : String(value).trim()
  if (!raw) return ''
  try {
    return decodeURIComponent(raw)
  } catch (e) {
    return raw
  }
}

function readPageContext(options) {
  const opts = options && typeof options === 'object' ? options : {}
  const passedName = decodeQueryValue(opts.deviceName)
  const passedEmail = decodeQueryValue(opts.deviceEmail)
  if (passedName) deviceName.value = passedName
  if (passedEmail) deviceEmail.value = passedEmail
  try {
    const raw = uni.getStorageSync('calendar_detail_ctx_v1')
    const ctx = raw && typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!deviceName.value && ctx && ctx.name) deviceName.value = String(ctx.name)
    if (!deviceEmail.value && ctx && ctx.email) deviceEmail.value = String(ctx.email)
  } catch (e) {}
}

async function loadNotifyList() {
  if (loading.value) return
  loading.value = true
  try {
    const list = await noticeApi.getNotifyTypeList({ deviceEmail: deviceEmail.value })
    notifyList.value = normalizeNotifyList(list)
  } catch (e) {
    notifyList.value = normalizeNotifyList(notifyList.value)
    uni.showToast({ title: String((e && e.message) || '获取通知设置失败'), icon: 'none' })
  } finally {
    loading.value = false
  }
}

async function submitNotifyChange(notifyIndex) {
  const item = getNotifyItem(notifyIndex)
  saving.value = true
  try {
    await noticeApi.onOffNotify({
      deviceEmail: deviceEmail.value,
      notifyIndex,
      advanceMinutes: item.advanceMinutes,
      onOff: item.status,
    })
  } finally {
    saving.value = false
  }
}

async function onToggle(notifyIndex, e) {
  const next = !!(e && e.detail ? e.detail.value : false)
  const previous = cloneNotifyList(notifyList.value)
  updateLocalNotify(notifyIndex, { status: next ? 1 : 0 })
  try {
    await submitNotifyChange(notifyIndex)
  } catch (e2) {
    notifyList.value = previous
    uni.showToast({ title: String((e2 && e2.message) || '更新通知设置失败'), icon: 'none' })
  }
}

async function onAdvanceMinuteChange(e) {
  const minute = stepToMinute(e && e.detail ? e.detail.value : 0)
  const previous = cloneNotifyList(notifyList.value)
  updateLocalNotify(1, { advanceMinutes: minute })
  try {
    await submitNotifyChange(1)
  } catch (e2) {
    notifyList.value = previous
    uni.showToast({ title: String((e2 && e2.message) || '更新提醒时间失败'), icon: 'none' })
  }
}

async function refreshSystemNotificationPermission() {
  try {
    systemNotifyEnabled.value = await getSystemNotificationEnabled()
  } catch (e) {
    systemNotifyEnabled.value = true
  }
}

function openSystemNotificationSettings() {
  openNativeNotificationSettings().then((opened) => {
    if (!opened) uni.showToast({ title: '当前环境暂不支持打开系统设置', icon: 'none' })
  })
}
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: #ffffff;
  padding: 0 28rpx 40rpx;
}

.content {
  padding-top: 58rpx;
}

.intro {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  padding: 0 20rpx;
}

.intro-text {
  font-size: 28rpx;
  line-height: 42rpx;
  color: #444444;
}

.intro-highlight {
  color: #4a6cff;
}

.permission-card {
  padding-top: 82rpx;
}

.permission-text {
  display: block;
  padding: 0 20rpx;
  font-size: 28rpx;
  color: #444444;
}

.permission-btn {
  margin-top: 48rpx;
  height: 88rpx;
  border-radius: 999rpx;
  background: #4a6cff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.permission-btn-text {
  font-size: 32rpx;
  font-weight: 700;
  color: #ffffff;
}

.list {
  margin-top: 26rpx;
  display: flex;
  flex-direction: column;
  gap: 26rpx;
}

.item {
background: #F8F8F8;
  border: 2rpx solid #efefef;
  border-radius: 24rpx;
  padding: 26rpx 26rpx 24rpx;
}

.item-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
}

.item-title {
  flex: 1;
  font-size: 36rpx;
  font-weight: 700;
  color: #222222;
}

.item-switch {
  transform: scale(0.9);
  transform-origin: right center;
}

.slider-wrap {
  margin-top: 26rpx;
}

.slider-shell {
  position: relative;
  height: 36rpx;
}

.slider-shell.disabled {
  opacity: 0.7;
}

.slider-rail {
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 14rpx;
  transform: translateY(-50%);
  border-radius: 999rpx;
  background: #d9deeb;
  overflow: visible;
}

.slider-fill {
  height: 100%;
  border-radius: 999rpx;
  background: #4a6cff;
}

.slider-thumb {
  position: absolute;
  top: 50%;
  width: 28rpx;
  height: 28rpx;
  margin-left: -14rpx;
  transform: translateY(-50%);
  border-radius: 50%;
  background: #ffffff;
  border: 2rpx solid rgba(74, 108, 255, 0.18);
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2rpx 8rpx rgba(17, 17, 17, 0.12);
}

.slider-thumb-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: #4a6cff;
}

.slider-hit {
  position: absolute;
  left: -8rpx;
  right: -8rpx;
  top: 50%;
  z-index: 2;
  margin: 0;
  opacity: 0.01;
  transform: translateY(-50%);
}

.slider-labels {
  margin-top: 10rpx;
  padding: 0 2rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.slider-label {
  font-size: 27rpx;
  color: #7d7d7d;
  line-height: 34rpx;
}

.slider-label.active {
  color: #4a6cff;
  font-weight: 700;
}
</style>
