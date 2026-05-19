<template>
  <BlSheet v-model="open" :title="title" :confirm-text="confirmText" @confirm="confirm">
    <picker-view class="pv" :value="indices" indicator-style="height: 84rpx;" @change="onChange">
      <picker-view-column class="col">
        <view v-for="y in years" :key="y" class="pv-item"><text class="pv-text">{{ y }}</text></view>
      </picker-view-column>
      <picker-view-column class="col">
        <view v-for="m in months" :key="m" class="pv-item"><text class="pv-text">{{ m }}</text></view>
      </picker-view-column>
      <picker-view-column class="col">
        <view v-for="d in days" :key="d" class="pv-item"><text class="pv-text">{{ d }}</text></view>
      </picker-view-column>
    </picker-view>
  </BlSheet>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import BlSheet from './BlSheet.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
  value: { type: String, default: '' },
  confirmText: { type: String, default: '确定' },
  startYear: { type: Number, default: 2020 },
  yearCount: { type: Number, default: 21 },
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const open = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const years = computed(() => Array.from({ length: Math.max(1, props.yearCount) }, (_, i) => props.startYear + i))
const months = computed(() => Array.from({ length: 12 }, (_, i) => i + 1))

const indices = ref([0, 0, 0])

const days = computed(() => {
  const y = years.value[indices.value[0]] || new Date().getFullYear()
  const m = months.value[indices.value[1]] || 1
  const last = new Date(y, m, 0).getDate()
  return Array.from({ length: last }, (_, i) => i + 1)
})

function parseKey(key) {
  const parts = String(key || '').split('-')
  if (parts.length !== 3) return null
  const y = Number(parts[0])
  const m = Number(parts[1])
  const d = Number(parts[2])
  if (!y || !m || !d) return null
  return { y, m, d }
}

function formatKey(y, m, d) {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function syncIndicesByKey(key) {
  const parsed = parseKey(key)
  const now = new Date()
  const y = parsed ? parsed.y : now.getFullYear()
  const m = parsed ? parsed.m : now.getMonth() + 1
  const d = parsed ? parsed.d : now.getDate()

  const yIdx = Math.max(0, years.value.indexOf(y))
  const mIdx = Math.max(0, months.value.indexOf(m))
  const last = new Date(y, m, 0).getDate()
  const day = Math.min(Math.max(1, d), last)
  indices.value = [yIdx, mIdx, day - 1]
}

watch(
  () => props.modelValue,
  (v) => {
    if (!v) return
    syncIndicesByKey(props.value)
  },
)

function onChange(e) {
  const v = e && e.detail ? e.detail.value : []
  if (!Array.isArray(v) || v.length < 3) return
  const yIdx = v[0]
  const mIdx = v[1]
  const dIdx = v[2]
  indices.value = [yIdx, mIdx, dIdx]

  const y = years.value[yIdx] || new Date().getFullYear()
  const m = months.value[mIdx] || 1
  const last = new Date(y, m, 0).getDate()
  if (dIdx > last - 1) indices.value = [yIdx, mIdx, last - 1]
}

function confirm() {
  const y = years.value[indices.value[0]] || new Date().getFullYear()
  const m = months.value[indices.value[1]] || 1
  const d = days.value[indices.value[2]] || 1
  emit('confirm', formatKey(y, m, d))
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
