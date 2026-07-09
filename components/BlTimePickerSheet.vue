<template>
  <BlSheet v-model="open" :title="title" :confirm-text="confirmText" @confirm="confirm">
    <view
      class="tp"
      :style="{
        '--tp-item-height': `${itemHeightPx}px`,
        '--tp-viewport-height': `${viewportHeightPx}px`,
        '--tp-spacer-height': `${spacerHeightPx}px`,
      }"
    >
      <view class="tp-indicator" />
      <view class="tp-inner">
        <scroll-view
          class="tp-col"
          scroll-y
          :scroll-top="hourScrollTop"
          :show-scrollbar="false"
          @scroll="onScroll('hour', $event)"
        >
          <view class="tp-spacer" />
          <view
            v-for="(h, idx) in hours"
            :key="h"
            class="tp-item"
            :class="{ active: indices[0] === idx }"
            @click="pick('hour', idx)"
          >
            {{ h }}
          </view>
          <view class="tp-spacer" />
        </scroll-view>

        <view class="tp-sep">:</view>

        <scroll-view
          class="tp-col"
          scroll-y
          :scroll-top="minuteScrollTop"
          :show-scrollbar="false"
          @scroll="onScroll('minute', $event)"
        >
          <view class="tp-spacer" />
          <view
            v-for="(m, idx) in minutes"
            :key="m"
            class="tp-item"
            :class="{ active: indices[1] === idx }"
            @click="pick('minute', idx)"
          >
            {{ m }}
          </view>
          <view class="tp-spacer" />
        </scroll-view>
      </view>
    </view>
  </BlSheet>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
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

const ITEM_HEIGHT_RPX = 84
const VISIBLE_ROWS = 5
const SNAP_DELAY = 90

function rpxToPx(rpx) {
  const sys = uni.getSystemInfoSync()
  const ww = sys && typeof sys.windowWidth === 'number' ? sys.windowWidth : 375
  return Math.round((ww / 750) * rpx)
}

const itemHeightPx = rpxToPx(ITEM_HEIGHT_RPX)
const viewportHeightPx = itemHeightPx * VISIBLE_ROWS
const spacerHeightPx = itemHeightPx * Math.floor(VISIBLE_ROWS / 2)

const indices = ref([0, 0])
const hourScrollTop = ref(0)
const minuteScrollTop = ref(0)
const hourLockUntil = ref(0)
const minuteLockUntil = ref(0)
const hourLastTop = ref(0)
const minuteLastTop = ref(0)
let hourTimer = null
let minuteTimer = null

function parseValue(t) {
  const parts = String(t || '').split(':')
  if (parts.length !== 2) return null
  return { h: parts[0], m: parts[1] }
}

function clampIndex(kind, idx) {
  const max = kind === 'hour' ? hours.length - 1 : minutes.length - 1
  const safe = Number.isFinite(idx) ? Math.round(idx) : 0
  return Math.max(0, Math.min(max, safe))
}

function applyIndex(kind, idx) {
  const safe = clampIndex(kind, idx)
  if (kind === 'hour') indices.value = [safe, indices.value[1]]
  else indices.value = [indices.value[0], safe]
  return safe
}

function setColumnTop(kind, idx) {
  const top = clampIndex(kind, idx) * itemHeightPx
  const lockUntil = Date.now() + 160
  if (kind === 'hour') {
    hourLockUntil.value = lockUntil
    hourLastTop.value = top
    hourScrollTop.value = top
  } else {
    minuteLockUntil.value = lockUntil
    minuteLastTop.value = top
    minuteScrollTop.value = top
  }
}

function syncIndicesByValue(t) {
  const parsed = parseValue(t)
  const h = parsed ? parsed.h : '00'
  const m = parsed ? parsed.m : '00'
  const hIdx = Math.max(0, hours.indexOf(h))
  const mIdx = Math.max(0, minutes.indexOf(m))
  indices.value = [hIdx, mIdx]
  setColumnTop('hour', hIdx)
  setColumnTop('minute', mIdx)
}

function snap(kind) {
  const top = kind === 'hour' ? hourLastTop.value : minuteLastTop.value
  const idx = applyIndex(kind, top / itemHeightPx)
  setColumnTop(kind, idx)
}

function scheduleSnap(kind) {
  if (kind === 'hour') {
    if (hourTimer) clearTimeout(hourTimer)
    hourTimer = setTimeout(() => snap('hour'), SNAP_DELAY)
  } else {
    if (minuteTimer) clearTimeout(minuteTimer)
    minuteTimer = setTimeout(() => snap('minute'), SNAP_DELAY)
  }
}

function onScroll(kind, e) {
  const top = e && e.detail && typeof e.detail.scrollTop === 'number' ? e.detail.scrollTop : 0
  if (kind === 'hour') hourLastTop.value = top
  else minuteLastTop.value = top

  const lockUntil = kind === 'hour' ? hourLockUntil.value : minuteLockUntil.value
  if (Date.now() < lockUntil) return

  applyIndex(kind, top / itemHeightPx)
  scheduleSnap(kind)
}

function pick(kind, idx) {
  applyIndex(kind, idx)
  setColumnTop(kind, idx)
}

watch(
  () => props.modelValue,
  async (v) => {
    if (!v) return
    await nextTick()
    syncIndicesByValue(props.value)
  },
)

function confirm() {
  const h = hours[indices.value[0]] || '00'
  const m = minutes[indices.value[1]] || '00'
  emit('confirm', `${h}:${m}`)
  open.value = false
}
</script>

<style scoped lang="scss">
.tp {
  position: relative;
  width: 100%;
  display: flex;
  justify-content: center;
  padding-top: 8rpx;
}

.tp-inner {
  position: relative;
  width: 440rpx;
  height: var(--tp-viewport-height);
  display: flex;
  align-items: stretch;
}

.tp-col {
  flex: 1;
  height: 100%;
}

.tp-spacer {
  height: var(--tp-spacer-height);
  flex-shrink: 0;
}

.tp-item {
  height: var(--tp-item-height);
  line-height: var(--tp-item-height);
  text-align: center;
  font-size: 34rpx;
  font-weight: 700;
  color: rgba(17, 17, 17, 0.28);
  font-variant-numeric: tabular-nums;
  transition: color 0.16s ease;
}

.tp-item.active {
  color: rgba(17, 17, 17, 0.92);
  font-weight: 900;
}

.tp-indicator {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 440rpx;
  height: var(--tp-item-height);
  transform: translate(-50%, -50%);
  border-top: 1rpx solid #ececec;
  border-bottom: 1rpx solid #ececec;
  pointer-events: none;
  z-index: 2;
}

.tp-sep {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 24rpx;
  height: var(--tp-item-height);
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 34rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.92);
  font-variant-numeric: tabular-nums;
  pointer-events: none;
  z-index: 3;
}
</style>
