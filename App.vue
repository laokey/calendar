<template>
  <view class="app-root">
    <slot />
  </view>
</template>

<script setup>
import { onLaunch } from '@dcloudio/uni-app'

onLaunch(() => {
  const logged = !!uni.getStorageSync('auth_logged_in')
  if (logged) {
    uni.reLaunch({ url: '/pages/device/index' })
  }
})
</script>

<style lang="scss">
page {
  background: linear-gradient(180deg, #eaf2ff 0%, #ffffff 45%);
  color: #111111;
  font-family: "STHeitiSC-Light", "STHeitiSC-Medium", "PingFangSC-Regular", "PingFangSC-Medium", "PingFangSC-Semibold",
    "PingFang SC", "HiraginoSansGB-W3", "HiraginoSansGB-W6", "Hiragino Sans GB", "Heiti SC", "Noto Sans SC", "Microsoft YaHei",
    -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, "AppleColorEmoji", ".AppleColorEmojiUI",
    "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif;
}

page,
view,
text,
input,
textarea,
button {
  font-family: "STHeitiSC-Light", "STHeitiSC-Medium", "PingFangSC-Regular", "PingFangSC-Medium", "PingFangSC-Semibold",
    "PingFang SC", "HiraginoSansGB-W3", "HiraginoSansGB-W6", "Hiragino Sans GB", "Heiti SC", "Noto Sans SC", "Microsoft YaHei",
    -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, "AppleColorEmoji", ".AppleColorEmojiUI",
    "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif;
}

.app-root {
  min-height: 100vh;
}

.bl-page {
  padding: 28rpx 28rpx 220rpx;
}

.bl-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18rpx 8rpx 10rpx;
}

.bl-header-title {
  font-size: 44rpx;
  font-weight: 700;
  letter-spacing: 0.5rpx;
}

.bl-header-center {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
}

.bl-header-back {
  width: 72rpx;
  height: 72rpx;
  border-radius: 9999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bl-icon-btn {
  width: 72rpx;
  height: 72rpx;
  border-radius: 9999rpx;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10rpx 30rpx rgba(17, 17, 17, 0.08);
}

.bl-card {
  background: #ffffff;
  border-radius: 28rpx;
  padding: 22rpx;
  box-shadow: 0 10rpx 26rpx rgba(17, 17, 17, 0.06);
}

.bl-card + .bl-card {
  margin-top: 18rpx;
}

.bl-card-soft {
  background: #eef4ff;
  border-radius: 28rpx;
  padding: 22rpx;
}

.bl-row {
  display: flex;
  align-items: center;
}

.bl-row-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.bl-muted {
  color: rgba(17, 17, 17, 0.55);
}

.bl-divider {
  height: 1rpx;
  background: rgba(17, 17, 17, 0.08);
}

.bl-btn-primary {
  width: 100%;
  height: 96rpx;
  border-radius: 9999rpx;
  background: #3d6afb;
  color: #ffffff;
  font-size: 34rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.bl-btn-primary.is-disabled {
  background: #d7d7d7;
  color: rgba(17, 17, 17, 0.4);
  font-weight: 600;
}

.bl-btn-arrow {
  width: 64rpx;
  height: 64rpx;
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

.bl-btn-secondary {
  padding: 0 26rpx;
  height: 66rpx;
  border-radius: 9999rpx;
  background: #f2f2f2;
  color: rgba(17, 17, 17, 0.9);
  font-size: 28rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bl-btn-secondary.is-dark {
  background: #2d2d2d;
  color: #ffffff;
}

.bl-input {
  width: 100%;
  height: 96rpx;
  border-radius: 24rpx;
  background: rgba(17, 17, 17, 0.04);
  padding: 0 22rpx;
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.bl-input-field {
  flex: 1;
  font-size: 34rpx;
  font-weight: 700;
  color: #111111;
}

.bl-input-suffix {
  display: flex;
  align-items: center;
  gap: 10rpx;
  font-size: 30rpx;
  font-weight: 700;
  color: rgba(17, 17, 17, 0.8);
}

.bl-pill {
  padding: 10rpx 16rpx;
  border-radius: 9999rpx;
  font-size: 24rpx;
  font-weight: 700;
  background: #ff9500;
  color: #ffffff;
}

.bl-status-tag {
  position: absolute;
  top: 0;
  right: 0;
  height: 48rpx;
  padding: 0 18rpx;
  border-top-right-radius: 28rpx;
  border-bottom-left-radius: 18rpx;
  background: #3d6afb;
  color: #ffffff;
  font-size: 24rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bl-select-card {
  position: relative;
  padding: 24rpx;
  border-radius: 28rpx;
  background: #ffffff;
  box-shadow: 0 10rpx 26rpx rgba(17, 17, 17, 0.06);
}

.bl-select-card.is-selected {
  border: 4rpx solid #3d6afb;
  box-shadow: 0 10rpx 26rpx rgba(61, 106, 251, 0.14);
}

.bl-select-check {
  position: absolute;
  top: 0;
  right: 0;
  width: 74rpx;
  height: 64rpx;
  border-top-right-radius: 28rpx;
  border-bottom-left-radius: 22rpx;
  background: #3d6afb;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 34rpx;
  font-weight: 900;
}

.bl-toast-mask {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  pointer-events: none;
}

.bl-toast {
  width: 420rpx;
  height: 340rpx;
  border-radius: 54rpx;
  background: rgba(0, 0, 0, 0.78);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 22rpx;
  color: #ffffff;
}

.bl-toast-icon {
  width: 120rpx;
  height: 120rpx;
  border-radius: 9999rpx;
  background: rgba(255, 255, 255, 0.95);
  color: #111111;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 72rpx;
  font-weight: 900;
}

.bl-toast-text {
  font-size: 34rpx;
  font-weight: 700;
}

.bl-bottom-nav {
  position: fixed;
  left: 28rpx;
  right: 28rpx;
  bottom: 36rpx;
  height: 120rpx;
  border-radius: 9999rpx;
  background: #ffffff;
  box-shadow: 0 10rpx 30rpx rgba(17, 17, 17, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28rpx;
}

.bl-bottom-item {
  flex: 1;
  width: auto;
  height: 86rpx;
  border-radius: 9999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(17, 17, 17, 0.5);
  background: transparent;
}

.bl-bottom-item.is-active {
  width: 86rpx;
  background: transparent;
  color: rgba(17, 17, 17, 0.5);
}

.bl-bottom-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 9999rpx;
  background: rgba(17, 17, 17, 0.2);
}

.bl-avatar {
  width: 44rpx;
  height: 44rpx;
  border-radius: 9999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 24rpx;
  font-weight: 800;
}
</style>
