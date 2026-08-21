<template>
  <view class="bl-bottom-nav">
    <view
      class="bl-bottom-item"
      :class="{ 'is-active': active === 'device' }"
      @click="go('/pages/device/index')"
    >
      <view class="nav-img icon-home" :class="{ 'is-active': active === 'device' }" />
      <text class="nav-label">{{ $t('首页') }}</text>
    </view>
    <view
      class="bl-bottom-item"
      :class="{ 'is-active': active === 'gallery' }"
      @click="go('/pages/gallery/index')"
    >
      <view class="nav-img icon-photo" :class="{ 'is-active': active === 'gallery' }" />
      <text class="nav-label">{{ $t('相册') }}</text>
    </view>
    <view
      class="bl-bottom-item"
      :class="{ 'is-active': active === 'magic' }"
      @click="go('/pages/activity/index')"
    >
      <view class="nav-img icon-bolt" :class="{ 'is-active': active === 'magic' }" />
      <text class="nav-label">{{ $t('活动') }}</text>
    </view>
    <view
      class="bl-bottom-item"
      :class="{ 'is-active': active === 'pause' }"
      @click="go('/pages/me/index')"
    >
      <view class="nav-img icon-user" :class="{ 'is-active': active === 'pause' }" />
      <text class="nav-label">{{ $t('我') }}</text>
    </view>
  </view>
</template>

<script setup>
defineProps({
  active: { type: String, default: 'device' },
})

function go(url) {
  uni.reLaunch({ url })
}
</script>

<style scoped lang="scss">
$activeColor: #3d6afb;
$inactiveColor: rgba(17, 17, 17, 0.45);

@function inline-svg($content) {
  @return url("data:image/svg+xml;utf8,#{$content}");
}

.bl-bottom-nav {
  width: 100% !important;
  height: 172rpx !important;
  padding: 18rpx 28rpx 40rpx !important;
  display: flex !important;
  flex-direction: row !important;
  align-items: stretch !important;
  justify-content: space-between !important;
  background: #ffffff !important;
  border-top: 1rpx solid rgba(17, 17, 17, 0.06) !important;
  box-shadow: 0 -10rpx 30rpx rgba(17, 17, 17, 0.04) !important;
  border-radius: 0 !important;
  box-sizing: border-box !important;
}

.bl-bottom-item {
  flex: 1 1 0 !important;
  width: auto !important;
  min-width: 0 !important;
  height: auto !important;
  border-radius: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 6rpx !important;
  padding: 0 !important;
  margin: 0 !important;
  box-sizing: border-box !important;
}

.bl-bottom-item.is-active {
  background: transparent !important;
  box-shadow: none !important;
  border-radius: 0 !important;
  width: auto !important;
  min-width: 0 !important;
  height: auto !important;
}

.nav-img {
  width: 58rpx !important;
  height: 58rpx !important;
  min-width: 58rpx !important;
  min-height: 58rpx !important;
  display: block !important;
  background-color: transparent;
  background-repeat: no-repeat;
  background-position: center;
  background-size: contain;
  box-sizing: border-box !important;
  padding: 0 !important;
  margin: 0 !important;
  border-radius: 0 !important;
  box-shadow: none !important;
}

.icon-home {
  background-image: inline-svg("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238A8A8A' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1V9.5z'/></svg>");
}

.icon-home.is-active {
  background-image: inline-svg("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%233d6afb' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'><path d='M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1V9.5z'/></svg>");
}

.icon-photo {
  background-image: inline-svg("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238A8A8A' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='4' width='18' height='16' rx='2.5'/><circle cx='9' cy='10' r='2'/><path d='m21 17-5-5-7 7'/></svg>");
}

.icon-photo.is-active {
  background-image: inline-svg("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%233d6afb' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='4' width='18' height='16' rx='2.5'/><circle cx='9' cy='10' r='2'/><path d='m21 17-5-5-7 7'/></svg>");
}

.icon-bolt {
  background-image: inline-svg("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238A8A8A' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M13 2 3 14h7l-1 8 10-12h-7l1-8z'/></svg>");
}

.icon-bolt.is-active {
  background-image: inline-svg("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%233d6afb' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'><path d='M13 2 3 14h7l-1 8 10-12h-7l1-8z'/></svg>");
}

.icon-user {
  background-image: inline-svg("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238A8A8A' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='8' r='4'/><path d='M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8'/></svg>");
}

.icon-user.is-active {
  background-image: inline-svg("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%233d6afb' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='8' r='4'/><path d='M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8'/></svg>");
}

.nav-label {
  font-size: 24rpx !important;
  font-weight: 500 !important;
  line-height: 1.1 !important;
  color: $inactiveColor !important;
  white-space: nowrap !important;
  letter-spacing: 0.2rpx !important;
  padding: 0 !important;
  margin: 0 !important;
}

.bl-bottom-item.is-active .nav-label {
  font-weight: 700 !important;
  color: $activeColor !important;
}
</style>
