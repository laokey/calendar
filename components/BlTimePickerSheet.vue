<template>
  <BlSheet v-model="open" :title="title" :confirm-text="confirmText" @confirm="confirm">
    <picker-view class="pv" :value="indices" indicator-style="height: 84rpx;" @change="onChange">
      <picker-view-column class="col">
        <view v-for="h in hours" :key="h" class="pv-item"><text class="pv-text">{{ h }}</text></view>
      </picker-view-column>
      <picker-view-column class="col">
        <view v-for="m in minutes" :key="m" class="pv-item"><text class="pv-text">{{ m }}</text></view>
      </picker-view-column>
    </picker-view>
  </BlSheet>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import BlSheet from './BlSheet.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '时间' },
  value: { type: String, default: '' },
  confirmText: { type: String, default: '确定' },
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const open = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))

const indices = ref([0, 0])

function parseValue(t) {
  const parts = String(t || '').split(':')
  if (parts.length !== 2) return null
  return { h: parts[0], m: parts[1] }
}

function syncIndicesByValue(t) {
  const parsed = parseValue(t)
  const h = parsed ? parsed.h : '00'
  const m = parsed ? parsed.m : '00'
  const hIdx = Math.max(0, hours.indexOf(h))
  const mIdx = Math.max(0, minutes.indexOf(m))
  indices.value = [hIdx, mIdx]
}

watch(
  () => props.modelValue,
  (v) => {
    if (!v) return
    syncIndicesByValue(props.value)
  },
)

function onChange(e) {
  const v = e && e.detail ? e.detail.value : []
  if (!Array.isArray(v) || v.length < 2) return
  indices.value = [v[0], v[1]]
}

function confirm() {
  const h = hours[indices.value[0]] || '00'
  const m = minutes[indices.value[1]] || '00'
  emit('confirm', `${h}:${m}`)
  open.value = false
}
</script>

<style scoped lang="scss">
.pv {
  width: 100%;
  height: 420rpx;
  margin-top: 6rpx;
}

.col {
  flex: 1;
}

.pv-item {
  height: 84rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pv-text {
  font-size: 34rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.88);
}
</style>
