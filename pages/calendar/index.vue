<template>
  <view class="cal-page" :style="{ paddingTop: safeTop + 'px' }">
    <view class="topbar">
      <view class="icon-btn" @click="back">
        <image class="icon-img is-back" src="/static/calendar/icon_nav_back_small.png" mode="aspectFit" />
      </view>
      <text class="range">{{ rangeText }}</text>
      <view class="icon-btn" @click="openMembers">
        <image class="icon-img is-user" src="/static/calendar/icon_nav_members.png" mode="aspectFit" />
      </view>
    </view>

    <view class="switcher">
      <view class="icon-btn" @click="prev">
        <image class="icon-img is-nav" src="/static/calendar/icon_nav_prev_circle.png" mode="aspectFit" />
      </view>
      <view class="seg-wrap">
        <BlSegmented v-model="viewMode" :options="modeOptions" />
      </view>
      <view class="icon-btn" @click="next">
        <image class="icon-img is-nav" src="/static/calendar/icon_nav_next_circle.png" mode="aspectFit" />
      </view>
    </view>

    <view v-if="viewMode === 'month'" class="month">
      <view class="weekdays">
        <text v-for="w in weekdays" :key="w" class="wd">{{ w }}</text>
      </view>
      <view class="grid">
        <view v-for="(row, rIdx) in monthRows" :key="rIdx" class="row">
          <view
            v-for="d in row"
            :key="d.key"
            class="cell"
            :class="{ muted: !d.inMonth, selected: d.key === cursorDateKey, today: d.isToday }"
            @click="onMonthCellClick(d)"
          >
            <view class="day">
              <text class="day-num">{{ d.day }}</text>
            </view>
            <view class="chips">
              <view
                v-for="ev in d.events"
                :key="ev.id"
                class="chip"
                :style="{ background: monthEventChipBg(ev) }"
                @click.stop="openEvent(ev.id)"
              >
                <text class="chip-text" :style="{ color: monthEventChipTextColor(ev) }">{{ ev.title }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <view v-else class="week">
      <view v-for="day in weekList" :key="day.key" class="day-row" @click="onWeekDayRowClick(day)">
        <view class="left">
          <text class="left-wd">{{ day.weekday }}</text>
          <view class="date-pill" :class="{ 'is-active': day.isToday }">
            <text class="date-pill-text">{{ day.date }}</text>
          </view>
        </view>
        <view class="right">
          <template v-if="day.events && day.events.length">
            <view v-for="ev in day.events" :key="ev.id" class="event" :style="{ background: eventCardBg(ev) }" @click="openEvent(ev.id)">
              <view class="event-left">
                <text class="event-title">{{ ev.title }}</text>
                <view class="event-time">
                  <image class="clock" src="/static/calendar/icon_form_clock.png" mode="aspectFit" />
                  <text class="event-time-text">{{ ev.allDay ? '全天' : `${ev.startTime || ''}–${ev.endTime || ''}` }}</text>
                </view>
              </view>
              <view class="event-right">
                <view v-if="ev.memberIds && ev.memberIds.length > 1" class="avatars">
                  <BlAvatar
                    v-for="mid in ev.memberIds.slice(0, 4)"
                    :key="mid"
                    class="member-avatar"
                    :glyph="memberGlyph(mid)"
                    :color="memberColor(mid)"
                    :src="memberAvatar(mid)"
                    :size="54"
                  />
                </view>
              <BlAvatar
                v-else
                class="member-avatar"
                :glyph="memberGlyph(ev.memberIds && ev.memberIds[0])"
                :color="memberColor(ev.memberIds && ev.memberIds[0])"
                :src="memberAvatar(ev.memberIds && ev.memberIds[0])"
                :size="58"
              />
              </view>
            </view>
          </template>
          <view v-else class="event event-empty" @click.stop="addEventFor(day.key)">
            <text class="event-empty-text">无活动</text>
          </view>
        </view>
      </view>
    </view>

    <view class="fab" @click="addEvent">
      <image class="fab-img" src="/static/common/btn_fab_add.png" mode="aspectFit" />
    </view>
  </view>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import BlSegmented from '../../components/BlSegmented.vue'
import BlAvatar from '../../components/BlAvatar.vue'
import {
  ensureCalendarState,
  eventsForDate,
  listMembers,
  monthMatrix,
  setCalendarCursorDate,
  setCalendarViewMode,
  weekDays,
  weekRangeText,
  dayLabel,
} from '../../utils/calendarStore'

const state = ref(ensureCalendarState())
const members = ref(listMembers(state.value))

const safeTop = computed(() => {
  const sys = uni.getSystemInfoSync()
  const insets = sys && sys.safeAreaInsets ? sys.safeAreaInsets : null
  return insets && typeof insets.top === 'number' ? insets.top : 0
})

const modeOptions = [
  { label: '月', value: 'month' },
  { label: '周', value: 'week' },
]

const viewMode = ref(state.value.viewMode || 'month')
const cursorDateKey = ref(state.value.cursorDate)

const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

const rangeText = computed(() => {
  if (viewMode.value === 'month') {
    const d = parseKey(cursorDateKey.value)
    return `${d.getFullYear()}年-${String(d.getMonth() + 1).padStart(2, '0')}月`
  }
  return weekRangeText(cursorDateKey.value)
})

function parseKey(key) {
  const parts = String(key || '').split('-')
  if (parts.length !== 3) return new Date()
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
}

function formatKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function todayKey() {
  return formatKey(new Date())
}

watch(viewMode, (v) => {
  state.value = setCalendarViewMode(state.value, v)
})

watch(cursorDateKey, (v) => {
  state.value = setCalendarCursorDate(state.value, v)
})

function refreshMembers() {
  members.value = listMembers(state.value)
}

onMounted(() => {
  cursorDateKey.value = todayKey()
  refreshMembers()
})

const monthRows = computed(() => {
  const rows = monthMatrix(cursorDateKey.value)
  const cursor = parseKey(cursorDateKey.value)
  const m = cursor.getMonth()
  const tKey = todayKey()
  return rows.map((r) =>
    r.map((d) => {
      const key = formatKey(d)
      return {
        key,
        day: d.getDate(),
        inMonth: d.getMonth() === m,
        events: eventsForDate(state.value, key).slice(0, 3),
        isToday: key === tKey,
      }
    }),
  )
})

const weekList = computed(() => {
  const days = weekDays(cursorDateKey.value)
  const tKey = todayKey()
  return days.map((d) => {
    const key = formatKey(d)
    const label = dayLabel(d)
    return {
      key,
      weekday: label.weekday,
      date: label.date,
      events: eventsForDate(state.value, key),
      isToday: key === tKey,
    }
  })
})

function setCursor(key) {
  cursorDateKey.value = key
}

function onMonthCellClick(d) {
  if (!d || !d.key) return
  if (!d.events || !d.events.length) {
    addEventFor(d.key)
    return
  }
  setCursor(d.key)
}

function onWeekDayRowClick(day) {
  if (!day || !day.key) return
  if (!day.events || !day.events.length) addEventFor(day.key)
}

function shiftWeek(deltaWeeks) {
  const d = parseKey(cursorDateKey.value)
  d.setDate(d.getDate() + 7 * deltaWeeks)
  setCursor(formatKey(d))
}

function shiftMonth(deltaMonths) {
  const d = parseKey(cursorDateKey.value)
  const day = d.getDate()
  const target = new Date(d.getFullYear(), d.getMonth() + deltaMonths, 1)
  const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
  target.setDate(Math.min(day, last))
  setCursor(formatKey(target))
}

function prev() {
  if (viewMode.value === 'month') {
    shiftMonth(-1)
    return
  }
  shiftWeek(-1)
}

function next() {
  if (viewMode.value === 'month') {
    shiftMonth(1)
    return
  }
  shiftWeek(1)
}

function back() {
  uni.navigateBack()
}

function addEvent() {
  addEventFor(cursorDateKey.value)
}

function addEventFor(dateKey) {
  uni.navigateTo({ url: `/pages/calendar/event-form?date=${dateKey}` })
}

function openEvent(id) {
  uni.navigateTo({ url: `/pages/calendar/event-detail?id=${id}` })
}

function openMembers() {
  uni.navigateTo({ url: '/pages/calendar/members' })
}

function memberGlyph(id) {
  const m = (members.value || []).find((x) => x.id === id)
  return m ? m.glyph : ''
}

function memberColor(id) {
  const m = (members.value || []).find((x) => x.id === id)
  return m ? m.color : '#3d6afb'
}

function memberAvatar(id) {
  const m = (members.value || []).find((x) => x.id === id)
  return m && m.avatarUrl ? m.avatarUrl : ''
}

function rgbaFromColor(color, alpha) {
  const c = String(color || '').trim()
  if (!c) return `rgba(61, 106, 251, ${alpha})`
  if (c.startsWith('rgba(')) {
    const inner = c.slice(5, -1)
    const parts = inner.split(',').map((x) => x.trim())
    if (parts.length >= 3) return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${alpha})`
    return c
  }
  if (c.startsWith('rgb(')) {
    const inner = c.slice(4, -1)
    const parts = inner.split(',').map((x) => x.trim())
    if (parts.length >= 3) return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${alpha})`
    return c
  }
  if (c[0] === '#') {
    let hex = c.slice(1)
    if (hex.length === 3) {
      hex = hex
        .split('')
        .map((x) => x + x)
        .join('')
    }
    if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16)
      const g = parseInt(hex.slice(2, 4), 16)
      const b = parseInt(hex.slice(4, 6), 16)
      if (Number.isFinite(r) && Number.isFinite(g) && Number.isFinite(b)) return `rgba(${r}, ${g}, ${b}, ${alpha})`
    }
  }
  return c
}

function eventCardBg(ev) {
  const ids = ev && Array.isArray(ev.memberIds) ? ev.memberIds.filter(Boolean) : []
  if (ids.length === 1) return rgbaFromColor(memberColor(ids[0]), 0.1)
  return 'rgba(17, 17, 17, 0.04)'
}

function monthEventChipBg(ev) {
  const ids = ev && Array.isArray(ev.memberIds) ? ev.memberIds.filter(Boolean) : []
  if (ids.length === 1) return rgbaFromColor(memberColor(ids[0]), 0.5)
  return 'rgba(17, 17, 17, 0.5)'
}

function monthEventChipTextColor(ev) {
  return '#ffffff'
}

uni.$on && uni.$on('calendar:refresh', () => {
  state.value = ensureCalendarState()
  viewMode.value = state.value.viewMode || 'month'
  cursorDateKey.value = state.value.cursorDate
  refreshMembers()
})
</script>

<style scoped lang="scss">
.cal-page {
  padding: 18rpx 28rpx 220rpx;
  background: #ffffff;
  min-height: 100vh;
  box-sizing: border-box;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10rpx 0 12rpx;
}

.range {
  font-size: 40rpx;
  font-weight: 900;
}

.icon-btn {
  width: 72rpx;
  height: 72rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon {
  font-size: 56rpx;
  font-weight: 700;
  line-height: 1;
}

.icon-img {
  display: block;
}

.icon-img.is-back {
  width: 34rpx;
  height: 34rpx;
}

.icon-img.is-user {
  width: 38rpx;
  height: 38rpx;
}

.icon-img.is-nav {
  width: 58rpx;
  height: 58rpx;
}

.switcher {
  margin-top: 8rpx;
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.seg-wrap {
  flex: 1;
}

.month {
  margin-top: 18rpx;
  background: #ffffff;
  border-radius: 28rpx;
  overflow: hidden;
  box-shadow: 0 10rpx 26rpx rgba(17, 17, 17, 0.06);
}

.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  padding: 18rpx 16rpx 12rpx;
  gap: 10rpx;
}

.wd {
  text-align: center;
  font-size: 24rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.7);
}

.grid {
  padding: 0 10rpx 12rpx;
}

.row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8rpx;
  padding: 12rpx 6rpx;
  border-top: 1rpx solid rgba(17, 17, 17, 0.05);
}

.row:first-child {
  border-top: none;
}

.cell {
  min-height: 140rpx;
}

.cell.muted .day-num {
  color: rgba(17, 17, 17, 0.9);
}

.cell.selected .day-num {
  color: rgba(17, 17, 17, 0.9);
}

.cell.today .day {
  background: rgba(61, 106, 251, 0.14);
}

.cell.today .day-num {
  color: #3d6afb;
}

.day {
  width: 62rpx;
  height: 62rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 8rpx;
}

.day-num {
  font-size: 26rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.9);
}

.chips {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  padding: 0 4rpx;
}

.chip {
  height: 34rpx;
  border-radius: 10rpx;
  padding: 0 8rpx;
  display: flex;
  align-items: center;
}

.chip-text {
  font-size: 20rpx;
  font-weight: 900;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.week {
  margin-top: 16rpx;
}

.day-row {
  display: flex;
  gap: 16rpx;
  margin-top: 18rpx;
}

.day-row:first-child {
  margin-top: 8rpx;
}

.left {
  width: 96rpx;
  padding-top: 16rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6rpx;
}

.left-wd {
  font-size: 24rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.7);
}

.left-date {
  font-size: 30rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.9);
}

.date-pill {
  min-width: 62rpx;
  height: 62rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.date-pill.is-active {
  background: rgba(61, 106, 251, 0.14);
}

.date-pill-text {
  font-size: 30rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.9);
}

.date-pill.is-active .date-pill-text {
  color: #3d6afb;
}

.right {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.event {
  border-radius: 22rpx;
  padding: 20rpx 22rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.event.event-empty {
  min-height: 104rpx;
  background: rgba(17, 17, 17, 0.04);
}

.event-empty-text {
  font-size: 28rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.45);
}

.event-title {
  font-size: 30rpx;
  font-weight: 900;
}

.event-time {
  margin-top: 8rpx;
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.clock {
  width: 26rpx;
  height: 26rpx;
  display: block;
}

.event-time-text {
  font-size: 26rpx;
  font-weight: 700;
  color: rgba(17, 17, 17, 0.55);
}

.avatars {
  display: flex;
  align-items: center;
  gap: 0;
}

.member-avatar {
  border: 4rpx solid #ffffff;
  box-sizing: border-box;
}

.member-avatar + .member-avatar {
  margin-left: -14rpx;
}

.fab {
  position: fixed;
  right: 34rpx;
  bottom: 120rpx;
  width: 152rpx;
  height: 96rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fab-img {
  width: 152rpx;
  height: 96rpx;
  display: block;
}
</style>
