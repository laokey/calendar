<template>
  <view class="page">
    <BlHeader :title="$t('用户协议')" back />

    <view class="card">
      <view class="row" @click="open($t('隐私政策'))">
        <text class="label">{{ $t('隐私政策') }}</text>
        <image class="chev-img" src="/static/my/icon_chevron_right.png" mode="aspectFit" />
      </view>
      <view class="row" @click="open($t('用户协议'))">
        <text class="label">{{ $t('用户协议') }}</text>
        <image class="chev-img" src="/static/my/icon_chevron_right.png" mode="aspectFit" />
      </view>
      <view class="row" @click="open($t('会员服务协议'))">
        <text class="label">{{ $t('会员服务协议') }}</text>
        <image class="chev-img" src="/static/my/icon_chevron_right.png" mode="aspectFit" />
      </view>
      <view class="row" @click="open($t('自动续费协议'))">
        <text class="label">{{ $t('自动续费协议') }}</text>
        <image class="chev-img" src="/static/my/icon_chevron_right.png" mode="aspectFit" />
      </view>
    </view>
  </view>
</template>

<script setup>
import BlHeader from '../../components/BlHeader.vue'

function open(title) {
  uni.showModal({
    title,
    content: uni.$t('此处为协议内容占位，后续可替换为真实内容或跳转到H5/富文本页面。'),
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
  margin: 28rpx 28rpx 0;
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

.chev-img {
  width: 22rpx;
  height: 22rpx;
  opacity: 0.55;
}
</style>
