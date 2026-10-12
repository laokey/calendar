<template>
  <view class="page">
    <BlHeader :title="$t('转移设备链接')" back />

    <view class="hero">
      <view class="device-pic">
        <image class="device-img" src="/static/device/icon_device_invite.png" mode="aspectFit" />
      </view>
      <text class="hero-title">{{ $t('邀请您的家人或朋友') }}</text>
      <text class="hero-sub">{{ $t('您要传给哪个设备？') }}</text>
    </view>

    <view class="card">
      <text class="card-title">{{ $t('芝麻日历') }}</text>
      <view v-if="loading" class="state-text">
        <text>{{ $t('加载中...') }}</text>
      </view>
      <view v-else-if="!devices.length" class="state-text">
        <text>{{ $t('暂无设备') }}</text>
      </view>
      <view
        v-for="(item, idx) in devices"
        :key="item.linkId || item.deviceEmail || idx"
        class="opt"
        :class="{ active: selected === idx }"
        @click="selected = idx"
      >
        <text class="opt-text">{{ item.deviceEmail || item.deviceName }}</text>
      </view>
    </view>

    <view class="btn" :class="{ disabled: loading || submitting || !devices.length }" @click="send">
      <text class="btn-text">{{ $t('转移设备链接') }}</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import BlHeader from '../../components/BlHeader.vue'
import { getCalendarDeviceList, transferCalendarDevice } from '../../utils/api/device'

const selected = ref(0)
const loading = ref(false)
const submitting = ref(false)
const devices = ref([])

onLoad(() => {
  loadDevices()
})

onShow(() => {
  loadDevices()
})

function currentUserEmail() {
  return String(uni.getStorageSync('auth_email') || '').trim()
}

async function loadDevices() {
  loading.value = true
  try {
    const list = await getCalendarDeviceList()
    devices.value = Array.isArray(list) ? list : []
    if (!devices.value.length) {
      selected.value = 0
      return
    }
    if (selected.value < 0 || selected.value >= devices.value.length) {
      selected.value = 0
    }
  } catch (e) {
    devices.value = []
    uni.showToast({ title: uni.$t('加载设备失败'), icon: 'none' })
  } finally {
    loading.value = false
  }
}

async function send() {
  if (loading.value || submitting.value) return
  if (!devices.value.length) {
    uni.showToast({ title: uni.$t('暂无可邀请设备'), icon: 'none' })
    return
  }
  const current = devices.value[selected.value]
  const userEmail = currentUserEmail()
  const deviceEmail = current && current.deviceEmail ? String(current.deviceEmail).trim() : ''
  if (!userEmail) {
    uni.showToast({ title: uni.$t('未获取到当前用户邮箱'), icon: 'none' })
    return
  }
  if (!deviceEmail) {
    uni.showToast({ title: uni.$t('请选择设备'), icon: 'none' })
    return
  }
  submitting.value = true
  try {
    await transferCalendarDevice({ userEmail, deviceEmail })
    uni.showToast({ title: uni.$t('转移成功'), icon: 'none' })
    setTimeout(() => {
      uni.navigateBack()
    }, 300)
  } catch (e) {
    uni.showToast({ title: uni.$t('转移失败'), icon: 'none' })
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: #ffffff;
  padding: 0 28rpx calc(164rpx + env(safe-area-inset-bottom));
}

.hero {
  margin-top: 12rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.device-pic {
  width: 420rpx;
  height: 240rpx;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.device-img {
  width: 420rpx;
  height: 240rpx;
}

.device-badge {
  position: absolute;
  right: 36rpx;
  bottom: 26rpx;
  width: 92rpx;
  height: 92rpx;
  border-radius: 9999rpx;
  background: #ffb020;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 16rpx 36rpx rgba(255, 176, 32, 0.25);
}

.device-badge-img {
  width: 44rpx;
  height: 44rpx;
  filter: brightness(0) invert(1);
}

.hero-title {
  margin-top: 14rpx;
  font-size: 40rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.9);
}

.hero-sub {
  margin-top: 10rpx;
  font-size: 26rpx;
  font-weight: 700;
  color: rgba(17, 17, 17, 0.55);
}

.card {
  margin-top: 26rpx;
  background: rgba(17, 17, 17, 0.03);
  border-radius: 28rpx;
  padding: 22rpx;
}

.card-title {
  display: block;
  font-size: 30rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.85);
  margin-bottom: 16rpx;
}

.state-text {
  min-height: 96rpx;
  border-radius: 22rpx;
  background: #ffffff;
  border: 2rpx solid rgba(17, 17, 17, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  font-weight: 700;
  color: rgba(17, 17, 17, 0.45);
}

.opt {
  height: 96rpx;
  border-radius: 22rpx;
  background: #ffffff;
  border: 2rpx solid rgba(17, 17, 17, 0.06);
  padding: 0 18rpx;
  display: flex;
  align-items: center;
}

.opt + .opt {
  margin-top: 12rpx;
}

.opt.active {
  background: #eef2ff;
  border-color: rgba(61, 106, 251, 0.8);
}

.opt-text {
  font-size: 30rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.85);
}

.btn {
  position: fixed;
  left: 28rpx;
  right: 28rpx;
  bottom: calc(40rpx + env(safe-area-inset-bottom));
  height: 104rpx;
  border-radius: 9999rpx;
  background: #3d6afb;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.btn.disabled {
  background: rgba(61, 106, 251, 0.45);
}

.btn-text {
  color: #ffffff;
  font-size: 34rpx;
  font-weight: 900;
}
</style>
