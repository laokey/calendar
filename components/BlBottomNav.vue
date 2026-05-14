<template>
  <view class="bl-bottom-nav">
    <view class="bl-bottom-item" :class="{ 'is-active': active === 'device' }" @click="go('/pages/device/index')">
      <image
        class="nav-img"
        :style="navImgStyle"
        :src="active === 'device' ? '/static/nav/nav_device_active.png' : '/static/nav/nav_device_inactive.png'"
        mode="aspectFit"
      />
    </view>
    <view class="bl-bottom-item" :class="{ 'is-active': active === 'gallery' }" @click="go('/pages/gallery/index')">
      <image
        class="nav-img"
        :style="navImgStyle"
        :src="active === 'gallery' ? '/static/nav/nav_gallery_active.png' : '/static/nav/nav_gallery_inactive.png'"
        mode="aspectFit"
      />
    </view>
    <view class="bl-bottom-item" :class="{ 'is-active': active === 'magic' }" @click="go('/pages/activity/index')">
      <image
        class="nav-img"
        :style="navImgStyle"
        :src="active === 'magic' ? '/static/nav/nav_activity_active.png' : '/static/nav/nav_activity_inactive.png'"
        mode="aspectFit"
      />
    </view>
    <view class="bl-bottom-item" :class="{ 'is-active': active === 'pause' }" @click="go('/pages/me/index')">
      <image
        class="nav-img"
        :style="navImgStyle"
        :src="active === 'pause' ? '/static/nav/nav_me_active.png' : '/static/nav/nav_me_inactive.png'"
        mode="aspectFit"
      />
    </view>
  </view>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps({
  active: { type: String, default: 'device' },
})

const windowWidth = ref(375)

function refreshWindowWidth() {
  try {
    const info = uni.getSystemInfoSync()
    windowWidth.value = typeof info?.windowWidth === 'number' ? info.windowWidth : 375
  } catch (e) {
    windowWidth.value = 375
  }
}

onMounted(() => {
  refreshWindowWidth()
  if (typeof uni?.onWindowResize === 'function') uni.onWindowResize(refreshWindowWidth)
})

onBeforeUnmount(() => {
  if (typeof uni?.offWindowResize === 'function') uni.offWindowResize(refreshWindowWidth)
})

const navImgStyle = computed(() => {
  const ww = windowWidth.value || 375
  const rpx2px = (rpx) => (ww * rpx) / 750

  const perTab = ww / 4
  const itemH = rpx2px(86)
  const targetH = itemH * 0.9

  const wByTab = perTab * 0.9
  const wByH = (targetH * 84) / 48
  const w = Math.max(1, Math.min(wByTab, wByH))
  const h = (w * 48) / 84

  return { width: `${Math.round(w)}px`, height: `${Math.round(h)}px` }
})

function go(url) {
  uni.reLaunch({ url })
}

function toast(title) {
  uni.showToast({ title, icon: 'none' })
}
</script>

<style scoped lang="scss">
.bl-bottom-item.is-active {
  background: transparent !important;
}

.nav-img {
  display: block;
}
</style>
