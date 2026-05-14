<template>
  <view v-if="visible" class="bl-toast-mask">
    <view class="bl-toast">
      <view class="bl-toast-icon">
        <text v-if="type === 'error'">×</text>
        <text v-else-if="type === 'loading'">…</text>
        <text v-else>✓</text>
      </view>
      <text class="bl-toast-text">{{ text }}</text>
    </view>
  </view>
</template>

<script setup>
defineProps({
  visible: { type: Boolean, default: false },
  type: { type: String, default: 'success' },
  text: { type: String, default: '' },
})
</script>

