<template>
  <view class="segmented">
    <view
      v-for="opt in options"
      :key="opt.value"
      class="seg-item"
      :class="{ active: opt.value === modelValue }"
      @click="select(opt.value)"
    >
      <text class="seg-text">{{ opt.label }}</text>
    </view>
  </view>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: String, default: '' },
  options: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:modelValue', 'change'])

function select(v) {
  if (v === props.modelValue) return
  emit('update:modelValue', v)
  emit('change', v)
}
</script>

<style scoped lang="scss">
.segmented {
  background: #f2f4f7;
  border-radius: 999rpx;
  padding: 8rpx;
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.seg-item {
  flex: 1;
  height: 72rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.seg-text {
  font-size: 30rpx;
  font-weight: 700;
  color: #1d1d1f;
}

.seg-item.active {
  background: #3d6afb;
}

.seg-item.active .seg-text {
  color: #ffffff;
}
</style>

