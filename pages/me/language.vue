<template>
  <view class="page">
    <BlHeader :title="t('language.title')" back />

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
import { useI18n } from 'vue-i18n'
import BlHeader from '../../components/BlHeader.vue'
import { ensureMeState, updateSettings } from '../../utils/meStore'
import { LANGUAGE_OPTIONS, applyAppLanguage, normalizeLanguagePreference } from '../../utils/i18n'

const state = ref(ensureMeState())
const { t } = useI18n()

const options = computed(() => LANGUAGE_OPTIONS.map((item) => ({
  ...item,
  label: item.value === 'system' ? t('language.followSystem') : item.label,
})))

onShow(() => {
  state.value = ensureMeState()
})

const current = computed(() => {
  const v = state.value.settings && state.value.settings.language ? state.value.settings.language : 'system'
  return normalizeLanguagePreference(v)
})

function select(v) {
  const s = ensureMeState()
  const next = normalizeLanguagePreference(v)
  updateSettings(s, { language: next })
  applyAppLanguage(next)
  state.value = ensureMeState()
  uni.showToast({ title: t('language.switched'), icon: 'none' })
}
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: #ffffff;
  padding: 0 28rpx;
}

.list {
  margin-top: 28rpx;
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
