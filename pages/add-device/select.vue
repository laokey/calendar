<template>
  <view class="bl-page">
    <BlHeader title="添加设备" back />

    <view class="list">
      <view class="bl-select-card" @click="selected = 0">
        <view class="row">
          <view class="thumb">
            <image class="thumb-img" src="/static/device/device_thumb.png" mode="aspectFit" />
          </view>
          <view class="meta">
            <text class="name">芝麻日历SV007</text>
            <text class="desc bl-muted">打理家常，共享时光</text>
          </view>
        </view>
        <view v-if="selected === 0" class="bl-select-check"><text>✓</text></view>
      </view>

      <view class="bl-select-card" :class="{ 'is-selected': selected === 1 }" @click="selected = 1">
        <view class="row">
          <view class="thumb">
            <image class="thumb-img" src="/static/device/device_thumb_alt.png" mode="aspectFit" />
          </view>
          <view class="meta">
            <text class="name">芝麻日历SV007</text>
            <text class="desc bl-muted">打理家常，共享时光</text>
          </view>
        </view>
        <view v-if="selected === 1" class="bl-select-check"><text>✓</text></view>
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

const selected = ref(1)

function confirm() {
  uni.navigateTo({ url: '/pages/device/index' })
}
</script>

<style scoped lang="scss">
.list {
  margin-top: 12rpx;
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.row {
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
