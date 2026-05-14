<template>
  <view class="bl-page">
    <BlHeader back />

    <view class="hero">
      <image class="device-img" src="/static/device/device_hero.png" mode="aspectFit" />
      <view class="tag"><text class="tag-text">待审批</text></view>
    </view>

    <view class="info-card">
      <text class="info-text">
        该电子日历为私密状态，加入日历需要审批。我们已邮件通知设备所有者，您也可告知设备所有者在应用“用户管理”的“待处理”列表中完成审批。审批通过后，即可访问该日历。
      </text>
    </view>

    <view class="bl-btn-primary" @click="done">
      <text>明白了</text>
    </view>
  </view>
</template>

<script setup>
import BlHeader from '../../components/BlHeader.vue'

function done() {
  uni.navigateBack()
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
  top: 170rpx;
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

.tag {
  position: absolute;
  right: 40rpx;
  top: 18rpx;
  height: 56rpx;
  padding: 0 20rpx;
  border-radius: 9999rpx;
  background: #ff9500;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tag-text {
  font-size: 26rpx;
  font-weight: 900;
  color: #ffffff;
}

.info-card {
  margin-top: 14rpx;
  background: #eef4ff;
  border-radius: 28rpx;
  padding: 22rpx;
}

.info-text {
  font-size: 26rpx;
  line-height: 40rpx;
  color: rgba(17, 17, 17, 0.72);
  font-weight: 650;
}

.bl-btn-primary {
  margin-top: 22rpx;
}
</style>
