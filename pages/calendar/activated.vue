<template>
  <view class="bl-page">
    <BlHeader title="激活的日历" back />

    <view class="hero">
      <image class="device-img" src="/static/device/device_hero.png" mode="aspectFit" />
    </view>

    <text class="desc">打开日历并连接Wi‑Fi后，输入以下代码激活日历。</text>

    <view class="code-card">
      <view class="code-tag"><text class="tag-text">设备激活码</text></view>
      <view class="code-main">
        <text class="code-number">{{ code }}</text>
        <view class="code-actions">
          <view class="bl-btn-secondary" @click="copy"><text>复制</text></view>
          <view class="bl-btn-secondary is-dark" @click="share"><text>分享</text></view>
        </view>
      </view>
      <text class="code-hint bl-muted">此代码将在23小时后刷新。</text>
    </view>

    <view class="email-wrap">
      <text class="email-desc bl-muted">输入此代码后，您可将任一事件的电子邮件邀请同步至您的JeCalendar中：</text>
      <view class="email-card">
        <text class="email">{{ email }}</text>
      </view>
    </view>

    <view class="ready">
      <text class="ready-text">准备好同步日历了吗？</text>
    </view>
    <view class="bl-btn-primary" @click="goSync">
      <text>设置同步</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import BlHeader from '../../components/BlHeader.vue'

const code = ref('002482')
const email = ref('23456788897@qq.com')

function copy() {
  uni.setClipboardData({ data: code.value })
}

function share() {
  uni.showToast({ title: '已准备分享', icon: 'none' })
}

function goSync() {
  uni.navigateTo({ url: '/pages/sync/sync-home' })
}
</script>

<style scoped lang="scss">
.hero {
  height: 380rpx;
  position: relative;
  margin-top: 16rpx;
}

.device-img {
  position: absolute;
  left: 50%;
  top: 0;
  width: 640rpx;
  height: 380rpx;
  transform: translateX(-50%);
}

.device-plate {
  position: absolute;
  left: 50%;
  top: 150rpx;
  width: 640rpx;
  height: 300rpx;
  transform: translateX(-50%);
  background: radial-gradient(circle at 50% 40%, rgba(61, 106, 251, 0.22) 0%, rgba(61, 106, 251, 0) 70%);
  border-radius: 9999rpx;
}

.device-frame {
  position: absolute;
  left: 50%;
  top: 10rpx;
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

.desc {
  display: block;
  margin: 8rpx 0 18rpx;
  font-size: 28rpx;
  line-height: 40rpx;
  color: rgba(17, 17, 17, 0.65);
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

.code-hint {
  margin-top: 10rpx;
  font-size: 24rpx;
  font-weight: 600;
}

.email-wrap {
  margin-top: 18rpx;
}

.email-desc {
  display: block;
  font-size: 26rpx;
  line-height: 38rpx;
}

.email-card {
  margin-top: 14rpx;
  background: #eaf2ff;
  border-radius: 22rpx;
  padding: 26rpx 22rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.email {
  font-size: 42rpx;
  font-weight: 900;
  color: #3d6afb;
}

.ready {
  margin: 34rpx 0 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ready-text {
  font-size: 30rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.7);
}
</style>
