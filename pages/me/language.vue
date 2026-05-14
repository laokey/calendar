<template>
  <view class="page">
    <BlHeader title="切换语言" back />

    <view class="list">
      <view v-for="opt in options" :key="opt.value" class="item" @click="select(opt.value)">
        <text class="text">{{ opt.label }}</text>
        <view class="radio" :class="{ checked: current === opt.value }">
          <text v-if="current === opt.value" class="check">✓</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import BlHeader from '../../components/BlHeader.vue'
import { ensureMeState, updateSettings } from '../../utils/meStore'

const state = ref(ensureMeState())

const options = [
  { value: 'system', label: '遵循系统语言' },
  { value: 'English(US)', label: 'English(US)' },
  { value: 'Francais', label: 'Francais' },
  { value: 'Deutsch', label: 'Deutsch' },
  { value: 'Italiano', label: 'Italiano' },
  { value: 'Espanol', label: 'Espanol' },
  { value: '日本語', label: '日本語' },
  { value: '中文(简体)', label: '中文(简体)' },
  { value: 'Nederlands', label: 'Nederlands' },
]

onShow(() => {
  state.value = ensureMeState()
})

const current = computed(() => {
  const v = state.value.settings && state.value.settings.language ? state.value.settings.language : 'system'
  return v
})

function select(v) {
  const s = ensureMeState()
  updateSettings(s, { language: v })
  state.value = ensureMeState()
  uni.showToast({ title: '已切换', icon: 'none' })
}
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: #ffffff;
  padding: 0 28rpx;
}

.list {
  margin-top: 18rpx;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.item {
  height: 98rpx;
  border-radius: 22rpx;
  background: rgba(17, 17, 17, 0.03);
  border: 2rpx solid rgba(17, 17, 17, 0.06);
  padding: 0 22rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.text {
  font-size: 30rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.85);
}

.radio {
  width: 44rpx;
  height: 44rpx;
  border-radius: 9999rpx;
  background: rgba(17, 17, 17, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(17, 17, 17, 0.35);
}

.radio.checked {
  background: #3d6afb;
  color: #ffffff;
}

.check {
  font-size: 26rpx;
  font-weight: 900;
}
</style>
