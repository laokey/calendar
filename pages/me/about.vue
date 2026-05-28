<template>
  <view class="page">
    <BlHeader title="关于我们" back />

    <view class="hero">
      <image class="logo" src="/static/logo.png" mode="aspectFit" />
      <view class="pill">
        <text class="pill-text">当前版本:V1.7.1</text>
      </view>
    </view>

    <view class="card">
      <view class="row" @click="checkUpdate">
        <view class="left">
          <view class="ico"><image class="ico-img" src="/static/my/icon_info.png" mode="aspectFit" /></view>
          <text class="label">版本</text>
        </view>
        <view class="right">
          <text class="value muted">已是最新版本</text>
          <image class="chev-img" src="/static/my/icon_chevron_right.png" mode="aspectFit" />
        </view>
      </view>
      <view class="row" @click="open('小红书')">
        <view class="left">
          <view class="ico"><image class="ico-img" src="/static/my/icon_xhs.png" mode="aspectFit" /></view>
          <text class="label">小红书</text>
        </view>
        <view class="right"><image class="chev-img" src="/static/my/icon_chevron_right.png" mode="aspectFit" /></view>
      </view>
      <view class="row" @click="open('微信公众号')">
        <view class="left">
          <view class="ico"><image class="ico-img" src="/static/my/icon_wechat.png" mode="aspectFit" /></view>
          <text class="label">微信公众号</text>
        </view>
        <view class="right"><image class="chev-img" src="/static/my/icon_chevron_right.png" mode="aspectFit" /></view>
      </view>
    </view>
  </view>
</template>

<script setup>
import BlHeader from '../../components/BlHeader.vue'

function checkUpdate() {
  uni.showToast({ title: '已是最新版本', icon: 'none' })
}

function open(title) {
  uni.showToast({ title: `${title}未实现`, icon: 'none' })
}
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: #ffffff;
}

.hero {
  margin-top: 38rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18rpx;
}

.logo {
  width: 220rpx;
  height: 220rpx;
}

.pill {
  height: 70rpx;
  padding: 0 26rpx;
  border-radius: 9999rpx;
  background: rgba(61, 106, 251, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
}

.pill-text {
  font-size: 28rpx;
  font-weight: 900;
  color: #406DFF;
}

.card {
  margin: 22rpx 28rpx 0;
  background: rgba(17, 17, 17, 0.03);
  border-radius: 28rpx;
  overflow: hidden;
}

.row {
  height: 96rpx;
  padding: 0 22rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.row + .row {
  border-top: 2rpx solid rgba(17, 17, 17, 0.06);
}

.left {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.ico {
  width: 44rpx;
  height: 44rpx;
  border-radius: 14rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ico-img {
  width: 40rpx;
  height: 40rpx;
}

.label {
  font-size: 30rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.9);
}

.right {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.value {
  font-size: 26rpx;
  font-weight: 800;
}

.muted {
  color: rgba(17, 17, 17, 0.45);
}

.chev-img {
  width: 22rpx;
  height: 22rpx;
  opacity: 0.55;
}
</style>
