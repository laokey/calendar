<template>
  <view class="page">
    <view class="head" :style="{ paddingTop: safeTop + 'px' }">
      <view class="head-left" @click="back">
        <text class="back">‹</text>
      </view>
      <text class="head-title">{{ $t('幻灯片') }}</text>
      <view class="head-right" />
    </view>

    <swiper class="sw" :circular="true" :autoplay="true" :interval="3000" :duration="450">
      <swiper-item v-for="p in photos" :key="p.id">
        <view class="slide">
          <image v-if="p.type !== 'video' || p.thumbUri" class="img" :src="p.type === 'video' ? p.thumbUri : p.uri" mode="aspectFit" />
          <view v-else class="img ph" />
          <view v-if="p.type === 'video'" class="play">
            <image class="play-icon" src="/static/gallery/icon_play.png" mode="aspectFit" />
          </view>
        </view>
      </swiper-item>
    </swiper>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { getAlbumList } from '../../utils/api/gallery'

const albumId = ref('')
const rawAlbums = ref([])

onLoad((options) => {
  albumId.value = options && options.albumId ? String(options.albumId) : ''
})

onShow(() => {
  refresh()
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

const photos = computed(() => {
  const album = rawAlbums.value.find((it) => it.albumId === albumId.value)
  return album && Array.isArray(album.photos) ? album.photos : []
})

function back() {
  uni.navigateBack()
}

async function refresh() {
  try {
    const active = String(uni.getStorageSync('active_device_email_v1') || '').trim()
    rawAlbums.value = active ? await getAlbumList({ deviceEmail: active }) : []
  } catch (e) {
    rawAlbums.value = []
    uni.showToast({ title: String((e && e.message) || uni.$t('获取相册失败')), icon: 'none' })
  }
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
  position: relative;
}

.img {
  width: 100%;
  height: 100%;
}

.img.ph {
  background: rgba(255, 255, 255, 0.08);
}

.play {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.play-icon {
  width: 64rpx;
  height: 64rpx;
  opacity: 0.95;
}
</style>
