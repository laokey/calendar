<template>
  <view class="bl-page">
    <BlHeader :title="$t('激活设备')" back />

    <view class="hero">
      <image class="device-img" src="/static/device/device_hero_plain.png" mode="aspectFit" />
    </view>

    <view class="code-card">
      <view class="code-tag"><text class="tag-text">{{ $t('设备激活码') }}</text></view>
      <view class="code-main">
        <text class="code-number">{{ code }}</text>
        <view class="code-actions">
          <view class="bl-btn-secondary bordered" @click="copy"><text>{{ $t('复制') }}</text></view>
          <view class="bl-btn-secondary is-dark" @click="share">
            <!-- <image class="btn-icon" src="/static/device/icon_activate_action_add.png" mode="aspectFit" /> -->
            <text>{{ $t('分享') }}</text>
          </view>
        </view>
      </view>
      <text class="code-hint bl-muted">{{ $t('此代码将在23小时后刷新。') }}</text>
    </view>

    <view class="steps-card bl-card">
      <text class="steps-title">{{ $t('三个步骤，激活设备') }}</text>
      <view class="steps">
        <view class="step">
          <view class="step-icon">
            <image class="step-icon-img" src="/static/device/icon_activate_step_open_device.png" mode="aspectFit" />
          </view>
          <text class="step-text">{{ $t('打开您的新日历') }}</text>
        </view>
        <view class="step-dots">
          <image class="step-dots-img" src="/static/device/icon_activate_step_dots_alt.png" mode="aspectFit" />
        </view>
        <view class="step">
          <view class="step-icon">
            <image class="step-icon-img" src="/static/device/icon_activate_step_wifi.png" mode="aspectFit" />
          </view>
          <text class="step-text">{{ $t('连接到Wi‑Fi') }}</text>
        </view>
        <view class="step-dots">
          <image class="step-dots-img" src="/static/device/icon_activate_step_dots_alt.png" mode="aspectFit" />
        </view>
        <view class="step">
          <view class="step-icon">
            <image class="step-icon-img" src="/static/device/icon_activate_step_code.png" mode="aspectFit" />
          </view>
          <text class="step-text">{{ $t('输入激活码') }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import BlHeader from '../../components/BlHeader.vue'
import { deviceApi } from '../../utils/api'

const code = ref('')

function normalizeRouteText(value) {
  const raw = value === undefined || value === null ? '' : String(value).trim()
  if (!raw || raw === 'null' || raw === 'undefined') return ''
  try {
    return decodeURIComponent(raw)
  } catch (e) {
    return raw
  }
}

async function loadActivationCode(deviceEmail, fallbackCode = '') {
  const email = String(deviceEmail || '').trim()
  if (!email) {
    code.value = String(fallbackCode || '').trim()
    return
  }
  uni.showLoading({ title: uni.$t('获取中') })
  try {
    const remoteCode = await deviceApi.getDeviceActivationCode({ deviceEmail: email })
    const nextCode = String(remoteCode || fallbackCode || '').trim()
    if (!nextCode) {
      uni.showToast({ title: uni.$t('获取激活码失败'), icon: 'none' })
      return
    }
    code.value = nextCode
  } catch (e) {
    code.value = String(fallbackCode || '').trim()
    uni.showToast({ title: String((e && e.message) || uni.$t('获取激活码失败')), icon: 'none' })
  } finally {
    try {
      uni.hideLoading()
    } catch (e) {}
  }
}

onLoad((options) => {
  const fallbackCode = normalizeRouteText(options && (options.code || options.activationCode))
  const deviceEmail = normalizeRouteText(options && (options.deviceEmail || options.deviceemail))
  loadActivationCode(deviceEmail, fallbackCode)
})

function copy() {
  if (!code.value) return
  uni.setClipboardData({ data: code.value })
}

function share() {
  uni.showToast({ title: uni.$t('已准备分享'), icon: 'none' })
}
</script>

<style scoped lang="scss">
.hero {
  height: 430rpx;
  position: relative;
  margin-top: 16rpx;
}

.device-img {
  position: absolute;
  left: 50%;
  top: 0;
  width: 640rpx;
  height: 430rpx;
  transform: translateX(-50%);
}

.device-plate {
  position: absolute;
  left: 50%;
  top: 160rpx;
  width: 640rpx;
  height: 320rpx;
  transform: translateX(-50%);
  background: radial-gradient(circle at 50% 40%, rgba(61, 106, 251, 0.22) 0%, rgba(61, 106, 251, 0) 70%);
  border-radius: 9999rpx;
}

.device-frame {
  position: absolute;
  left: 50%;
  top: 20rpx;
  width: 480rpx;
  height: 270rpx;
  transform: translateX(-50%) rotate(-10deg);
  border-radius: 22rpx;
  background: #111111;
  box-shadow: 0 18rpx 40rpx rgba(17, 17, 17, 0.18);
}

.device-frame::after {
  content: '';
  position: absolute;
  left: 16rpx;
  top: 16rpx;
  right: 16rpx;
  bottom: 16rpx;
  border-radius: 16rpx;
  background: #f6f6f6;
}

.code-card {
  background: linear-gradient( 180deg, #DEE9FF 0%, #FAFAFA 100%);
  border-radius: 24rpx;
  border: 4rpx solid rgba(64,109,255,0.2);
  padding: 40rpx;
  position: relative;
}

.code-tag {
  position: absolute;
  left: 0;
  top: 0;
  height: 54rpx;
  padding: 0 24rpx;
  border-top-left-radius: 18rpx;
  border-bottom-right-radius: 18rpx;
  background: #3d6afb;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tag-text {
  font-size: 24rpx;
  font-weight: 800;
  color: #ffffff;
}

.code-main {
  margin-top: 42rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.code-number {
  font-size: 64rpx;
  font-weight: 900;
  color: #406DFF;
  letter-spacing: 2rpx;
}

.code-actions {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.bordered {
  border: 2rpx solid #D9D9D9;
}
.btn-icon {
  width: 32rpx;
  height: 32rpx;
  margin-right: 10rpx;
}

.code-hint {
  margin-top: 8rpx;
  font-size: 28rpx;
  color: #999999;
  font-weight: 500;
}

.steps-card {
  margin-top: 28rpx;
  background: linear-gradient( 180deg, #EBF2FF 0%, #FFFFFF 100%);
  padding: 30rpx 24rpx 26rpx;
  border-radius: 24rpx;
  box-shadow: none;
}

.steps-title {
  display: block;
  text-align: center;
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
  line-height: 42rpx;
}

.steps {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-top: 26rpx;
  gap: 0;
}

.step {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14rpx;
  padding: 0 4rpx;
}

.step-icon {
  width: 74rpx;
  height: 74rpx;
  border-radius: 20rpx;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6rpx 18rpx rgba(61, 106, 251, 0.08);
}

.step-icon-img {
  width: 64rpx;
  height: 64rpx;
}

.step-text {
  display: block;
  text-align: center;
  font-size: 22rpx;
  font-weight: 600;
  color: rgba(17, 17, 17, 0.72);
  line-height: 30rpx;
  min-height: 60rpx;
  white-space: normal;
  word-break: break-word;
  overflow-wrap: break-word;
}

.step-dots {
  flex: 0 0 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 26rpx;
}

.step-dots-img {
  width: 64rpx;
  height: 32rpx;
}
</style>
