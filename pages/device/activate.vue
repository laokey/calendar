<template>
  <view class="bl-page">
    <BlHeader title="激活设备" back />

    <view class="hero">
      <image class="device-img" src="/static/device/device_hero.png" mode="aspectFit" />
    </view>

    <view class="code-card">
      <view class="code-tag"><text class="tag-text">设备激活码</text></view>
      <view class="code-main">
        <text class="code-number">{{ code }}</text>
        <view class="code-actions">
          <view class="bl-btn-secondary" @click="copy"><text>复制</text></view>
          <view class="bl-btn-secondary is-dark" @click="share">
            <image class="btn-icon" src="/static/device/icon_activate_action_add.png" mode="aspectFit" />
            <text>分享</text>
          </view>
        </view>
      </view>
      <text class="code-hint bl-muted">此代码将在23小时后刷新。</text>
    </view>

    <view class="steps-card bl-card">
      <text class="steps-title">三个步骤，激活设备</text>
      <view class="steps">
        <view class="step">
          <view class="step-icon">
            <image class="step-icon-img" src="/static/device/icon_activate_step_open_device.png" mode="aspectFit" />
          </view>
          <text class="step-text">打开您的新日历</text>
        </view>
        <view class="step-dots">
          <image class="step-dots-img" src="/static/device/icon_activate_step_dots.png" mode="aspectFit" />
        </view>
        <view class="step">
          <view class="step-icon">
            <image class="step-icon-img" src="/static/device/icon_activate_step_wifi.png" mode="aspectFit" />
          </view>
          <text class="step-text">连接到Wi‑Fi</text>
        </view>
        <view class="step-dots">
          <image class="step-dots-img" src="/static/device/icon_activate_step_dots.png" mode="aspectFit" />
        </view>
        <view class="step">
          <view class="step-icon">
            <image class="step-icon-img" src="/static/device/icon_activate_step_code.png" mode="aspectFit" />
          </view>
          <text class="step-text">输入激活码</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import BlHeader from '../../components/BlHeader.vue'

const code = ref('002482')

function copy() {
  uni.setClipboardData({ data: code.value })
}

function share() {
  uni.showToast({ title: '已准备分享', icon: 'none' })
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
  background: #eef4ff;
  border-radius: 28rpx;
  padding: 22rpx;
  position: relative;
}

.code-tag {
  position: absolute;
  left: 0;
  top: 0;
  height: 54rpx;
  padding: 0 22rpx;
  border-top-left-radius: 28rpx;
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
  font-size: 68rpx;
  font-weight: 900;
  color: #3d6afb;
  letter-spacing: 2rpx;
}

.code-actions {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.btn-icon {
  width: 32rpx;
  height: 32rpx;
  margin-right: 10rpx;
}

.code-hint {
  margin-top: 10rpx;
  font-size: 24rpx;
  font-weight: 600;
}

.steps-card {
  margin-top: 18rpx;
}

.steps-title {
  display: block;
  text-align: center;
  font-size: 32rpx;
  font-weight: 900;
  margin-bottom: 20rpx;
}

.steps {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0;
}

.step {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  padding: 0 10rpx;
}

.step-icon {
  width: 124rpx;
  height: 124rpx;
  border-radius: 34rpx;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10rpx 26rpx rgba(17, 17, 17, 0.06);
}

.step-icon-img {
  width: 72rpx;
  height: 72rpx;
}

.step-text {
  text-align: center;
  font-size: 24rpx;
  font-weight: 700;
  color: rgba(17, 17, 17, 0.75);
  line-height: 34rpx;
  min-height: 68rpx;
}

.step-dots {
  flex: 0 0 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 52rpx;
}

.step-dots-img {
  width: 68rpx;
  height: 20rpx;
}
</style>
