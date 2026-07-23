<template>
  <view class="bl-page">
    <view class="bl-header" :style="{ paddingTop: safeTop + 'px' }">
      <text class="bl-header-title">{{ $t('设备') }}</text>
      <view class="bl-icon-btn" @click="goAdd">
        <text class="plus">+</text>
      </view>
    </view>

    <view v-if="mode === 'empty'" class="empty">
      <view class="device-hero">
        <image class="device-hero-img" src="/static/device/device_hero.png" mode="aspectFit" />
      </view>
      <text class="empty-title">{{ $t('尚未添加设备') }}</text>
      <text class="empty-desc bl-muted">{{ $t('请将手机靠近芝麻日历，保持网络通畅，输入设备号自动连接匹配') }}</text>

      <view class="bl-btn-primary" @click="goAdd">
        <text>{{ $t('添加设备') }}</text>
        <view class="bl-btn-arrow">
          <text class="arrow">→</text>
        </view>
      </view>
    </view>

    <view v-else class="list">
      <view
        v-for="(d, i) in devices"
        :key="d.deviceEmail"
        class="swipe-cell"
        :class="{ 'is-dragging': swipeDragging && swipeActiveIndex === i }"
        :data-index="i"
        @touchstart="onSwipeStart"
        @touchmove="onSwipeMove"
        @touchend="onSwipeEnd"
        @touchcancel="onSwipeEnd"
      >
        <view class="swipe-actions">
          <view class="swipe-delete" @click.stop="removeCalendar(i)">
            <text class="delete-text">{{ $t('删除') }}</text>
          </view>
        </view>
        <view class="swipe-content" :style="{ transform: `translateX(${getSwipeX(i)}px)` }">
          <view class="bl-card" @click="openCalendar(i)">
            <view class="bl-row">
              <view class="thumb">
                <image class="thumb-img" :src="d.status === 1 ? '/static/device/device_thumb.png' : '/static/device/device_thumb_new.png'" mode="aspectFit" />
              </view>
              <view class="meta">
                <text class="name">{{ d.deviceName || $t('日历') }}</text>
                <text class="email bl-muted">{{ $t('发送事件：') }}{{ d.deviceEmail }}</text>
              </view>
            </view>
            <view v-if="d.status === 0" class="btn-inline is-primary" @click.stop="goActivate(d)">
              <text class="btn-text">{{ $t('激活设备') }}</text>
              <view class="btn-arrow">
                <text class="arrow">→</text>
              </view>
            </view>
            <view v-else class="btn-inline is-soft" @click.stop="openCalendar(i)">
              <text class="btn-text is-soft-text">{{ $t('查看任务') }}</text>
              <view class="btn-arrow is-soft-arrow">
                <text class="arrow">→</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>
    <BlBottomNav active="device" />
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import BlBottomNav from '../../components/BlBottomNav.vue'
import { deviceApi } from '../../utils/api'

const mode = ref('list')
const devices = ref([])
const loading = ref(false)

onLoad((options) => {
  if (options && options.mode === 'empty') mode.value = 'empty'
})

async function refresh() {
  const logged = !!uni.getStorageSync('auth_logged_in')
  if (!logged) {
    devices.value = []
    mode.value = 'empty'
    return
  }
  loading.value = true
  try {
    const list = await deviceApi.getCalendarDeviceList()
    devices.value = list || []
    mode.value = devices.value.length ? 'list' : 'empty'
  } catch (e) {
    devices.value = []
    mode.value = 'empty'
    uni.showToast({ title: String((e && e.message) || uni.$t('获取设备列表失败')), icon: 'none' })
  } finally {
    loading.value = false
  }
}

onShow(() => {
  refresh()
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

const swipeX = ref(0)
const swipeDragging = ref(false)
const swipeActiveIndex = ref(-1)
const swipeOpenIndex = ref(-1)
let swipeStartClientX = 0
let swipeStartX = 0

function getSwipeDeleteWidthPx() {
  try {
    if (typeof uni?.upx2px === 'function') return uni.upx2px(188)
  } catch (e) {}
  return 94
}

function onSwipeStart(e) {
  const touch = e?.touches && e.touches[0] ? e.touches[0] : null
  const index = typeof e?.currentTarget?.dataset?.index === 'number' ? e.currentTarget.dataset.index : Number(e?.currentTarget?.dataset?.index)
  if (!touch) return
  if (!Number.isFinite(index)) return
  if (swipeOpenIndex.value !== -1 && swipeOpenIndex.value !== index) {
    swipeOpenIndex.value = -1
    swipeX.value = 0
  }
  swipeActiveIndex.value = index
  swipeDragging.value = true
  swipeStartClientX = touch.clientX
  swipeStartX = swipeOpenIndex.value === index ? swipeX.value : 0
}

function onSwipeMove(e) {
  if (!swipeDragging.value) return
  if (swipeActiveIndex.value === -1) return
  const touch = e?.touches && e.touches[0] ? e.touches[0] : null
  if (!touch) return

  const dx = touch.clientX - swipeStartClientX
  const maxLeft = -getSwipeDeleteWidthPx()
  const next = swipeStartX + dx
  swipeX.value = Math.min(0, Math.max(maxLeft, next))
}

function onSwipeEnd() {
  if (!swipeDragging.value) return
  swipeDragging.value = false

  const maxLeft = -getSwipeDeleteWidthPx()
  if (swipeActiveIndex.value === -1) return
  if (swipeX.value <= maxLeft / 2) {
    swipeX.value = maxLeft
    swipeOpenIndex.value = swipeActiveIndex.value
  } else {
    swipeX.value = 0
    swipeOpenIndex.value = -1
  }
  swipeActiveIndex.value = -1
}

function getSwipeX(index) {
  if (swipeDragging.value) return swipeActiveIndex.value === index ? swipeX.value : 0
  return swipeOpenIndex.value === index ? swipeX.value : 0
}

async function removeCalendar(index) {
  if (swipeOpenIndex.value === index) swipeOpenIndex.value = -1
  swipeX.value = 0
  const item = devices.value && devices.value[index] ? devices.value[index] : null
  if (!item || !item.deviceEmail) return
  uni.showLoading({ title: uni.$t('删除中') })
  try {
    const res = await deviceApi.unbindCalendarDevice(String(item.deviceEmail))
    if (res && typeof res === 'object' && res.code !== undefined && res.code !== 200 && res.code !== '200') {
      if (res.code === 201 || res.code === '201') {
        uni.showToast({ title: uni.$t('用户不存在'), icon: 'none' })
        return
      }
      if (res.code === 202 || res.code === '202') {
        uni.showToast({ title: uni.$t('日历设备不存在'), icon: 'none' })
        return
      }
      uni.showToast({ title: uni.$t('解绑失败'), icon: 'none' })
      return
    }
    uni.showToast({ title: uni.$t('已删除'), icon: 'none' })
    await refresh()
  } catch (e) {
    uni.showToast({ title: String((e && e.message) || uni.$t('解绑失败')), icon: 'none' })
  } finally {
    try {
      uni.hideLoading()
    } catch (e) {}
  }
}

function goAdd() {
  uni.navigateTo({ url: '/pages/add-device/question' })
}

function goActivate(d) {
  const code = d && d.activationCode ? String(d.activationCode) : ''
  const deviceEmail = d && d.deviceEmail ? String(d.deviceEmail) : ''
  uni.navigateTo({ url: `/pages/device/activate?code=${encodeURIComponent(code)}&deviceEmail=${encodeURIComponent(deviceEmail)}` })
}

function openCalendar(index) {
  const idx = Number(index)
  const d = devices.value && devices.value[idx] ? devices.value[idx] : null
  const item = {
    name: d && d.deviceName ? String(d.deviceName) : uni.$t('日历'),
    email: d && d.deviceEmail ? String(d.deviceEmail) : '',
    active: d && Number(d.status) === 1,
    tasks: [],
  }
  uni.setStorageSync('calendar_detail_ctx_v1', JSON.stringify(item))
  uni.navigateTo({ url: `/pages/calendar/yyo?active=${item.active ? 1 : 0}` })
}
</script>

<style scoped lang="scss">
.bl-header {
  position: sticky;
  top: 0;
  z-index: 999;
  background: #eaf2ff;
  margin: -28rpx -28rpx 0;
  padding-left: 28rpx;
  padding-right: 28rpx;
}

.plus {
  font-size: 50rpx;
  font-weight: 700;
  line-height: 1;
}

.empty {
  padding-top: 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.device-hero {
  width: 520rpx;
  height: 420rpx;
  position: relative;
  margin-top: 26rpx;
}

.device-hero-img {
  position: absolute;
  left: 50%;
  top: 0;
  width: 640rpx;
  height: 420rpx;
  transform: translateX(-50%);
}

.device-plate {
  position: absolute;
  left: 50%;
  top: 170rpx;
  width: 560rpx;
  height: 280rpx;
  transform: translateX(-50%);
  background: radial-gradient(circle at 50% 40%, rgba(61, 106, 251, 0.22) 0%, rgba(61, 106, 251, 0) 70%);
  border-radius: 9999rpx;
}

.device-frame {
  position: absolute;
  left: 50%;
  top: 40rpx;
  width: 420rpx;
  height: 240rpx;
  transform: translateX(-50%) rotate(-10deg);
  border-radius: 22rpx;
  background: #111111;
  box-shadow: 0 18rpx 40rpx rgba(17, 17, 17, 0.18);
}

.device-frame::after {
  content: '';
  position: absolute;
  left: 14rpx;
  top: 14rpx;
  right: 14rpx;
  bottom: 14rpx;
  border-radius: 16rpx;
  background: #f6f6f6;
}

.empty-title {
  margin-top: 22rpx;
  font-size: 44rpx;
  font-weight: 800;
}

.empty-desc {
  width: 560rpx;
  margin-top: 14rpx;
  font-size: 28rpx;
  line-height: 40rpx;
}

.bl-btn-primary {
  margin-top: 34rpx;
  width: 640rpx;
}

.list {
  padding-top: 8rpx;
}

.thumb {
  width: 110rpx;
  height: 82rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.thumb-img {
  width: 110rpx;
  height: 82rpx;
}

.meta {
  margin-left: 18rpx;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.name {
  font-size: 32rpx;
  font-weight: 800;
}

.email {
  font-size: 24rpx;
}

.btn-inline {
  margin-top: 18rpx;
  width: 100%;
  height: 86rpx;
  border-radius: 9999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.btn-inline.is-primary {
  background: #3d6afb;
  color: #ffffff;
}

.btn-inline.is-soft {
  background: #eef2ff;
  color: #3d6afb;
}

.btn-text {
  font-size: 30rpx;
  font-weight: 800;
}

.btn-text.is-soft-text {
  color: #3d6afb;
}

.btn-arrow {
  width: 56rpx;
  height: 56rpx;
  border-radius: 9999rpx;
  background: rgba(255, 255, 255, 0.95);
  color: #3d6afb;
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  right: 16rpx;
  top: 50%;
  transform: translateY(-50%);
}

.btn-arrow.is-soft-arrow {
  background: #3d6afb;
  color: #ffffff;
}

.arrow {
  font-size: 30rpx;
  font-weight: 900;
  line-height: 1;
}

.swipe-cell {
  position: relative;
  overflow: hidden;
  border-radius: 28rpx;
}

.bl-card {
  background: #fafafa;
}

.swipe-cell + .swipe-cell {
  margin-top: 18rpx;
}

.swipe-cell.is-dragging .swipe-content {
  transition: none;
}

.swipe-actions {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 188rpx;
  display: flex;
  align-items: stretch;
  justify-content: flex-end;
}

.swipe-delete {
  width: 188rpx;
  background: #ff4b3f;
  display: flex;
  align-items: center;
  justify-content: center;
}

.swipe-content {
  position: relative;
  transform: translateX(0);
  transition: transform 180ms ease;
}

.delete-text {
  color: #ffffff;
  font-size: 34rpx;
  font-weight: 900;
}

.task-card {
  margin-top: 16rpx;
  border-radius: 24rpx;
  padding: 18rpx 18rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.task-card.is-pink {
  background: #fdecee;
}

.task-card.is-gray {
  background: #f2f2f2;
}

.task-card.is-green {
  background: #eaf7f1;
}

.task-left {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.task-title {
  font-size: 30rpx;
  font-weight: 800;
}

.task-time {
  display: flex;
  align-items: center;
  gap: 10rpx;
  color: rgba(17, 17, 17, 0.55);
  font-size: 24rpx;
  font-weight: 700;
}

.clock {
  width: 26rpx;
  height: 26rpx;
  display: block;
}

.avatars {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.bl-avatar.is-blue {
  background: #4c8dff;
}

.bl-avatar.is-red {
  background: #ff5a5f;
}

.bl-avatar.is-purple {
  background: #9b59ff;
}

.bl-avatar.is-green {
  background: #4cc38a;
}
</style>
