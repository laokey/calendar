<template>
  <view class="avatar" :style="{ width: sizeRpx, height: sizeRpx, background: color }">
    <text class="glyph" :style="{ fontSize: fontRpx }">{{ glyph }}</text>
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  glyph: { type: String, default: '' },
  color: { type: String, default: '#3d6afb' },
  size: { type: Number, default: 72 },
})

const sizeRpx = computed(() => `${props.size}rpx`)
const fontRpx = computed(() => `${Math.floor(props.size * 0.42)}rpx`)
</script>

<style scoped lang="scss">
.avatar {
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.glyph {
  color: #ffffff;
  font-weight: 900;
  line-height: 1;
}
</style>

