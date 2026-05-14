<template>
  <view class="bl-header" :style="{ paddingTop: safeTop + 'px' }">
    <view class="left">
      <view v-if="showBack" class="bl-header-back" @click="onBack">
        <text class="icon">‹</text>
      </view>
    </view>
    <view class="center">
      <slot name="center">
        <text v-if="title" class="title">{{ title }}</text>
      </slot>
    </view>
    <view class="right">
      <slot name="right" />
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: { type: String, default: '' },
  back: { type: Boolean, default: false },
})

const showBack = computed(() => props.back)

const safeTop = computed(() => {
  const { safeAreaInsets } = uni.getSystemInfoSync()
  return safeAreaInsets?.top ?? 0
})

function onBack() {
  uni.navigateBack()
}
</script>

<style scoped lang="scss">
.bl-header {
  position: sticky;
  top: 0;
  z-index: 999;
  background: #ffffff;
  margin: -28rpx -28rpx 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18rpx 36rpx 10rpx;
}

.left {
  width: 120rpx;
  display: flex;
  align-items: center;
}

.center {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.right {
  width: 120rpx;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.icon {
  font-size: 54rpx;
  font-weight: 700;
  line-height: 1;
}

.title {
  font-size: 36rpx;
  font-weight: 800;
}
</style>
