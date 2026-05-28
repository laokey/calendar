<template>
  <BlSheet v-model="open" :title="title" :confirm-text="confirmText" @confirm="confirm">
    <view class="cal" @touchstart="onCalTouchStart" @touchmove.stop="onCalTouchMove" @touchend="onCalTouchEnd">
      <view class="cal-head">
        <view class="nav-btn" @click="prevMonth"><text class="nav-text">‹</text></view>
        <text class="cal-title">{{ cursorTitle }}</text>
        <view class="nav-btn" @click="nextMonth"><text class="nav-text">›</text></view>
      </view>

      <view class="week-row">
        <text v-for="w in weekLabels" :key="w" class="week-text">{{ w }}</text>
      </view>

      <view class="grid">
        <view
          v-for="cell in gridCells"
          :key="cell.key"
          class="cell"
          @click="pickCell(cell)"
        >
          <view class="cell-inner" :class="{ on: cell.key === selectedKey }">
            <text
              class="day-text"
              :class="{
                on: cell.key === selectedKey,
                off: !cell.inMonth,
                disabled: cell.disabled,
              }"
              >{{ cell.d }}</text>
          </view>
        </view>
      </view>
    </view>
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

const minYear = computed(() => props.startYear)
const maxYear = computed(() => props.startYear + Math.max(1, props.yearCount) - 1)

const cursorY = ref(new Date().getFullYear())
const cursorM = ref(new Date().getMonth() + 1)
const selectedKey = ref('')
const calTouchStartX = ref(0)
const calTouchStartY = ref(0)
const calLocked = ref('')
const calMoved = ref(false)
const suppressPickUntil = ref(0)

const weekLabels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

const cursorTitle = computed(() => `${cursorY.value}年${cursorM.value}月`)

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

function touchPoint(e) {
  const t = e && e.touches && e.touches[0] ? e.touches[0] : null
  if (t && typeof t.clientX === 'number') return { x: t.clientX, y: t.clientY }
  const c = e && e.changedTouches && e.changedTouches[0] ? e.changedTouches[0] : null
  if (c && typeof c.clientX === 'number') return { x: c.clientX, y: c.clientY }
  return { x: 0, y: 0 }
}

function onCalTouchStart(e) {
  const p = touchPoint(e)
  calTouchStartX.value = p.x
  calTouchStartY.value = p.y
  calLocked.value = ''
  calMoved.value = false
}

function onCalTouchMove(e) {
  const p = touchPoint(e)
  const dx = p.x - calTouchStartX.value
  const dy = p.y - calTouchStartY.value
  const ax = Math.abs(dx)
  const ay = Math.abs(dy)
  if (!calLocked.value) {
    if (ax >= 10 || ay >= 10) {
      calLocked.value = ax >= ay ? 'x' : 'y'
    }
  }
  if (calLocked.value === 'x' && ax >= 10) calMoved.value = true
}

function onCalTouchEnd(e) {
  if (calLocked.value !== 'x' || !calMoved.value) return
  const p = touchPoint(e)
  const dx = p.x - calTouchStartX.value
  const adx = Math.abs(dx)
  const threshold = 56
  if (adx < threshold) return
  suppressPickUntil.value = Date.now() + 350
  if (dx < 0) nextMonth()
  else prevMonth()
}

function clampCursor() {
  if (cursorY.value < minYear.value) cursorY.value = minYear.value
  if (cursorY.value > maxYear.value) cursorY.value = maxYear.value
  if (cursorM.value < 1) cursorM.value = 1
  if (cursorM.value > 12) cursorM.value = 12
}

function syncByKey(key) {
  const parsed = parseKey(key)
  const now = new Date()
  const y = parsed ? parsed.y : now.getFullYear()
  const m = parsed ? parsed.m : now.getMonth() + 1
  const d = parsed ? parsed.d : now.getDate()
  const last = new Date(y, m, 0).getDate()
  const day = Math.min(Math.max(1, d), last)

  const yy = Math.min(Math.max(minYear.value, y), maxYear.value)
  cursorY.value = yy
  cursorM.value = m
  clampCursor()
  selectedKey.value = formatKey(cursorY.value, cursorM.value, day)
}

watch(
  () => [props.modelValue, props.value],
  ([v]) => {
    if (!v) return
    syncByKey(props.value)
  },
)

function prevMonth() {
  let y = cursorY.value
  let m = cursorM.value - 1
  if (m <= 0) {
    y -= 1
    m = 12
  }
  if (y < minYear.value) return
  cursorY.value = y
  cursorM.value = m
  clampCursor()
}

function nextMonth() {
  let y = cursorY.value
  let m = cursorM.value + 1
  if (m >= 13) {
    y += 1
    m = 1
  }
  if (y > maxYear.value) return
  cursorY.value = y
  cursorM.value = m
  clampCursor()
}

const gridCells = computed(() => {
  const y = cursorY.value
  const m = cursorM.value
  const first = new Date(y, m - 1, 1)
  const firstDow = first.getDay()
  const daysInMonth = new Date(y, m, 0).getDate()
  const prevDays = new Date(y, m - 1, 0).getDate()

  const out = []
  const prevCount = firstDow
  for (let i = prevCount; i > 0; i -= 1) {
    const d = prevDays - i + 1
    let py = y
    let pm = m - 1
    if (pm <= 0) {
      py -= 1
      pm = 12
    }
    out.push({
      y: py,
      m: pm,
      d,
      key: formatKey(py, pm, d),
      inMonth: false,
      disabled: py < minYear.value || py > maxYear.value,
    })
  }

  for (let d = 1; d <= daysInMonth; d += 1) {
    out.push({ y, m, d, key: formatKey(y, m, d), inMonth: true, disabled: false })
  }

  const remain = 42 - out.length
  for (let d = 1; d <= remain; d += 1) {
    let ny = y
    let nm = m + 1
    if (nm >= 13) {
      ny += 1
      nm = 1
    }
    out.push({
      y: ny,
      m: nm,
      d,
      key: formatKey(ny, nm, d),
      inMonth: false,
      disabled: ny < minYear.value || ny > maxYear.value,
    })
  }

  return out
})

function pickCell(cell) {
  if (!cell) return
  if (Date.now() < suppressPickUntil.value) return
  if (cell.disabled) return
  selectedKey.value = cell.key
  if (!cell.inMonth) {
    cursorY.value = cell.y
    cursorM.value = cell.m
    clampCursor()
  }
}

function confirm() {
  if (!selectedKey.value) syncByKey(props.value)
  emit('confirm', selectedKey.value)
  open.value = false
}
</script>

<style scoped lang="scss">
.cal {
  padding-top: 6rpx;
}

.cal-head {
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.nav-btn {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  top: 4rpx;
}

.nav-btn:first-child {
  left: 0;
}

.nav-btn:last-child {
  right: 0;
}

.nav-text {
  font-size: 44rpx;
  font-weight: 900;
  line-height: 1;
  color: rgba(17, 17, 17, 0.62);
}

.cal-title {
  font-size: 28rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.88);
}

.week-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-top: 10rpx;
}

.week-text {
  height: 52rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22rpx;
  font-weight: 700;
  color: rgba(17, 17, 17, 0.36);
}

.grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-auto-rows: 70rpx;
  gap: 0;
  margin-top: 6rpx;
}

.cell {
  display: flex;
  align-items: center;
  justify-content: center;
}

.cell-inner {
  width: 52rpx;
  height: 52rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cell-inner.on {
  background: #3d6afb;
}

.day-text {
  font-size: 24rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.78);
}

.day-text.off {
  color: rgba(17, 17, 17, 0.32);
}

.day-text.disabled {
  color: rgba(17, 17, 17, 0.18);
}

.day-text.on {
  color: #ffffff;
}
</style>
