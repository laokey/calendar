<template>
  <view class="bl-page detail-page">
    <BlHeader back back-icon-src="/static/task/icon_nav_back_small.png">
      <template #right>
        <view class="actions">
          <view class="action" @click="goEdit">
            <image class="action-icon" src="/static/task/icon_edit_square.png" mode="aspectFit" />
          </view>
          <view class="action" @click="askDelete">
            <image class="action-icon danger" src="/static/task/icon_trash_red.png" mode="aspectFit" />
          </view>
        </view>
      </template>
    </BlHeader>

    <view class="hero">
      <view class="hero-left">
        <text class="hero-title">{{ task.title }}</text>
        <text class="hero-sub">{{ dateText }}</text>
      </view>
      <view class="hero-right">
        <view class="prio" :style="{ background: prioColor(task.priority) }" />
      </view>
    </view>

    <view v-if="task.repeat" class="block row">
      <image class="row-icon" src="/static/task/icon_repeat.png" mode="aspectFit" />
      <text class="row-text">每日</text>
    </view>

    <view class="block row">
      <image class="row-icon is-heart" src="/static/task/icon_heart_orange.png" mode="aspectFit" />
      <text class="row-text">{{ task.hearts }}</text>
    </view>

    <view class="block assign-block">
      <view class="row-between">
        <view class="row-left">
          <image class="row-icon" src="/static/task/icon_task_members_small.png" mode="aspectFit" />
          <text class="row-text">分配给</text>
        </view>
      </view>
      <view class="assign-row">
        <BlAvatar :glyph="memberGlyph(task.memberId)" :src="memberAvatar(task.memberId)" :color="memberColor(task.memberId)" :size="72" />
        <text class="assign-name">{{ memberName(task.memberId) }}</text>
        <image v-if="isDone" class="done-check-img" src="/static/task/icon_check_circle_green_small.png" mode="aspectFit" />
      </view>
    </view>

    <view v-if="isDone" class="block done-time">
      <image class="row-icon" src="/static/task/icon_clock_blue.png" mode="aspectFit" />
      <text class="done-text">{{ doneStatusText }}</text>
    </view>

    <view class="bottom" :class="{ grey: isDone }" @click="toggleDone">
      <text class="bottom-text">{{ isDone ? '标记为未完成' : '标记为完成' }}</text>
      <view class="bottom-icon">
        <image
          class="bottom-icon-img"
          :src="isDone ? '/static/task/icon_close_circle_grey.png' : '/static/task/icon_check_circle_blue.png'"
          mode="aspectFit"
        />
      </view>
    </view>

    <BlSheet v-model="deleteSheetOpen" title="" :confirm-text="''">
      <view class="action-list">
        <view class="action-item" @click="doDelete('one')"><text class="action-text">删除此任务</text></view>
        <view class="action-item" @click="doDelete('future')"><text class="action-text">删除此任务和所有后续任务</text></view>
        <view class="action-item" @click="doDelete('all')"><text class="action-text">删除所有任务</text></view>
        <view class="action-cancel" @click="deleteSheetOpen = false"><text class="action-cancel-text">取消</text></view>
      </view>
    </BlSheet>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import BlAvatar from '../../components/BlAvatar.vue'
import BlHeader from '../../components/BlHeader.vue'
import BlSheet from '../../components/BlSheet.vue'
import { ensureCalendarState, listMembers, setMembers } from '../../utils/calendarStore'
import { deleteTask, ensureTaskState, findTask, markTaskDone, markTaskUndone, taskDetailDateText } from '../../utils/taskStore'
import { membersApi, tasksApi } from '../../utils/api'

const taskState = ref(ensureTaskState())
const calendarState = ref(ensureCalendarState())

const task = ref({
  id: '',
  title: '',
  emoji: '',
  dateEnabled: true,
  date: '',
  timeEnabled: false,
  time: '',
  repeat: null,
  hearts: 0,
  priority: 'none',
  memberId: 'me',
  completedAtTs: 0,
})

const deleteSheetOpen = ref(false)

function isRemoteTaskMode() {
  return !!uni.getStorageSync('auth_logged_in')
}

function isRemoteTaskItem() {
  return !!(task.value && task.value.remote && isRemoteTaskMode())
}

function refresh(id) {
  taskState.value = ensureTaskState()
  calendarState.value = ensureCalendarState()
  const t = id ? findTask(taskState.value, id) : null
  if (!t) return false
  task.value = t
  return true
}

onLoad((options) => {
  const id = options && options.id ? String(options.id) : ''
  const ok = refresh(id)
  if (!ok) {
    uni.showToast({ title: '任务不存在', icon: 'none' })
    setTimeout(() => uni.navigateBack(), 350)
  }
})

onShow(() => {
  ;(async () => {
    if (isRemoteTaskMode()) {
      try {
        const list = await membersApi.getMemberList()
        setMembers(calendarState.value, membersApi.mapRemoteMembersToLocalMembers(list))
      } catch (e) {}
    }
    if (task.value && task.value.id) refresh(task.value.id)
  })()
})

const dateText = computed(() => taskDetailDateText(task.value))
const isDone = computed(() => !!task.value.completedAtTs)

function doneAtText() {
  const ts = Number(task.value.completedAtTs || 0)
  if (!Number.isFinite(ts) || ts < 100000000000) return ''
  const d = new Date(task.value.completedAtTs)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${y}.${m}.${day} ${hh}:${mm}`
}

const doneAtTextVal = computed(() => doneAtText())
const doneStatusText = computed(() => (doneAtTextVal.value ? `完成于 ${doneAtTextVal.value}` : '已完成'))

function memberList() {
  return [{ id: 'me', name: '我的', glyph: '我', color: '#4cc38a' }, ...listMembers(calendarState.value).filter((m) => m.enabled !== false)]
}

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

function memberName(id) {
  const m = memberList().find((x) => x.id === id)
  return m ? m.name : ''
}

function prioColor(p) {
  if (p === 'high') return '#ff3b30'
  if (p === 'mid') return '#ffb020'
  if (p === 'low') return '#3d6afb'
  return 'rgba(17, 17, 17, 0.2)'
}

function goEdit() {
  if (isRemoteTaskItem()) {
    uni.showToast({ title: '接口文档暂未提供编辑任务接口', icon: 'none' })
    return
  }
  uni.navigateTo({ url: `/pages/tasks/task-form?id=${task.value.id}` })
}

function askDelete() {
  if (isRemoteTaskItem()) {
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
    return
  }
  if (task.value.repeat && task.value.repeat.id) {
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

async function doDelete(scope) {
  deleteSheetOpen.value = false
  if (isRemoteTaskItem()) {
    try {
      await tasksApi.deleteTaskInfo({ taskId: task.value.id })
      deleteTask(taskState.value, task.value.id, 'one')
      uni.$emit && uni.$emit('task:refresh')
      uni.navigateBack()
    } catch (e) {}
    return
  }
  deleteTask(taskState.value, task.value.id, scope)
  uni.$emit && uni.$emit('task:refresh')
  uni.navigateBack()
}

async function toggleDone() {
  if (isRemoteTaskItem()) {
    if (isDone.value) {
      uni.showToast({ title: '接口文档暂未提供撤销完成接口', icon: 'none' })
      return
    }
    try {
      await tasksApi.completeTask({
        taskId: task.value.id,
        memberId: task.value.memberId,
        updateReason: task.value.title ? `完成任务:${task.value.title}` : '完成任务',
        starNumber: Number(task.value.hearts || 0) || 0,
      })
      markTaskDone(taskState.value, task.value.id)
      refresh(task.value.id)
      uni.$emit && uni.$emit('task:refresh')
    } catch (e) {}
    return
  }
  if (isDone.value) {
    markTaskUndone(taskState.value, task.value.id)
  } else {
    markTaskDone(taskState.value, task.value.id)
  }
  refresh(task.value.id)
  uni.$emit && uni.$emit('task:refresh')
}
</script>

<style scoped lang="scss">
.detail-page {
  padding-bottom: 240rpx;
}

.actions {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.action {
  height: 64rpx;
  padding: 0 18rpx;
  border-radius: 16rpx;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
}

.action-icon {
  width: 28rpx;
  height: 28rpx;
  display: block;
}

.action-text {
  font-size: 26rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.85);
}

.action.danger {
  color: #ff3b30;
}

.danger-text {
  color: #ff3b30;
}

.hero {
  margin-top: 10rpx;
  background: #eaf2ff;
  border-radius: 28rpx;
  padding: 26rpx 24rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.hero-title {
  font-size: 36rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.95);
}

.hero-sub {
  margin-top: 10rpx;
  display: block;
  font-size: 26rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.6);
}

.prio {
  width: 26rpx;
  height: 26rpx;
  border-radius: 8rpx;
}

.block {
  background: #ffffff;
  border-radius: 28rpx;
  padding: 20rpx 22rpx;
  margin-top: 16rpx;
  box-shadow: 0 10rpx 26rpx rgba(17, 17, 17, 0.06);
}

.row {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.row-text {
  font-size: 30rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.88);
}

.row-icon {
  width: 30rpx;
  height: 30rpx;
  flex-shrink: 0;
  display: block;
}

.row-icon.is-heart {
  width: 28rpx;
  height: 28rpx;
}

.assign-block {
  padding: 20rpx 22rpx 18rpx;
}

.row-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.row-left {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.assign-row {
  margin-top: 16rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.assign-name {
  flex: 1;
  margin-left: 14rpx;
  font-size: 30rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.9);
}

.done-check-img {
  width: 44rpx;
  height: 44rpx;
  display: block;
}

.done-time {
  background: #eaf2ff;
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.done-text {
  color: #3d6afb;
  font-size: 28rpx;
  font-weight: 900;
}

.bottom {
  position: fixed;
  left: 28rpx;
  right: 28rpx;
  bottom: 34rpx;
  height: 104rpx;
  background: #3d6afb;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bottom.grey {
  background: rgba(17, 17, 17, 0.12);
}

.bottom-text {
  color: #ffffff;
  font-size: 34rpx;
  font-weight: 900;
}

.bottom.grey .bottom-text {
  color: rgba(17, 17, 17, 0.65);
}

.bottom-icon {
  position: absolute;
  right: 18rpx;
  width: 72rpx;
  height: 72rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.92);
  display: flex;
  align-items: center;
  justify-content: center;
}

.bottom.grey .bottom-icon {
  background: rgba(255, 255, 255, 0.7);
}

.bottom-icon-img {
  width: 36rpx;
  height: 36rpx;
  display: block;
}

.bottom.grey .bottom-icon-text {
  color: rgba(17, 17, 17, 0.6);
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
</style>
