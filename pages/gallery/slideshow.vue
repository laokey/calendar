<template>
  <view class="page">
    <view class="head" :style="{ paddingTop: safeTop + 'px' }">
      <view class="head-left" @click="back">
        <text class="back">‹</text>
      </view>
      <text class="head-title">幻灯片</text>
      <view class="head-right" />
    </view>

    <swiper class="sw" :circular="true" :autoplay="true" :interval="3000" :duration="450">
      <swiper-item v-for="p in photos" :key="p.id">
        <view class="slide">
          <image class="img" :src="p.uri" mode="aspectFit" />
        </view>
      </swiper-item>
    </swiper>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { ensureGalleryState, listPhotos } from '../../utils/galleryStore'

const albumId = ref('')
const state = ref(ensureGalleryState())

onLoad((options) => {
  albumId.value = options && options.albumId ? String(options.albumId) : ''
})

onShow(() => {
  state.value = ensureGalleryState()
})

const safeTop = computed(() => {
  try {
    const info = uni.getSystemInfoSync()
    const insets = info && info.safeAreaInsets ? info.safeAreaInsets : null
    return insets && typeof insets.top === 'number' ? insets.top : 0
  } catch (e) {
    return 0
  }
})

const photos = computed(() => listPhotos(state.value, albumId.value))

function back() {
  uni.navigateBack()
}
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: #000000;
}

.head {
  position: sticky;
  top: 0;
  z-index: 999;
  background: rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(10px);
  padding: 18rpx 18rpx 12rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #ffffff;
}

.head-left {
  width: 120rpx;
  display: flex;
  align-items: center;
}

.back {
  font-size: 56rpx;
  font-weight: 700;
  line-height: 1;
  color: rgba(255, 255, 255, 0.85);
  padding-left: 12rpx;
}

.head-title {
  font-size: 34rpx;
  font-weight: 900;
  color: #ffffff;
}

.head-right {
  width: 120rpx;
}

.sw {
  height: calc(100vh - 120rpx);
}

.slide {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.img {
  width: 100%;
  height: 100%;
}
</style>
