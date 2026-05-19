<template>
  <view class="task-page">
    <BlHeader back back-icon-src="/static/task/icon_nav_back_small.png">
      <template #center>
        <view class="center">
          <text class="center-date">{{ mdText }}</text>
          <view class="today-pill" @click="goToday"><text class="today-text">今天</text></view>
        </view>
      </template>
      <template #right>
        <view class="right-actions">
          <view class="icon-btn" @click="openMembers">
            <image class="top-icon" src="/static/task/icon_task_members.png" mode="aspectFit" />
          </view>
          <view class="icon-btn" @click="openSettings">
            <image class="top-icon" src="/static/task/icon_task_list.png" mode="aspectFit" />
          </view>
        </view>
      </template>
    </BlHeader>

    <view class="top-calendar">
      <view class="week-labels">
        <text v-for="w in weekdayLabels" :key="w" class="wlabel">{{ w }}</text>
      </view>

      <view v-if="!calendarOpen" class="week-row">
        <view
          v-for="d in weekDaysList"
          :key="d.key"
          class="day-cell"
          :class="{ selected: d.key === cursorKey }"
          @click="selectDate(d.key)"
        >
          <text class="day-num">{{ d.num }}</text>
          <view v-if="d.dot" class="dot" />
        </view>
      </view>

      <view v-else class="month-grid">
        <view v-for="(row, rIdx) in monthRows" :key="rIdx" class="mrow">
          <view
            v-for="d in row"
            :key="d.key"
            class="mcell"
            :class="{ selected: d.key === cursorKey, muted: !d.inMonth }"
            @click="selectDate(d.key)"
          >
            <text class="mnum">{{ d.num }}</text>
            <view v-if="d.dot" class="mdot" />
          </view>
        </view>
      </view>

      <view class="toggle" @click="toggleCalendar">
        <image
          class="toggle-img"
          :src="calendarOpen ? '/static/task/icon_task_calendar_collapse.png' : '/static/task/icon_task_calendar_expand.png'"
          mode="aspectFit"
        />
        <text class="toggle-text">{{ calendarOpen ? '收起' : '展开' }}</text>
      </view>
    </view>

    <view class="filters">
      <scroll-view scroll-x class="filter-scroll" show-scrollbar="false">
        <view class="filter-row">
          <view
            v-for="f in filterItems"
            :key="f.id"
            class="fitem"
            :class="{ active: f.id === activeFilter }"
            @click="activeFilter = f.id"
          >
            <view v-if="f.id === 'all'" class="circle all">
              <text class="all-text">全部</text>
            </view>
            <view v-else class="circle" :style="{ background: f.color }">
              <text class="circle-text">{{ f.glyph }}</text>
            </view>
            <view class="stats">
              <text class="stats-text">{{ statsFor(f.id).done }}/{{ statsFor(f.id).total }}</text>
            </view>
            <view v-if="f.id !== 'all'" class="hearts">
              <image class="heart-img" src="/static/task/icon_heart_orange.png" mode="aspectFit" />
              <text class="hearts-text">{{ statsFor(f.id).hearts }}</text>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>

    <view class="list-wrap">
      <text class="date-title">{{ mdText }}</text>

      <view v-if="pendingTasks.length" class="list">
        <view v-for="t in pendingTasks" :key="t.id" class="card" @longpress="openActions(t)" @click="openDetail(t.id)">
          <view class="left-icon">
            <text class="left-icon-text">{{ t.emoji || '图' }}</text>
          </view>
          <view class="mid">
            <text class="title">{{ t.title }}</text>
            <view class="meta">
              <view class="prio" :style="{ background: prioColor(t.priority) }" />
              <text v-if="overdueText(t)" class="meta-text overdue">{{ overdueText(t) }}</text>
              <text v-else class="meta-text">{{ t.timeEnabled ? t.time : '' }}</text>
            </view>
          </view>
          <view class="right">
            <view v-if="t.hearts" class="heart-pill">
              <image class="heart-img is-pill" src="/static/task/icon_heart_orange.png" mode="aspectFit" />
              <text class="pill-text">{{ t.hearts }}</text>
            </view>
            <view class="assign">
              <BlAvatar :glyph="memberGlyph(t.memberId)" :src="memberAvatar(t.memberId)" :color="memberColor(t.memberId)" :size="58" />
              <view class="check" @click.stop="toggleDone(t)">
                <image class="check-img" src="/static/task/icon_radio_off.png" mode="aspectFit" />
              </view>
            </view>
          </view>
        </view>
      </view>

      <view v-else class="empty">
        <view class="empty-illus">
          <image class="empty-bg" src="/static/task/bg_task_gradient_card.png" mode="aspectFit" />
          <image class="empty-icon" src="/static/task/icon_task_list.png" mode="aspectFit" />
        </view>
        <text class="empty-text bl-muted">今天没有待完成的任务</text>
      </view>

      <view v-if="settings.showDone" class="done-section">
        <text class="done-title">已完成</text>
        <view v-if="doneTasks.length" class="list">
          <view v-for="t in doneTasks" :key="t.id" class="card done" @longpress="openActions(t)" @click="openDetail(t.id)">
            <view class="left-icon done-icon">
              <text class="left-icon-text">{{ t.emoji || '图' }}</text>
            </view>
            <view class="mid">
              <text class="title">{{ t.title }}</text>
              <view class="meta">
                <view class="prio" :style="{ background: prioColor(t.priority) }" />
                <text class="meta-text">{{ t.timeEnabled ? t.time : '' }}</text>
              </view>
            </view>
            <view class="right">
              <view v-if="t.hearts" class="heart-pill green">
                <view class="heart is-pill" />
                <text class="pill-text">{{ t.hearts }}</text>
              </view>
              <view class="assign">
                <view class="mini-tag" :style="{ background: memberColor(t.memberId) }">
                  <text class="mini-tag-text">{{ memberGlyph(t.memberId) }}</text>
                </view>
                <view class="check" @click.stop="toggleDone(t)">
                <image class="check-img checked" src="/static/task/icon_check_circle_blue.png" mode="aspectFit" />
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <view class="fab" @click="addTask">
      <image class="fab-img" src="/static/task/icon_plus_circle.png" mode="aspectFit" />
    </view>

    <BlSheet v-model="actionSheetOpen" title="" :confirm-text="''">
      <view class="action-list">
        <view class="action-item" @click="editTask"><text class="action-text">编辑</text></view>
        <view class="action-item danger" @click="askDelete"><text class="action-text danger-text">删除</text></view>
        <view class="action-cancel" @click="actionSheetOpen = false"><text class="action-cancel-text">取消</text></view>
      </view>
    </BlSheet>

    <BlSheet v-model="deleteSheetOpen" title="" :confirm-text="''">
      <view class="action-list">
        <view class="action-item" @click="doDelete('one')"><text class="action-text">删除此任务</text></view>
        <view class="action-item" @click="doDelete('future')"><text class="action-text">删除此任务和所有后续任务</text></view>
        <view class="action-item" @click="doDelete('all')"><text class="action-text">删除所有任务</text></view>
        <view class="action-cancel" @click="deleteSheetOpen = false"><text class="action-cancel-text">取消</text></view>
      </view>
    </BlSheet>

    <BlSheet v-model="donePopupOpen" title="" :confirm-text="''">
      <view class="done-pop">
        <view class="pop-illus">
          <image class="pop-burst" src="/static/task/illus_task_done_burst.png" mode="aspectFit" />
          <image class="pop-confetti" src="/static/task/illus_task_done_confetti.png" mode="aspectFit" />
        </view>
        <text class="pop-title">太棒了！</text>
        <text class="pop-sub">你今天完成了所有任务。明天继续。</text>
        <view class="pop-btn" @click="donePopupOpen = false"><text class="pop-btn-text">确认</text></view>
      </view>
    </BlSheet>
  </view>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import BlAvatar from '../../components/BlAvatar.vue'
import BlHeader from '../../components/BlHeader.vue'
import BlSheet from '../../components/BlSheet.vue'
import { ensureCalendarState, listMembers, monthMatrix, weekDays } from '../../utils/calendarStore'
import {
  deleteTask,
  ensureTaskState,
  isTaskOverdue,
  isTaskDone,
  markTaskDone,
  markTaskUndone,
  setTaskCalendarOpen,
  setTaskCursorDate,
  taskOverdueText,
  taskStatsForDate,
  tasksForDate,
} from '../../utils/taskStore'

const taskState = ref(ensureTaskState())
const calendarState = ref(ensureCalendarState())

const activeFilter = ref('all')
const actionSheetOpen = ref(false)
const deleteSheetOpen = ref(false)
const donePopupOpen = ref(false)
const activeTaskId = ref('')

const weekdayLabels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

const cursorKey = computed(() => taskState.value.cursorDate)
const calendarOpen = computed(() => !!taskState.value.calendarOpen)
const settings = computed(() => taskState.value.settings || { sort: 'time', showDone: true, showOverdue: true })

function formatMdText(key) {
  const parts = String(key || '').split('-')
  if (parts.length !== 3) return ''
  return `${String(parts[1]).padStart(2, '0')}月${String(parts[2]).padStart(2, '0')}日`
}

const mdText = computed(() => formatMdText(cursorKey.value))

function memberList() {
  const base = [
    { id: 'me', name: '我', glyph: '我', color: '#4cc38a' },
    ...listMembers(calendarState.value).filter((m) => m.enabled !== false),
  ]
  return base
}

const filterItems = computed(() => {
  const ms = memberList()
  const other = ms.filter((m) => m.id !== 'me')
  const list = [
    { id: 'all', glyph: '', color: '' },
    other[0] ? { id: other[0].id, glyph: other[0].glyph, color: other[0].color } : null,
    { id: 'me', glyph: '我', color: '#4cc38a' },
    ...other.slice(1).map((m) => ({ id: m.id, glyph: m.glyph, color: m.color })),
  ].filter((x) => !!x)
  return list
})

function memberGlyph(id) {
  const m = memberList().find((x) => x.id === id)
  return m ? m.glyph : ''
}

function memberColor(id) {
  const m = memberList().find((x) => x.id === id)
  return m ? m.color : '#3d6afb'
}

function memberAvatar(id) {
  const m = memberList().find((x) => x.id === id)
  return m && m.avatarUrl ? m.avatarUrl : ''
}

function refresh() {
  taskState.value = ensureTaskState()
  calendarState.value = ensureCalendarState()
}

onMounted(() => refresh())
onShow(() => refresh())

const weekDaysList = computed(() => {
  const days = weekDays(cursorKey.value)
  return days.map((d) => {
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const list = tasksForDate(taskState.value, key, { memberId: activeFilter.value })
    return { key, num: d.getDate(), dot: list.length > 0 }
  })
})

const monthRows = computed(() => {
  const rows = monthMatrix(cursorKey.value)
  const cur = String(cursorKey.value || '').split('-')
  const month = cur.length === 3 ? Number(cur[1]) - 1 : new Date().getMonth()
  return rows.map((r) =>
    r.map((d) => {
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      const list = tasksForDate(taskState.value, key, { memberId: activeFilter.value })
      return { key, num: d.getDate(), inMonth: d.getMonth() === month, dot: list.length > 0 }
    }),
  )
})

const allTasks = computed(() => tasksForDate(taskState.value, cursorKey.value, { memberId: activeFilter.value }))
const pendingTasks = computed(() => allTasks.value.filter((t) => !isTaskDone(t)))
const doneTasks = computed(() => allTasks.value.filter((t) => isTaskDone(t)))

function statsFor(memberId) {
  return taskStatsForDate(taskState.value, cursorKey.value, memberId)
}

function toggleCalendar() {
  taskState.value = setTaskCalendarOpen(taskState.value, !calendarOpen.value)
}

function selectDate(key) {
  taskState.value = setTaskCursorDate(taskState.value, key)
  taskState.value = setTaskCalendarOpen(taskState.value, false)
}

function goToday() {
  const now = new Date()
  selectDate(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`)
}

function openMembers() {
  uni.navigateTo({ url: '/pages/calendar/members' })
}

function openSettings() {
  uni.navigateTo({ url: '/pages/tasks/settings' })
}

function addTask() {
  uni.navigateTo({ url: `/pages/tasks/task-form?date=${cursorKey.value}` })
}

function openDetail(id) {
  uni.navigateTo({ url: `/pages/tasks/task-detail?id=${id}` })
}

function prioColor(p) {
  if (p === 'high') return '#ff3b30'
  if (p === 'mid') return '#ffb020'
  if (p === 'low') return '#3d6afb'
  return 'rgba(17, 17, 17, 0.2)'
}

function overdueText(t) {
  if (!settings.value.showOverdue) return ''
  return isTaskOverdue(t, Date.now()) ? taskOverdueText(t, Date.now()) : ''
}

function toggleDone(t) {
  const beforePending = pendingTasks.value.length
  if (isTaskDone(t)) {
    markTaskUndone(taskState.value, t.id)
    refresh()
    return
  }
  markTaskDone(taskState.value, t.id)
  refresh()
  const afterPending = tasksForDate(taskState.value, cursorKey.value, { memberId: activeFilter.value }).filter((x) => !isTaskDone(x)).length
  if (beforePending > 0 && afterPending === 0) donePopupOpen.value = true
}

function openActions(t) {
  activeTaskId.value = t.id
  actionSheetOpen.value = true
}

function editTask() {
  const id = activeTaskId.value
  actionSheetOpen.value = false
  if (!id) return
  uni.navigateTo({ url: `/pages/tasks/task-form?id=${id}` })
}

function askDelete() {
  actionSheetOpen.value = false
  const t = activeTaskId.value ? taskState.value.tasks.find((x) => x.id === activeTaskId.value) : null
  if (t && t.repeat && t.repeat.id) {
    deleteSheetOpen.value = true
    return
  }
  uni.showModal({
    title: '',
    content: '您确定要删除吗？',
    confirmText: '删除',
    cancelText: '取消',
    confirmColor: '#3d6afb',
    success(res) {
      if (!res.confirm) return
      doDelete('one')
    },
  })
}

function doDelete(scope) {
  const id = activeTaskId.value
  deleteSheetOpen.value = false
  if (!id) return
  deleteTask(taskState.value, id, scope)
  refresh()
}
</script>

<style scoped lang="scss">
.task-page {
  padding-bottom: 240rpx;
}

.center {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.center-date {
  font-size: 40rpx;
  font-weight: 900;
}

.today-pill {
  height: 44rpx;
  padding: 0 18rpx;
  border-radius: 999rpx;
  background: #3d6afb;
  display: flex;
  align-items: center;
  justify-content: center;
}

.today-text {
  color: #ffffff;
  font-size: 22rpx;
  font-weight: 900;
}

.right-actions {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.icon-btn {
  height: 64rpx;
  padding: 0 18rpx;
  border-radius: 999rpx;
  background: #ffffff;
  box-shadow: 0 10rpx 26rpx rgba(17, 17, 17, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
}

.top-icon {
  width: 34rpx;
  height: 34rpx;
  display: block;
}

.top-calendar {
  margin-top: 6rpx;
  background: #eef4ff;
  padding: 12rpx 18rpx 10rpx;
}

.week-labels {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8rpx;
  padding: 6rpx 4rpx 8rpx;
}

.wlabel {
  text-align: center;
  font-size: 24rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.65);
}

.week-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8rpx;
  padding: 0 4rpx;
}

.day-cell {
  height: 82rpx;
  border-radius: 18rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6rpx;
}

.day-cell.selected {
  background: #ffffff;
  border: 4rpx solid #3d6afb;
}

.day-num {
  font-size: 26rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.9);
}

.dot {
  width: 10rpx;
  height: 10rpx;
  border-radius: 999rpx;
  background: #3d6afb;
}

.toggle {
  margin-top: 10rpx;
  height: 50rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
}

.toggle-img {
  width: 26rpx;
  height: 26rpx;
  display: block;
}

.toggle-text {
  font-size: 24rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.55);
}

.month-grid {
  padding: 4rpx 4rpx 0;
}

.mrow {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8rpx;
  padding: 10rpx 0;
}

.mcell {
  height: 70rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.mcell.muted .mnum {
  color: rgba(17, 17, 17, 0.25);
}

.mcell.selected {
  background: #3d6afb;
}

.mcell.selected .mnum {
  color: #ffffff;
}

.mnum {
  font-size: 26rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.9);
}

.mdot {
  position: absolute;
  bottom: 10rpx;
  width: 10rpx;
  height: 10rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.9);
}

.filters {
  padding: 14rpx 18rpx 0;
  background: #ffffff;
  border-top-left-radius: 28rpx;
  border-top-right-radius: 28rpx;
}

.filter-scroll {
  width: 100%;
}

.filter-row {
  display: flex;
  align-items: flex-start;
  gap: 22rpx;
  padding-bottom: 8rpx;
}

.fitem {
  width: 150rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.circle {
  width: 92rpx;
  height: 92rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 4rpx solid rgba(255, 255, 255, 0.7);
  box-shadow: 0 10rpx 26rpx rgba(17, 17, 17, 0.06);
}

.circle.all {
  background: #ffffff;
  border: 6rpx solid #3d6afb;
}

.circle-text {
  color: #ffffff;
  font-size: 34rpx;
  font-weight: 900;
}

.all-text {
  color: #3d6afb;
  font-size: 26rpx;
  font-weight: 900;
}

.stats {
  margin-top: 10rpx;
  padding: 8rpx 18rpx;
  border-radius: 999rpx;
  background: rgba(17, 17, 17, 0.04);
}

.stats-text {
  font-size: 22rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.7);
}

.hearts {
  margin-top: 8rpx;
  height: 36rpx;
  padding: 0 14rpx;
  border-radius: 999rpx;
  background: rgba(255, 165, 0, 0.12);
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.hearts-text {
  font-size: 22rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.75);
}

.heart-img {
  width: 18rpx;
  height: 18rpx;
  display: block;
}

.heart-img.is-pill {
  width: 16rpx;
  height: 16rpx;
}

.list-wrap {
  padding: 18rpx 18rpx 0;
}

.date-title {
  font-size: 40rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.95);
}

.list {
  margin-top: 14rpx;
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.card {
  background: #fdecee;
  border-radius: 22rpx;
  padding: 18rpx 18rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.card.done {
  background: #eaf7f1;
}

.left-icon {
  width: 74rpx;
  height: 74rpx;
  border-radius: 18rpx;
  background: rgba(17, 17, 17, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
}

.left-icon-text {
  font-size: 28rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.65);
}

.mid {
  flex: 1;
}

.title {
  font-size: 32rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.92);
}

.meta {
  margin-top: 10rpx;
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.prio {
  width: 20rpx;
  height: 20rpx;
  border-radius: 6rpx;
}

.meta-text {
  font-size: 26rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.6);
}

.meta-text.overdue {
  color: #ff3b30;
}

.right {
  width: 190rpx;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: space-between;
  gap: 10rpx;
}

.heart-pill {
  height: 44rpx;
  padding: 0 14rpx;
  border-radius: 16rpx;
  background: rgba(255, 165, 0, 0.2);
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.heart-pill.green {
  background: rgba(0, 176, 96, 0.2);
}

.pill-text {
  font-size: 24rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.75);
}

.assign {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.check {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.check-img {
  width: 36rpx;
  height: 36rpx;
  display: block;
}

.mini-tag {
  width: 56rpx;
  height: 56rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mini-tag-text {
  color: #ffffff;
  font-size: 26rpx;
  font-weight: 900;
}

.empty {
  margin-top: 50rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18rpx;
}

.empty-illus {
  width: 160rpx;
  height: 160rpx;
  border-radius: 24rpx;
  position: relative;
  overflow: hidden;
}

.empty-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.empty-icon {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 54rpx;
  height: 54rpx;
  transform: translate(-50%, -50%);
  opacity: 0.75;
}

.empty-text {
  font-size: 26rpx;
  font-weight: 800;
}

.done-section {
  margin-top: 26rpx;
}

.done-title {
  font-size: 32rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.9);
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

.fab-img {
  width: 62rpx;
  height: 62rpx;
  display: block;
}

.action-list {
  padding: 6rpx 0 10rpx;
}

.action-item {
  height: 92rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-text {
  font-size: 32rpx;
  font-weight: 900;
  color: #111111;
}

.action-item.danger .action-text {
  color: #ff3b30;
}

.action-cancel {
  margin-top: 18rpx;
  height: 92rpx;
  border-radius: 999rpx;
  background: rgba(17, 17, 17, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-cancel-text {
  font-size: 32rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.8);
}

.done-pop {
  padding: 20rpx 0 10rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.pop-illus {
  width: 180rpx;
  height: 140rpx;
  position: relative;
  margin-bottom: 12rpx;
}

.pop-burst {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 200rpx;
  height: 200rpx;
  transform: translate(-50%, -50%);
}

.pop-confetti {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 180rpx;
  height: 180rpx;
  transform: translate(-50%, -50%);
}

.pop-title {
  font-size: 40rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.95);
}

.pop-sub {
  margin-top: 12rpx;
  text-align: center;
  font-size: 28rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.7);
}

.pop-btn {
  margin-top: 18rpx;
  width: 520rpx;
  height: 96rpx;
  border-radius: 999rpx;
  background: #3d6afb;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pop-btn-text {
  color: #ffffff;
  font-size: 34rpx;
  font-weight: 900;
}
</style>
