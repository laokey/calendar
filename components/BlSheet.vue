<template>
  <view v-if="modelValue" class="mask" @click.self="close">
    <view class="sheet" :style="{ paddingBottom: safeBottom + 'px' }">
      <view v-if="!headless" class="head">
        <view class="spacer" />
        <text class="title">{{ title }}</text>
        <view class="close" @click="close">
          <text class="close-text">×</text>
        </view>
      </view>
      <view class="body" :class="{ headless }">
        <slot />
      </view>
      <view v-if="confirmText" class="foot">
        <view class="btn" @click="confirm">
          <text class="btn-text">{{ confirmText }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
  confirmText: { type: String, default: '' },
  headless: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const safeBottom = computed(() => {
  const sys = uni.getSystemInfoSync()
  const insets = sys && sys.safeAreaInsets ? sys.safeAreaInsets : null
  return insets && typeof insets.bottom === 'number' ? insets.bottom : 0
})

function close() {
  emit('update:modelValue', false)
}

function confirm() {
  emit('confirm')
}
</script>

<style scoped lang="scss">
.mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: flex-end;
  z-index: 999;
}

.sheet {
  width: 100%;
  background: #ffffff;
  border-top-left-radius: 28rpx;
  border-top-right-radius: 28rpx;
  padding: 20rpx 24rpx 24rpx;
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 72rpx;
}

.spacer {
  width: 72rpx;
}

.title {
  font-size: 34rpx;
  font-weight: 900;
  color: #111111;
}

.close {
  width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.close-text {
  font-size: 44rpx;
  font-weight: 700;
  line-height: 1;
  color: #111111;
}

.body {
  padding-top: 8rpx;
}

.body.headless {
  padding-top: 0;
}

.foot {
  margin-top: 18rpx;
}

.btn {
  height: 96rpx;
  background: #3d6afb;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-text {
  color: #ffffff;
  font-size: 34rpx;
  font-weight: 900;
}
</style>
