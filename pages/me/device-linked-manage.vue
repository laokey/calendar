<template>
  <view class="page">
    <view class="head" :style="{ paddingTop: safeTop + 'px' }">
      <view class="head-left" @click="back">
        <image class="back-img" src="/static/my/icon_back.png" mode="aspectFit" />
      </view>
      <text class="head-title">管理设备</text>
      <view class="head-right" @click="done">
        <text class="done">完成</text>
      </view>
    </view>

    <view class="list">
      <view v-for="d in devices" :key="d.deviceEmail" class="item">
        <view class="item-left">
          <text class="status">已激活</text>
          <text class="name">{{ d.deviceName || '日历' }}</text>
        </view>
        <view class="item-right">
          <view class="mini-btn danger" @click="askRemove(d)">
            <text class="mini-btn-text danger-text">解除关联</text>
          </view>
        </view>
      </view>
    </view>

    <view v-if="dialogVisible" class="dialog-mask" @click="closeDialog">
      <view class="dialog-content" @click.stop>
        <text class="d-title">删除</text>
        <text class="d-sub">确定解除该设备关联吗？</text>
        <view class="d-actions">
          <view class="d-btn cancel" @click="closeDialog"><text class="d-btn-text cancel-text">取消</text></view>
          <view class="d-btn confirm" @click="confirmRemove"><text class="d-btn-text confirm-text">删除</text></view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { deviceApi } from '../../utils/api'

const devices = ref([])

const dialogVisible = ref(false)
const activeEmail = ref('')
const removeEmail = ref('')

onLoad((options) => {
  const v =
    options && (options.deviceEmail || options.id) ? String(options.deviceEmail || options.id) : ''
  if (!v) return
  activeEmail.value = v
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

function back() {
  uni.navigateBack()
}

function done() {
  uni.navigateBack()
}

async function refresh() {
  const logged = !!uni.getStorageSync('auth_logged_in')
  if (!logged) {
    devices.value = []
    return
  }
  try {
    const list = await deviceApi.getCalendarDeviceList()
    const active = (list || []).filter((x) => Number(x && x.status) === 1)
    devices.value = activeEmail.value ? active.filter((x) => String(x.deviceEmail) === activeEmail.value) : active
  } catch (e) {
    devices.value = []
    uni.showToast({ title: String((e && e.message) || '获取设备失败'), icon: 'none' })
  }
}

onShow(() => {
  refresh()
})

function askRemove(d) {
  removeEmail.value = d && d.deviceEmail ? String(d.deviceEmail) : ''
  dialogVisible.value = true
}

function closeDialog() {
  dialogVisible.value = false
  removeEmail.value = ''
}

async function confirmRemove() {
  const email = removeEmail.value
  if (!email) return
  uni.showLoading({ title: '解绑中' })
  try {
    const res = await deviceApi.unbindCalendarDevice(email)
    if (res && typeof res === 'object' && res.code !== undefined && res.code !== 200 && res.code !== '200') {
      uni.showToast({ title: '解绑失败', icon: 'none' })
      return
    }
    uni.showToast({ title: '已解除关联', icon: 'none' })
    closeDialog()
    setTimeout(() => uni.navigateBack(), 250)
  } catch (e) {
    uni.showToast({ title: String((e && e.message) || '解绑失败'), icon: 'none' })
  } finally {
    try {
      uni.hideLoading()
    } catch (e) {}
  }
}
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background-color: #ffffff;
  background-image: url('/static/my/bg_my.png');
  background-repeat: no-repeat;
  background-position: top center;
  background-size: 100% auto;
  padding: 0 28rpx 40rpx;
}

.head {
  position: sticky;
  top: 0;
  z-index: 999;
  padding: 18rpx 0 12rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: transparent;
}

.head-left,
.head-right {
  width: 120rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
}

.head-right {
  justify-content: flex-end;
}

.back-img {
  width: 44rpx;
  height: 44rpx;
  display: block;
  opacity: 0.92;
}

.head-title {
  font-size: 34rpx;
  font-weight: 900;
  color: #111111;
}

.done {
  font-size: 28rpx;
  font-weight: 500;
  color: #406dff;
}

.list {
  margin-top: 18rpx;
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.item {
  background: rgba(255, 255, 255, 0.92);
  border-radius: 28rpx;
  padding: 22rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
}

.item-left {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.status {
  font-size: 24rpx;
  font-weight: 700;
  color: rgba(17, 17, 17, 0.4);
}

.name {
  font-size: 36rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.9);
}

.mini-btn {
  height: 72rpx;
  border-radius: 999rpx;
  padding: 0 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mini-btn.danger {
  background: rgba(255, 59, 48, 0.12);
}

.mini-btn-text {
  font-size: 26rpx;
  font-weight: 900;
}

.danger-text {
  color: #ff3b30;
}

.dialog-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 80rpx;
}

.dialog-content {
  width: 100%;
  background: #ffffff;
  border-radius: 32rpx;
  padding: 48rpx 40rpx 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24rpx;
}

.d-title {
  font-size: 36rpx;
  font-weight: 900;
  color: #111111;
}

.d-sub {
  font-size: 28rpx;
  font-weight: 500;
  color: #555555;
  text-align: center;
}

.d-actions {
  margin-top: 24rpx;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.d-btn {
  flex: 1;
  height: 96rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.d-btn.cancel {
  background: #f0f4ff;
}

.d-btn.confirm {
  background: #406dff;
}

.d-btn-text {
  font-size: 32rpx;
  font-weight: 800;
}

.cancel-text {
  color: #406dff;
}

.confirm-text {
  color: #ffffff;
}
</style>
