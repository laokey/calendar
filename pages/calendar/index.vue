<template>
  <view class="cal-page" :style="{ paddingTop: safeTop + 'px' }">
    <view class="topbar">
      <view class="icon-btn" @click="back">
        <text class="icon">‹</text>
      </view>
      <text class="range">{{ rangeText }}</text>
      <view class="icon-btn" @click="openMembers">
        <text class="icon-user">人</text>
      </view>
    </view>

    <view class="switcher">
      <view class="icon-btn is-soft" @click="prev">
        <text class="icon-sm">‹</text>
      </view>
      <view class="seg-wrap">
        <BlSegmented v-model="viewMode" :options="modeOptions" />
      </view>
      <view class="icon-btn is-soft" @click="next">
        <text class="icon-sm">›</text>
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
            :class="{ muted: !d.inMonth, selected: d.key === cursorDateKey }"
            @click="setCursor(d.key)"
          >
            <view class="day">
              <text class="day-num">{{ d.day }}</text>
            </view>
            <view class="chips">
              <view
                v-for="ev in d.events"
                :key="ev.id"
                class="chip"
                :style="{ background: ev.tagColor || '#4c8dff' }"
                @click.stop="openEvent(ev.id)"
              >
                <text class="chip-text">{{ ev.title }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <view v-else class="week">
      <view v-for="day in weekList" :key="day.key" class="day-row">
        <view class="left">
          <text class="left-wd">{{ day.weekday }}</text>
          <text class="left-date">{{ day.date }}</text>
        </view>
        <view class="right">
          <view v-for="ev in day.events" :key="ev.id" class="event" :style="{ background: ev.color || '#ffffff' }" @click="openEvent(ev.id)">
            <view class="event-left">
              <text class="event-title">{{ ev.title }}</text>
              <view class="event-time">
                <view class="clock" />
                <text class="event-time-text">{{ ev.allDay ? '全天' : `${ev.startTime || ''}–${ev.endTime || ''}` }}</text>
              </view>
            </view>
            <view class="event-right">
              <view v-if="ev.memberIds && ev.memberIds.length > 1" class="avatars">
                <BlAvatar
                  v-for="mid in ev.memberIds.slice(0, 4)"
                  :key="mid"
                  :glyph="memberGlyph(mid)"
                  :color="memberColor(mid)"
                  :size="54"
                />
              </view>
              <BlAvatar v-else :glyph="memberGlyph(ev.memberIds && ev.memberIds[0])" :color="memberColor(ev.memberIds && ev.memberIds[0])" :size="58" />
            </view>
          </view>
        </view>
      </view>
    </view>

    <view class="fab" @click="addEvent">
      <text class="fab-plus">+</text>
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

const rangeText = computed(() => weekRangeText(cursorDateKey.value))

function parseKey(key) {
  const parts = String(key || '').split('-')
  if (parts.length !== 3) return new Date()
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
}

function formatKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
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
  refreshMembers()
})

const monthRows = computed(() => {
  const rows = monthMatrix(cursorDateKey.value)
  const cursor = parseKey(cursorDateKey.value)
  const m = cursor.getMonth()
  return rows.map((r) =>
    r.map((d) => {
      const key = formatKey(d)
      return {
        key,
        day: d.getDate(),
        inMonth: d.getMonth() === m,
        events: eventsForDate(state.value, key).slice(0, 3),
      }
    }),
  )
})

const weekList = computed(() => {
  const days = weekDays(cursorDateKey.value)
  return days.map((d) => {
    const key = formatKey(d)
    const label = dayLabel(d)
    return {
      key,
      weekday: label.weekday,
      date: label.date,
      events: eventsForDate(state.value, key),
    }
  })
})

function setCursor(key) {
  cursorDateKey.value = key
}

function prev() {
  const d = parseKey(cursorDateKey.value)
  d.setDate(d.getDate() - 7)
  setCursor(formatKey(d))
}

function next() {
  const d = parseKey(cursorDateKey.value)
  d.setDate(d.getDate() + 7)
  setCursor(formatKey(d))
}

function back() {
  uni.navigateBack()
}

function addEvent() {
  uni.navigateTo({ url: `/pages/calendar/event-form?date=${cursorDateKey.value}` })
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

.icon-btn.is-soft {
  background: rgba(17, 17, 17, 0.04);
}

.icon {
  font-size: 56rpx;
  font-weight: 700;
  line-height: 1;
}

.icon-sm {
  font-size: 48rpx;
  font-weight: 700;
  line-height: 1;
}

.icon-user {
  font-size: 34rpx;
  font-weight: 900;
  line-height: 1;
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
  color: rgba(17, 17, 17, 0.25);
}

.cell.selected .day-num {
  color: #3d6afb;
}

.day {
  display: flex;
  justify-content: center;
  margin-bottom: 8rpx;
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
  border-radius: 999rpx;
  border: 3rpx solid rgba(17, 17, 17, 0.55);
}

.event-time-text {
  font-size: 26rpx;
  font-weight: 700;
  color: rgba(17, 17, 17, 0.55);
}

.avatars {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.fab {
  position: fixed;
  right: 34rpx;
  bottom: 120rpx;
  width: 116rpx;
  height: 116rpx;
  border-radius: 999rpx;
  background: #3d6afb;
  box-shadow: 0 18rpx 36rpx rgba(61, 106, 251, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
}

.fab-plus {
  color: #ffffff;
  font-size: 64rpx;
  font-weight: 700;
  line-height: 1;
}
</style>
