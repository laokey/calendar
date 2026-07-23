<template>
  <view class="page">
    <view class="head" :style="{ paddingTop: safeTop + 'px' }">
      <view class="head-left" @click="back">
        <text class="back">‹</text>
      </view>
      <text class="head-title">{{ $t('动态详情') }}</text>
      <view class="head-right">
        <view class="action" @click="editTitle">
          <image class="action-icon" src="/static/common/icon_edit.png" mode="aspectFit" />
        </view>
        <view class="action del" @click="remove">
          <image class="action-icon" src="/static/task/icon_trash_red.png" mode="aspectFit" />
        </view>
      </view>
    </view>

    <view v-if="item" class="hero">
      <view class="big-icon">
        <text class="big-glyph">{{ item.task.icon === 'run' ? '🏃' : '🥣' }}</text>
      </view>
      <text class="task-title">{{ item.task.title }}</text>
    </view>

    <view v-if="item" class="panel">
      <view class="row">
        <view class="r-ico">
          <image class="r-ico-img" src="/static/task/icon_clock_grey.png" mode="aspectFit" />
        </view>
        <text class="r-text">{{ item.detail.dateText }}</text>
      </view>
      <view class="line" />
      <view class="row">
        <view class="r-ico">
          <image class="r-ico-img" src="/static/task/icon_repeat.png" mode="aspectFit" />
        </view>
        <text class="r-text">{{ item.detail.repeatText }}</text>
      </view>
      <view class="line" />
      <view class="row">
        <view class="r-ico">
          <image class="r-ico-img" src="/static/common/icon_star.png" mode="aspectFit" />
        </view>
        <text class="r-text">{{ item.detail.starText }}</text>
      </view>
      <view class="line" />
      <view class="row">
        <view class="r-ico">
          <image class="r-ico-img" src="/static/message/icon_person.png" mode="aspectFit" />
        </view>
        <text class="r-text">{{ $t('分配给') }}</text>
        <view class="assignee">
          <view class="a-avatar" :style="{ background: item.detail.assignTo.color }">
            <text class="a-text">{{ item.detail.assignTo.glyph }}</text>
          </view>
          <text class="a-name">{{ item.detail.assignTo.name }}</text>
        </view>
      </view>
      <view class="line" />
      <view class="row">
        <view class="r-ico">
          <image class="r-ico-img" src="/static/common/icon_complete.png" mode="aspectFit" />
        </view>
        <text class="r-text">{{ formatDoneAtText(item.detail.doneAtText) }}</text>
      </view>
    </view>

    <view
      class="btn"
      :style="{ bottom: 34 + safeBottom + 'px' }"
      :class="{ disabled: !item, primary: item && item.action !== 'done' }"
      @click="toggleDone"
    >
      <text class="btn-text">{{ item && item.action === 'done' ? $t('标记为未完成') : $t('标记为已完成') }}</text>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { ensureActivityState, findDynamic, removeDynamic, updateDynamic } from '../../utils/activityStore'
import { ensureCalendarState, findMember } from '../../utils/calendarStore'
import { ensureTaskState, findTask, replaceTaskList, setTaskCursorDate } from '../../utils/taskStore'
import { noticeApi, tasksApi } from '../../utils/api'

const id = ref('')
const state = ref(ensureActivityState())
const taskState = ref(ensureTaskState())
const syncing = ref(false)
const submitting = ref(false)

onLoad((options) => {
  id.value = options && options.id ? String(options.id) : ''
})

onShow(() => {
  state.value = ensureActivityState()
  taskState.value = ensureTaskState()
  syncCurrentTaskDetail()
  if (id.value && !item.value) {
    uni.showToast({ title: uni.$t('动态不存在'), icon: 'none' })
    setTimeout(() => uni.navigateBack(), 300)
  }
})

const safeTop = computed(() => {
  try {
    const info = uni.getSystemInfoSync()
    const insets = info && info.safeAreaInsets ? info.safeAreaInsets : null
    return insets && typeof insets.top === 'number' ? insets.top : 0
  } catch (e) {
    return 0
  }
})

const safeBottom = computed(() => {
  try {
    const info = uni.getSystemInfoSync()
    const insets = info && info.safeAreaInsets ? info.safeAreaInsets : null
    return insets && typeof insets.bottom === 'number' ? insets.bottom : 0
  } catch (e) {
    return 0
  }
})

const item = computed(() => findDynamic(state.value, id.value))

function pad(n) {
  return String(n).padStart(2, '0')
}

function currentLocaleTag() {
  try {
    return typeof uni.getLocale === 'function' ? String(uni.getLocale() || 'zh-CN') : 'zh-CN'
  } catch (e) {
    return 'zh-CN'
  }
}

function formatDateTime(ts) {
  const d = new Date(ts)
  try {
    return new Intl.DateTimeFormat(currentLocaleTag(), {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(d)
  } catch (e) {
    return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  }
}

function buildDoneAtText(action, timeValue) {
  const label = action === 'cancel' ? uni.$t('取消于') : uni.$t('完成于')
  return `${label} ${formatDateTime(timeValue)}`
}

function formatDoneAtText(value) {
  const raw = String(value || '').trim()
  if (!raw) return uni.$t('未完成')
  if (raw === uni.$t('未完成') || raw === '未完成') return uni.$t('未完成')

  let action = 'done'
  let timeText = raw
  if (raw.startsWith('完成于')) {
    action = 'done'
    timeText = raw.slice(3).trim()
  } else if (raw.startsWith('取消于')) {
    action = 'cancel'
    timeText = raw.slice(3).trim()
  } else if (raw.startsWith(uni.$t('完成于'))) {
    action = 'done'
    timeText = raw.slice(String(uni.$t('完成于')).length).trim()
  } else if (raw.startsWith(uni.$t('取消于'))) {
    action = 'cancel'
    timeText = raw.slice(String(uni.$t('取消于')).length).trim()
  }

  const parsed = Date.parse(timeText.replace(/\./g, '-').replace('T', ' '))
  if (Number.isFinite(parsed)) return buildDoneAtText(action, parsed)
  return `${action === 'cancel' ? uni.$t('取消于') : uni.$t('完成于')} ${timeText}`
}

function taskIconFromTitle(value) {
  const text = String(value || '').trim()
  if (/跑|步|walk|run/i.test(text)) return 'run'
  return 'bowl'
}

function resolveDateKey(value) {
  const raw = String(value || '').trim()
  if (!raw) return ''
  const m1 = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (m1) return `${m1[1]}-${String(Number(m1[2])).padStart(2, '0')}-${String(Number(m1[3])).padStart(2, '0')}`
  const m2 = raw.match(/^(\d{4})\.(\d{1,2})\.(\d{1,2})/)
  if (m2) return `${m2[1]}-${String(Number(m2[2])).padStart(2, '0')}-${String(Number(m2[3])).padStart(2, '0')}`
  const m3 = raw.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/)
  if (m3) return `${m3[1]}-${String(Number(m3[2])).padStart(2, '0')}-${String(Number(m3[3])).padStart(2, '0')}`
  const ts = Date.parse(raw.replace(/\./g, '-').replace('T', ' '))
  if (Number.isFinite(ts)) return resolveDateKey(new Date(ts).toISOString().slice(0, 10))
  return ''
}

function formatCnDate(key) {
  const dateKey = resolveDateKey(key)
  if (!dateKey) return ''
  const parts = dateKey.split('-')
  return `${parts[0]}年${Number(parts[1])}月${Number(parts[2])}日`
}

function formatTaskDateText(task, fallback) {
  if (!task || !task.dateEnabled || !task.date) return String(fallback || '')
  const dateText = formatCnDate(task.date)
  if (!dateText) return String(fallback || '')
  if (task.timeEnabled && task.time) return `${dateText} ${task.time}`
  return dateText
}

function formatRepeatText(task, fallback) {
  if (!task) return String(fallback || '')
  if (!task.repeat) return uni.$t('不重复')
  const unit = task.repeat.unit || 'day'
  const every = Number(task.repeat.every || 1) || 1
  if (unit === 'week') return every > 1 ? `${uni.$t('每')}${every}${uni.$t('周')}` : uni.$t('每周')
  if (unit === 'month') return every > 1 ? `${uni.$t('每')}${every}${uni.$t('月')}` : uni.$t('每月')
  if (unit === 'year') return every > 1 ? `${uni.$t('每')}${every}${uni.$t('年')}` : uni.$t('每年')
  return every > 1 ? `${uni.$t('每')}${every}${uni.$t('天')}` : uni.$t('每日')
}

function resolveAssignee(task, fallback) {
  const current = fallback && typeof fallback === 'object' ? fallback : {}
  const memberId = task && task.memberId ? String(task.memberId) : ''
  const calendarState = ensureCalendarState()
  const member = memberId ? findMember(calendarState, memberId) : null
  if (member) {
    return {
      name: member.name || current.name || '',
      glyph: member.glyph || current.glyph || '',
      color: member.color || current.color || '#3d6afb',
    }
  }
  const first = task && Array.isArray(task.members) && task.members[0] ? task.members[0] : null
  const name = first && first.name ? String(first.name) : current.name || ''
  return {
    name,
    glyph: name ? name.slice(0, 1) : current.glyph || '',
    color: current.color || '#3d6afb',
  }
}

async function syncCurrentTaskDetail() {
  if (syncing.value) return
  const current = item.value
  if (!current) return
  const taskId = current.taskId ? String(current.taskId).trim() : String(current.id || '').trim()
  if (!taskId) return

  syncing.value = true
  try {
    taskState.value = ensureTaskState()
    let latestTask = findTask(taskState.value, taskId)
    const dateKey = resolveDateKey((latestTask && latestTask.date) || current.taskDate || (current.detail && current.detail.dateText) || current.createdAt)
    const logged = !!uni.getStorageSync('auth_logged_in')

    if (logged && dateKey) {
      try {
        const list = await tasksApi.getTaskInfoList({ startDate: dateKey, endDate: dateKey })
        const s = ensureTaskState()
        setTaskCursorDate(s, dateKey)
        replaceTaskList(s, list)
        taskState.value = ensureTaskState()
        latestTask = findTask(taskState.value, taskId) || latestTask
      } catch (e) {}
    }

    if (!latestTask) return

    const baseStars = Math.abs(Number(latestTask.hearts || (current.detail && current.detail.starText) || 0))
    const nextAction = latestTask.completedAtTs ? 'done' : current.action
    const doneAtText = latestTask.completedAtTs
      ? buildDoneAtText('done', latestTask.completedAtTs === 1 ? Date.now() : latestTask.completedAtTs)
      : current.detail && current.detail.doneAtText
        ? current.detail.doneAtText
        : uni.$t('未完成')
    const assignTo = resolveAssignee(latestTask, current.detail && current.detail.assignTo)

    const s = ensureActivityState()
    updateDynamic(s, id.value, {
      taskId,
      memberId: latestTask.memberId ? String(latestTask.memberId) : current.memberId ? String(current.memberId) : '',
      taskDate: latestTask.date || current.taskDate || '',
      action: nextAction,
      task: {
        ...(current.task || {}),
        title: latestTask.title || (current.task && current.task.title) || '',
        points: nextAction === 'done' ? baseStars : -baseStars,
        icon: taskIconFromTitle(latestTask.title || (current.task && current.task.title) || ''),
      },
      detail: {
        ...(current.detail || {}),
        dateText: formatTaskDateText(latestTask, current.detail && current.detail.dateText),
        repeatText: formatRepeatText(latestTask, current.detail && current.detail.repeatText),
        starText: String(baseStars),
        assignTo,
        doneAtText,
      },
    })
    state.value = ensureActivityState()
  } finally {
    syncing.value = false
  }
}

function back() {
  uni.navigateBack()
}

function editTitle() {
  if (!item.value) return
  const taskId = item.value.taskId ? String(item.value.taskId).trim() : String(item.value.id || '').trim()
  if (!taskId) {
    uni.showToast({ title: uni.$t('未找到任务ID'), icon: 'none' })
    return
  }
  const dateKey = resolveDateKey(item.value.taskDate || (item.value.detail && item.value.detail.dateText) || item.value.createdAt)
  const logged = !!uni.getStorageSync('auth_logged_in')
  if (logged && dateKey && !submitting.value) {
    submitting.value = true
    ;(async () => {
      try {
        const list = await tasksApi.getTaskInfoList({ startDate: dateKey, endDate: dateKey })
        const s = ensureTaskState()
        setTaskCursorDate(s, dateKey)
        replaceTaskList(s, list)
        taskState.value = ensureTaskState()
      } catch (e) {} finally {
        submitting.value = false
      }
      uni.navigateTo({ url: `/pages/tasks/task-form?id=${encodeURIComponent(taskId)}&date=${encodeURIComponent(dateKey)}` })
    })()
    return
  }
  const query = dateKey ? `&date=${encodeURIComponent(dateKey)}` : ''
  uni.navigateTo({ url: `/pages/tasks/task-form?id=${encodeURIComponent(taskId)}${query}` })
}

function remove() {
  if (!item.value) return
  uni.showModal({
    title: '',
    content: uni.$t('删除该动态？'),
    cancelText: uni.$t('取消'),
    confirmText: uni.$t('确定'),
    success: async (res) => {
      if (!res.confirm) return
      if (submitting.value) return
      submitting.value = true
      try {
        const dynamicId = item.value && item.value.id ? String(item.value.id).trim() : String(id.value || '').trim()
        if (!dynamicId) {
          uni.showToast({ title: uni.$t('缺少动态ID'), icon: 'none' })
          return
        }
        await noticeApi.deleteTaskDynamic({ dynamicId })
        const s = ensureActivityState()
        removeDynamic(s, dynamicId)
        state.value = ensureActivityState()
        uni.showToast({ title: uni.$t('删除成功'), icon: 'none' })
        setTimeout(() => {
          uni.navigateBack()
        }, 200)
      } catch (e) {
        uni.showToast({ title: String((e && e.message) || uni.$t('删除失败')), icon: 'none' })
      } finally {
        submitting.value = false
      }
    },
  })
}

async function toggleDone() {
  if (!item.value || submitting.value) return
  const taskId = item.value.taskId ? String(item.value.taskId).trim() : String(item.value.id || '').trim()
  let memberId = item.value.memberId ? String(item.value.memberId).trim() : ''
  if (!memberId) {
    const s = ensureTaskState()
    const t = findTask(s, taskId)
    if (t && t.memberId) memberId = String(t.memberId).trim()
    if (!memberId && t && Array.isArray(t.members) && t.members[0] && t.members[0].id) memberId = String(t.members[0].id).trim()
  }
  if (!taskId || !memberId) {
    uni.showToast({ title: uni.$t('缺少任务信息'), icon: 'none' })
    return
  }
  submitting.value = true
  const nextAction = item.value.action === 'done' ? 'cancel' : 'done'
  const baseStars = Math.abs(Number(item.value.task && item.value.task.points) || Number(item.value.detail && item.value.detail.starText) || 0)
  const stars = nextAction === 'done' ? baseStars : -baseStars
  const title = item.value.task && item.value.task.title ? String(item.value.task.title) : ''
  const reason = nextAction === 'done'
    ? (title ? `${uni.$t('完成任务')}:${title}` : uni.$t('完成任务'))
    : (title ? `${uni.$t('撤销完成任务')}:${title}` : uni.$t('撤销完成任务'))
  try {
    await tasksApi.completeTask({
      taskId,
      memberId,
      updateReason: reason,
      starNumber: stars,
    })
    const s = ensureActivityState()
    updateDynamic(s, id.value, {
      action: nextAction,
      task: { ...(item.value.task || {}), points: nextAction === 'done' ? baseStars : -baseStars },
      detail: {
        ...(item.value.detail || {}),
        doneAtText: buildDoneAtText(nextAction, Date.now()),
        starText: String(baseStars),
      },
    })
    state.value = ensureActivityState()
  } catch (e) {
    uni.showToast({ title: String((e && e.message) || uni.$t('操作失败')), icon: 'none' })
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: #ffffff;
  padding: 0 28rpx 220rpx;
}

.head {
  position: sticky;
  top: 0;
  z-index: 999;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
  padding: 18rpx 0 12rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.head-left {
  width: 120rpx;
  display: flex;
  align-items: center;
}

.back {
  font-size: 56rpx;
  font-weight: 700;
  line-height: 1;
  color: rgba(17, 17, 17, 0.85);
}

.head-title {
  font-size: 34rpx;
  font-weight: 900;
}

.head-right {
  width: 130rpx;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16rpx;
}

.action {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-icon {
  width: 30rpx;
  height: 30rpx;
  display: block;
}



.hero {
  margin-top: 26rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18rpx;
}

.big-icon {
  width: 220rpx;
  height: 220rpx;
  border-radius: 9999rpx;
  background: rgba(17, 17, 17, 0.03);
  display: flex;
  align-items: center;
  justify-content: center;
}

.big-glyph {
  font-size: 80rpx;
}

.task-title {
  font-size: 44rpx;
  font-weight: 900;
}

.panel {
  margin-top: 30rpx;
  background: #ffffff;
  border-radius: 28rpx;
  overflow: hidden;
  box-shadow: 0 10rpx 26rpx rgba(17, 17, 17, 0.06);
}

.row {
  padding: 32rpx 22rpx;
  display: flex;
  background: #fafafb;
  border-radius: 18rpx;
  box-sizing: border-box;
  align-items: center;
  gap: 14rpx;
}

.r-ico {
  width: 52rpx;
  height: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.r-ico-img {
  width: 30rpx;
  height: 30rpx;
  display: block;
}

.r-text {
  font-size: 28rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.8);
}

.line {
  height: 2rpx;
  background: rgba(17, 17, 17, 0.06);
}

.assignee {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.a-avatar {
  width: 44rpx;
  height: 44rpx;
  border-radius: 9999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.a-text {
  color: #ffffff;
  font-size: 24rpx;
  font-weight: 900;
}

.a-name {
  font-size: 28rpx;
  font-weight: 900;
}

.btn {
  position: fixed;
  left: 28rpx;
  right: 28rpx;
  height: 104rpx;
  border-radius: 9999rpx;
  background: rgba(17, 17, 17, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10rpx 24rpx rgba(17, 17, 17, 0.08);
}

.btn.disabled {
  opacity: 0.7;
}

.btn.primary {
  background: #3d6afb;
  box-shadow: 0 14rpx 30rpx rgba(61, 106, 251, 0.32);
}

.btn-text {
  font-size: 32rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.68);
}

.btn.primary .btn-text {
  color: #ffffff;
}
</style>
