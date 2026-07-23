<template>
  <view class="page">
    <view class="center">
      <image class="logo" src="/static/login/icon_calendar_3d.png" mode="aspectFit" />
      <text class="name">{{ $t('芝麻日历') }}</text>
      <text class="slogan">{{ $t('一屏见年月，诸事皆清晰，') }}</text>
      <text class="slogan">{{ $t('芝麻日历伴朝夕') }}</text>
    </view>
  </view>
</template>

<script setup>
import { onLoad } from '@dcloudio/uni-app'

onLoad(() => {
  setTimeout(() => {
    const logged = !!uni.getStorageSync('auth_logged_in')
    if (logged) {
      uni.reLaunch({ url: '/pages/device/index' })
      return
    }
    uni.reLaunch({ url: '/pages/login/index' })
  }, 650)
})
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background-color: #ffffff;
  background-image: url('/static/login/bg_auth_gradient.png');
  background-repeat: no-repeat;
  background-position: top center;
  background-size: 100% auto;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 28rpx;
}

.center {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding-bottom: 60rpx;
}

.logo {
  width: 240rpx;
  height: 240rpx;
}

.name {
  margin-top: 34rpx;
  font-size: 56rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.9);
}

.slogan {
  margin-top: 14rpx;
  font-size: 28rpx;
  font-weight: 700;
  color: rgba(17, 17, 17, 0.55);
  line-height: 1.25;
}
</style>
