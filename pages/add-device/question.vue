<template>
  <view class="bl-page">
    <BlHeader back />

    <view class="title-wrap">
      <text class="title">你是否正在激活一个新的日历</text>
    </view>

    <view class="options">
      <view class="opt bl-select-card" :class="{ 'is-selected': selected === 'yes' }" @click="selected = 'yes'">
        <view class="thumb">
          <image class="thumb-img" src="/static/device/device_thumb_new.png" mode="aspectFit" />
        </view>
        <view class="meta">
          <view class="row">
            <view class="new-pill"><text class="new-text">NEW</text></view>
            <text class="name">是的</text>
          </view>
          <text class="desc bl-muted">我们开始</text>
        </view>
        <view v-if="selected === 'yes'" class="bl-select-check"><text>✓</text></view>
      </view>

      <view class="opt bl-select-card" :class="{ 'is-selected': selected === 'no' }" @click="selected = 'no'">
        <view class="thumb">
          <image class="thumb-img" src="/static/device/device_thumb.png" mode="aspectFit" />
        </view>
        <view class="meta">
          <text class="name">没有</text>
          <text class="desc bl-muted">关联已有的设备</text>
        </view>
        <view v-if="selected === 'no'" class="bl-select-check"><text>✓</text></view>
      </view>
    </view>

    <view class="bl-btn-primary" @click="confirm">
      <text>确认</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import BlHeader from '../../components/BlHeader.vue'

const selected = ref('no')

function confirm() {
  if (selected.value === 'yes') {
    uni.navigateTo({ url: '/pages/device/activate' })
    return
  }
  uni.navigateTo({ url: '/pages/add-device/select' })
}
</script>

<style scoped lang="scss">
.title-wrap {
  padding: 28rpx 8rpx 10rpx;
}

.title {
  font-size: 44rpx;
  font-weight: 900;
  line-height: 58rpx;
}

.options {
  margin-top: 16rpx;
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.opt {
  display: flex;
  align-items: center;
  gap: 18rpx;
}

.thumb {
  width: 110rpx;
  height: 82rpx;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.thumb-img {
  width: 110rpx;
  height: 82rpx;
}

.meta {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.new-pill {
  height: 34rpx;
  padding: 0 12rpx;
  border-radius: 9999rpx;
  background: #ff9500;
  display: flex;
  align-items: center;
  justify-content: center;
}

.new-text {
  font-size: 20rpx;
  font-weight: 900;
  color: #ffffff;
}

.name {
  font-size: 32rpx;
  font-weight: 900;
}

.desc {
  font-size: 24rpx;
  font-weight: 600;
}

.bl-btn-primary {
  margin-top: 26rpx;
}
</style>
