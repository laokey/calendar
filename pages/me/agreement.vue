<template>
  <view class="page">
    <BlHeader title="用户协议" back />

    <view class="card">
      <view class="row" @click="open('隐私政策')">
        <text class="label">隐私政策</text>
        <text class="chev">›</text>
      </view>
      <view class="row" @click="open('用户协议')">
        <text class="label">用户协议</text>
        <text class="chev">›</text>
      </view>
      <view class="row" @click="open('会员服务协议')">
        <text class="label">会员服务协议</text>
        <text class="chev">›</text>
      </view>
      <view class="row" @click="open('自动续费协议')">
        <text class="label">自动续费协议</text>
        <text class="chev">›</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import BlHeader from '../../components/BlHeader.vue'

function open(title) {
  uni.showModal({
    title,
    content: '此处为协议内容占位，后续可替换为真实内容或跳转到H5/富文本页面。',
    showCancel: false,
  })
}
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: #ffffff;
}

.card {
  margin: 18rpx 28rpx 0;
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

.label {
  font-size: 30rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.9);
}

.chev {
  font-size: 34rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.25);
}
</style>
