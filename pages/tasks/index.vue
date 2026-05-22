<template>
  <view class="task-page">
    <BlHeader back back-icon-src="/static/task/icon_nav_back_small.png">
      <template #center>
        <view class="center">
          <text class="center-date">{{ mdText }}</text>
          <view class="today-pill" @click="goToday">
            <text class="today-refresh">↻</text>
            <text class="today-text">今天</text>
          </view>
        </view>
      </template>
      <template #right>
        <view class="right-actions">
          <view class="icon-btn" @click="openMembers">
            <image class="top-icon" src="/static/task/icon_task_members_alt.png" mode="aspectFit" />
          </view>
          <view class="icon-btn" @click="openSettings">
            <image class="top-icon" src="/static/task/icon_task_list.png" mode="aspectFit" />
          </view>
        </view>
      </template>
    </BlHeader>

    <view class="top-calendar">
      <view v-if="calendarOpen" class="week-labels">
        <view v-for="w in weekdayLabels" :key="w" class="wlabel">
          <text class="wlabel-text">{{ w }}</text>
        </view>
      </view>

      <view v-if="!calendarOpen" class="week-row">
        <view
          v-for="d in weekDaysList"
          :key="d.key"
          class="day-cell"
          :class="{ selected: d.key === cursorKey }"
          @click="selectDate(d.key)"
        >
          <text class="day-wd">{{ d.wd }}</text>
          <view class="day-body">
            <text class="day-num">{{ d.num }}</text>
            <view v-if="d.dot" class="dot" />
          </view>
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
        <image class="toggle-img" :class="{ open: calendarOpen }" src="/static/task/icon_chevron_down.png" mode="aspectFit" />
      </view>
    </view>

    <view class="panel">
      <view class="filters">
        <scroll-view scroll-x class="filter-scroll" show-scrollbar="false">
          <view class="filter-row">
            <view
              v-for="f in visibleFilterItems"
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
              <view v-if="statsFor(f.id).total > 0" class="stats">
                <text class="stats-text">{{ statsFor(f.id).done }}/{{ statsFor(f.id).total }}</text>
              </view>
              <view v-if="f.id !== 'all' && statsFor(f.id).total > 0" class="hearts">
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
          <view v-for="t in pendingTasks" :key="t.id" class="swipe-item" :class="{ 'is-open': isSwipeRevealed(t.id) }">
            <view class="swipe-actions">
              <view class="swipe-btn swipe-edit" @click.stop="swipeEdit(t)">
                <image class="swipe-icon" src="/static/common/icon_edit_pencil.png" mode="aspectFit" />
              </view>
              <view class="swipe-btn swipe-delete" @click.stop="swipeDelete(t)">
                <image class="swipe-icon" src="/static/task/icon_trash.png" mode="aspectFit" />
              </view>
            </view>
            <view
              class="swipe-track"
              :class="{ dragging: swipeActiveId === t.id && swipeLocked === 'x' }"
              :style="{ transform: `translateX(${swipeTranslateX(t.id)}px)` }"
              @touchstart="onSwipeStart(t.id, $event)"
              @touchmove.stop="onSwipeMove(t.id, $event)"
              @touchend="onSwipeEnd(t.id, $event)"
              @click="onCardTap(t.id)"
            >
              <view v-if="t.hearts" class="heart-pill">
                <image class="heart-img is-pill" src="/static/task/icon_heart_orange.png" mode="aspectFit" />
                <text class="pill-text">{{ t.hearts }}</text>
              </view>
              <view class="card" :class="{ 'has-heart': !!t.hearts }" :style="{ background: taskCardBg(t) }">
                <view class="left-icon">
                  <image v-if="!t.emoji" class="left-icon-img" src="/static/task/icon_title_t.png" mode="aspectFit" />
                  <text v-else class="left-icon-text">{{ t.emoji }}</text>
                </view>
                <view class="mid">
                  <text class="title">{{ t.title }}</text>
                  <view v-if="metaText(t)" class="meta">
                    <image v-if="metaIconSrc(t)" class="meta-icon" :src="metaIconSrc(t)" mode="aspectFit" />
                    <text class="meta-text" :class="{ overdue: !!overdueText(t) }">{{ metaText(t) }}</text>
                  </view>
                </view>
                <view class="assign">
                  <BlAvatar :glyph="memberGlyph(t.memberId)" :src="memberAvatar(t.memberId)" :color="memberColor(t.memberId)" :size="58" />
                  <view class="check" @click.stop="toggleDone(t)">
                    <image class="check-img" src="/static/common/icon_radio_off.png" mode="aspectFit" />
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>

        <view v-else class="empty">
          <view class="empty-illus">
            <image class="empty-bg" src="/static/task/bg_none_task.png" mode="aspectFit" />
          </view>
          <text class="empty-text bl-muted">今天没有待完成的任务</text>
        </view>

        <view v-if="settings.showDone" class="done-section">
          <text class="done-title">已完成</text>
          <view v-if="doneTasks.length" class="list">
            <view v-for="t in doneTasks" :key="t.id" class="swipe-item" :class="{ 'is-open': isSwipeRevealed(t.id) }">
              <view class="swipe-actions">
                <view class="swipe-btn swipe-edit" @click.stop="swipeEdit(t)">
                  <image class="swipe-icon" src="/static/common/icon_edit_pencil.png" mode="aspectFit" />
                </view>
                <view class="swipe-btn swipe-delete" @click.stop="swipeDelete(t)">
                  <image class="swipe-icon" src="/static/task/icon_trash.png" mode="aspectFit" />
                </view>
              </view>
              <view
                class="swipe-track"
                :class="{ dragging: swipeActiveId === t.id && swipeLocked === 'x' }"
                :style="{ transform: `translateX(${swipeTranslateX(t.id)}px)` }"
                @touchstart="onSwipeStart(t.id, $event)"
                @touchmove.stop="onSwipeMove(t.id, $event)"
                @touchend="onSwipeEnd(t.id, $event)"
                @click="onCardTap(t.id)"
              >
                <view v-if="t.hearts" class="heart-pill green">
                  <image class="heart-img is-pill" src="/static/task/icon_heart_orange.png" mode="aspectFit" />
                  <text class="pill-text">{{ t.hearts }}</text>
                </view>
                <view class="card done" :class="{ 'has-heart': !!t.hearts }" :style="{ background: taskCardBg(t) }">
                  <view class="left-icon done-icon">
                    <image v-if="!t.emoji" class="left-icon-img" src="/static/task/icon_title_t.png" mode="aspectFit" />
                    <text v-else class="left-icon-text">{{ t.emoji }}</text>
                  </view>
                  <view class="mid">
                    <text class="title">{{ t.title }}</text>
                    <view v-if="metaText(t)" class="meta">
                      <image v-if="metaIconSrc(t)" class="meta-icon" :src="metaIconSrc(t)" mode="aspectFit" />
                      <text class="meta-text">{{ metaText(t) }}</text>
                    </view>
                  </view>
                  <view class="assign">
                    <BlAvatar :glyph="memberGlyph(t.memberId)" :src="memberAvatar(t.memberId)" :color="memberColor(t.memberId)" :size="56" />
                    <view class="check" @click.stop="toggleDone(t)">
                      <image class="check-img checked" src="/static/task/icon_check_circle_green.png" mode="aspectFit" />
                    </view>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <view class="fab" @click="addTask">
      <image class="fab-img" src="/static/common/btn_fab_add.png" mode="aspectFit" />
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
import { computed, onMounted, ref, watch } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
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
const openSwipeId = ref('')
const swipeActiveId = ref('')
const swipeStartX = ref(0)
const swipeStartY = ref(0)
const swipeStartOffset = ref(0)
const swipeOffsetX = ref(0)
const swipeMoving = ref(false)
const swipeLocked = ref('')
const swipeActionWidthPxRef = ref(0)
let swipeRaf = 0
let swipeNextX = 0

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

function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function refresh() {
  taskState.value = ensureTaskState()
  calendarState.value = ensureCalendarState()
  if (!taskState.value.cursorDate) {
    taskState.value.cursorDate = todayKey()
  }
}

onLoad(() => {
  refresh()
  taskState.value = setTaskCursorDate(taskState.value, todayKey())
  taskState.value = setTaskCalendarOpen(taskState.value, false)
})
onShow(() => refresh())

function updateSwipeActionWidth() {
  const sys = uni.getSystemInfoSync()
  const ww = sys && typeof sys.windowWidth === 'number' ? sys.windowWidth : 375
  swipeActionWidthPxRef.value = (ww / 750) * swipeActionWidthRpx
}

onMounted(() => updateSwipeActionWidth())
onShow(() => updateSwipeActionWidth())

const weekDaysList = computed(() => {
  const days = weekDays(cursorKey.value)
  return days.map((d) => {
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const list = tasksForDate(taskState.value, key, { memberId: activeFilter.value })
    return { key, wd: weekdayLabels[d.getDay()], num: d.getDate(), dot: list.length > 0 }
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

const visibleFilterItems = computed(() => {
  return (filterItems.value || []).filter((f) => f && (f.id === 'all' || statsFor(f.id).total > 0))
})

watch(
  () => visibleFilterItems.value.map((x) => x.id).join(','),
  () => {
    const ids = visibleFilterItems.value.map((x) => x.id)
    if (!ids.includes(activeFilter.value)) activeFilter.value = 'all'
  },
  { immediate: true },
)

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

function swipeEdit(t) {
  openSwipeId.value = ''
  swipeActiveId.value = ''
  if (!t || !t.id) return
  uni.navigateTo({ url: `/pages/tasks/task-form?id=${t.id}` })
}

function swipeDelete(t) {
  openSwipeId.value = ''
  swipeActiveId.value = ''
  if (!t || !t.id) return
  activeTaskId.value = t.id
  askDelete()
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

function overdueText(t) {
  if (!settings.value.showOverdue) return ''
  return isTaskOverdue(t, Date.now()) ? taskOverdueText(t, Date.now()) : ''
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

function taskCardBg(t) {
  const base = memberColor(t && t.memberId)
  if (isTaskDone(t)) return rgbaFromColor(base, 0.1)
  return rgbaFromColor(base, 0.12)
}

function metaText(t) {
  const od = overdueText(t)
  if (od && !isTaskDone(t)) return od
  return t && t.timeEnabled ? t.time : ''
}

function metaIconSrc(t) {
  if (!t) return ''
  if (overdueText(t)) return '/static/task/icon_bolt_red.png'
  if (t.timeEnabled) {
    if (isTaskDone(t)) return '/static/task/icon_bolt_black_small.png'
    return '/static/task/icon_bolt_blue_small.png'
  }
  return ''
}

const swipeActionWidthRpx = 224
let swipeRafType = ''

function scheduleFrame(cb) {
  const fn = globalThis && globalThis.requestAnimationFrame
  if (typeof fn === 'function') {
    swipeRafType = 'raf'
    return fn(cb)
  }
  swipeRafType = 'timeout'
  return setTimeout(cb, 16)
}

function cancelFrame(id) {
  if (!id) return
  if (swipeRafType === 'raf') {
    const fn = globalThis && globalThis.cancelAnimationFrame
    if (typeof fn === 'function') fn(id)
    return
  }
  clearTimeout(id)
}

function swipeTranslateX(id) {
  const w = swipeActionWidthPxRef.value
  if (swipeActiveId.value === id) return swipeOffsetX.value
  if (openSwipeId.value === id) return -w
  return 0
}

function isSwipeRevealed(id) {
  if (!id) return false
  if (openSwipeId.value === id) return true
  return swipeActiveId.value === id && swipeLocked.value === 'x' && swipeTranslateX(id) < 0
}

function onSwipeStart(id, e) {
  const touch = e && e.touches && e.touches[0] ? e.touches[0] : null
  if (!touch) return
  actionSheetOpen.value = false
  swipeActiveId.value = id
  swipeStartX.value = touch.clientX
  swipeStartY.value = touch.clientY
  const w = swipeActionWidthPxRef.value
  swipeStartOffset.value = openSwipeId.value === id ? -w : 0
  swipeOffsetX.value = swipeStartOffset.value
  swipeMoving.value = false
  swipeLocked.value = ''
  if (openSwipeId.value && openSwipeId.value !== id) openSwipeId.value = ''
}

function onSwipeMove(id, e) {
  if (swipeActiveId.value !== id) return
  const touch = e && e.touches && e.touches[0] ? e.touches[0] : null
  if (!touch) return
  const dx = touch.clientX - swipeStartX.value
  const dy = touch.clientY - swipeStartY.value
  if (!swipeLocked.value) swipeLocked.value = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
  if (swipeLocked.value !== 'x') return
  e && e.preventDefault && e.preventDefault()
  const w = swipeActionWidthPxRef.value
  const next = Math.min(0, Math.max(-w, swipeStartOffset.value + dx))
  swipeNextX = next
  if (!swipeRaf) {
    swipeRaf = scheduleFrame(() => {
      swipeOffsetX.value = swipeNextX
      swipeRaf = 0
    })
  }
  if (Math.abs(dx) > 8) swipeMoving.value = true
}

function onSwipeEnd(id) {
  if (swipeActiveId.value !== id) return
  if (swipeRaf) {
    cancelFrame(swipeRaf)
    swipeRaf = 0
    swipeOffsetX.value = swipeNextX
  }
  const w = swipeActionWidthPxRef.value
  const shouldOpen = swipeOffsetX.value < -w * 0.45
  openSwipeId.value = shouldOpen ? id : ''
  swipeActiveId.value = ''
  swipeMoving.value = false
  swipeLocked.value = ''
  swipeOffsetX.value = 0
}

function onCardTap(id) {
  if (swipeMoving.value) return
  if (openSwipeId.value) {
    openSwipeId.value = ''
    swipeActiveId.value = ''
    return
  }
  openDetail(id)
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
  padding: 0 28rpx 240rpx;
  background: #ffffff;
  min-height: 100vh;
  box-sizing: border-box;
}

:deep(.bl-header) {
  background: #eef4ff;
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
  gap: 8rpx;
}

.today-refresh {
  font-size: 22rpx;
  font-weight: 900;
  color: #ffffff;
  line-height: 1;
}

.today-text {
  color: #ffffff;
  font-size: 22rpx;
  font-weight: 900;
}

.right-actions {
  display: flex;
  align-items: center;
  gap: 2rpx;
}

.icon-btn {
  width: 72rpx;
  height: 72rpx;
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
  margin-left: -28rpx;
  margin-right: -28rpx;
  background: #eef4ff;
  padding: 10rpx 28rpx 6rpx;
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
  padding: 12rpx 4rpx 0 4rpx;
}

.day-cell {
  height: 106rpx;
  border-radius: 18rpx;
  position: relative;
  box-sizing: border-box;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
}

.day-cell.selected {
  background: #3d6afb;
}

.day-wd {
  height: 42rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.45);
}

.day-cell.selected .day-wd {
  color: #ffffff;
}

.day-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4rpx;
}

.day-cell.selected .day-body {
  background: #ffffff;
  border-radius: 14rpx;
  margin: 0 6rpx 6rpx;
}

.day-num {
  font-size: 28rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.9);
  line-height: 1;
}

.dot {
  width: 8rpx;
  height: 8rpx;
  border-radius: 999rpx;
  background: #3d6afb;
}

.toggle {
  margin-top: 8rpx;
  height: 54rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toggle-img {
  width: 34rpx;
  height: 34rpx;
  display: block;
  transform: rotate(0deg);
  transition: transform 0.2s;
}

.toggle-img.open {
  transform: rotate(180deg);
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

.panel {
  margin-top: 10rpx;
  background: #ffffff;
  overflow: hidden;
}

.filters {
  padding-top: 14rpx;
}

.filter-scroll {
  width: 100%;
}

.filter-row {
  display: flex;
  align-items: flex-start;
  gap: 12rpx;
  padding-bottom: 8rpx;
}

.fitem {
  width: 110rpx;
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

.fitem.active .circle.all {
  background: #3d6afb;
  border-color: rgba(255, 255, 255, 0.9);
}

.fitem.active .circle.all .all-text {
  color: #ffffff;
}

.fitem.active .stats {
  background: rgba(61, 106, 251, 0.14);
}

.fitem.active .stats-text {
  color: #3d6afb;
}

.stats {
  margin-top: 8rpx;
  padding: 4rpx 14rpx;
  border-radius: 999rpx;
  background: rgba(17, 17, 17, 0.04);
}

.stats-text {
  font-size: 22rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.7);
}

.hearts {
  margin-top: 6rpx;
  height: 32rpx;
  padding: 0 12rpx;
  border-radius: 999rpx;
  background: rgba(255, 165, 0, 0.12);
  display: flex;
  align-items: center;
  gap: 6rpx;
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

.swipe-item {
  position: relative;
  overflow: hidden;
  border-radius: 22rpx;
}

.swipe-actions {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12rpx;
  padding-right: 12rpx;
  z-index: 1;
  opacity: 0;
  transform: translateX(16rpx);
  transition: opacity 0.15s, transform 0.15s;
  pointer-events: none;
}

.swipe-item.is-open .swipe-actions {
  opacity: 1;
  transform: translateX(0);
  pointer-events: auto;
}

.swipe-btn {
  height: 92rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 14rpx rgba(17, 17, 17, 0.05);
  flex-shrink: 0;
}

.swipe-edit {
  width: 92rpx;
  background: #ffffff;
  border-radius: 20rpx;
}

.swipe-delete {
  width: 108rpx;
  background: #ff4d4f;
  border-radius: 24rpx;
}

.swipe-icon {
  width: 38rpx;
  height: 38rpx;
  display: block;
}

.swipe-track {
  position: relative;
  z-index: 2;
  transform: translate3d(0, 0, 0);
  transition: transform 0.2s cubic-bezier(0.25, 1, 0.5, 1);
  will-change: transform;
}

.swipe-track.dragging {
  transition: none;
}

.card {
  border-radius: 22rpx;
  padding: 20rpx 18rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
  position: relative;
}

.card.has-heart {
  padding-top: 40rpx;
}

.card.done {
  opacity: 0.95;
}

.left-icon {
  width: 74rpx;
  height: 74rpx;
  border-radius: 18rpx;
  background: rgba(255, 255, 255, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.left-icon-text {
  font-size: 28rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.65);
}

.left-icon-img {
  width: 46rpx;
  height: 46rpx;
  display: block;
  opacity: 0.85;
}

.mid {
  flex: 1;
  min-width: 0;
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

.meta-icon {
  width: 22rpx;
  height: 22rpx;
  display: block;
}

.meta-text {
  font-size: 26rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.6);
}

.meta-text.overdue {
  color: #ff3b30;
}

.assign {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.heart-pill {
  height: 44rpx;
  padding: 0 14rpx;
  border-radius: 16rpx;
  background: #ff6b6b;
  display: flex;
  align-items: center;
  gap: 8rpx;
  position: absolute;
  right: 0;
  top: 0;
}

.heart-pill.green {
  background: #35c38a;
}

.pill-text {
  font-size: 24rpx;
  font-weight: 900;
  color: #ffffff;
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

.empty {
  margin-top: 50rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18rpx;
}

.empty-illus {
  width: 240rpx;
  height: 240rpx;
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
  font-weight: 500;
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
  width: 156rpx;
  height: 96rpx;
  border-radius: 999rpx;
  background: #3d6afb;
  box-shadow: 0 18rpx 36rpx rgba(61, 106, 251, 0.28);
  display: flex;
  align-items: center;
  justify-content: center;
}

.fab-img {
  width: 152rpx;
  height: 96rpx;
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
