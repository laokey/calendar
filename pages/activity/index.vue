<template>
  <view class="page">
    <view class="tabs" :style="{ paddingTop: safeTop + 'px' }">
      <view class="tab" @click="setTab('dynamic')">
        <text class="tab-text" :class="{ active: tab === 'dynamic' }">{{ $t('动态') }}</text>
        <view v-if="tab === 'dynamic'" class="underline" />
      </view>
      <view class="tab" @click="setTab('notice')">
        <text class="tab-text" :class="{ active: tab === 'notice' }">{{ $t('通知') }}</text>
        <view v-if="tab === 'notice'" class="underline" />
      </view>
      <view class="tab" @click="setTab('invite')">
        <text class="tab-text" :class="{ active: tab === 'invite' }">{{ $t('邀请') }}</text>
        <view v-if="tab === 'invite'" class="underline" />
      </view>
    </view>

    <view v-if="tab === 'dynamic'">
      <view v-if="state.dynamics.length === 0" class="empty">
        <image class="empty-img" src="/static/message/img_empty_activity.png" mode="widthFix" />
        <text class="empty-text">{{ $t('暂无动态') }}</text>
      </view>

      <view v-else class="list">
        <view v-for="item in state.dynamics" :key="item.id" class="card" @click="openDynamic(item.id)">
          <view class="head">
            <view class="avatar" :style="{ background: item.who.color }">
              <text class="avatar-text">{{ item.who.glyph }}</text>
            </view>
            <text class="name">{{ item.who.name }}</text>
            <text class="time">{{ item.whenText }}</text>
          </view>
          <view class="body">
            <view class="left">
              <text class="desc">“{{ item.who.name }}”{{ item.action === 'done' ? $t('完成了任务') : $t('取消了任务') }}</text>
              <view class="row">
                <text class="task">{{ item.task.title }}</text>
                <view class="points">
                  <image class="star-icon" src="/static/message/icon_star.png" mode="aspectFit" />
                  <text class="points-text">{{ item.task.points > 0 ? '+' + item.task.points : item.task.points }}</text>
                </view>
              </view>
            </view>
            <view class="right">
              <view class="task-icon">
                <text class="task-glyph">{{ item.task.icon === 'run' ? '🏃' : '🥣' }}</text>
                <view v-if="item.action === 'done'" class="done-badge"><text class="done-text">✓</text></view>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <view v-else-if="tab === 'notice'">
      <view v-if="state.notices.length === 0" class="empty">
        <image class="empty-img" src="/static/message/img_empty_activity.png" mode="widthFix" />
        <text class="empty-text">{{ $t('暂无通知') }}</text>
      </view>

      <view v-else class="list">
        <view v-for="n in state.notices" :key="n.id" class="notice" @click="openNotice(n.id)">
          <view class="n-head">
            <view class="n-icon">
              <image
                class="n-icon-img"
                :src="n.type === 'message' ? '/static/message/icon_notice_bell.png' : '/static/message/icon_notice_speaker.png'"
                mode="aspectFit"
              />
            </view>
            <text class="n-title">{{ n.title }}</text>
            <text class="n-time">{{ n.timeText }}</text>
          </view>
          <text class="n-sub">{{ n.subject }}</text>
          <text class="n-body">{{ n.preview }}</text>
          <view class="n-foot">
            <text class="n-more">{{ $t('查看详情') }}</text>
            <text class="n-chev">›</text>
          </view>
        </view>
      </view>
    </view>

    <view v-else>
      <view v-if="state.invites.length === 0" class="empty">
        <image class="empty-img" src="/static/message/img_empty_activity.png" mode="widthFix" />
        <text class="empty-text">{{ $t('暂无邀请') }}</text>
      </view>

      <view v-else class="list">
        <view v-for="inv in state.invites" :key="inv.id" class="invite">
          <view class="head">
            <view class="avatar" :style="{ background: inv.from.color }">
              <text class="avatar-text">{{ inv.from.glyph }}</text>
            </view>
            <text class="name">{{ inv.from.name }}</text>
            <text class="time">{{ inv.timeText }}</text>
          </view>
          <view class="inv-text">
            <text>{{ $t('邀请你加入') }}</text>
            <text class="inv-link">{{ inv.calendarName }}</text>
          </view>
          <view class="inv-actions">
            <view class="btn light" @click="reject(inv.id)"><text class="btn-text light-text">{{ $t('取消') }}</text></view>
            <view class="btn" @click="accept(inv.id)"><text class="btn-text">{{ $t('确定') }}</text></view>
          </view>
        </view>
      </view>
    </view>

    <BlBottomNav active="magic" />
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import BlBottomNav from '../../components/BlBottomNav.vue'
import { ensureActivityState, replaceActivityCollections, removeInvite, updateDynamic } from '../../utils/activityStore'
import { ensureCalendarState, findMember } from '../../utils/calendarStore'
import { ensureTaskState, findTask, replaceTaskList, setTaskCursorDate } from '../../utils/taskStore'
import { noticeApi, tasksApi, usersApi } from '../../utils/api'

const tab = ref('dynamic')
const state = ref(ensureActivityState())
const submitting = ref(false)
const syncingDynamics = ref(false)

onLoad((options) => {
  if (options && options.tab) {
    const t = String(options.tab)
    if (t === 'dynamic' || t === 'notice' || t === 'invite') tab.value = t
  }
})

onShow(() => {
  ;(async () => {
    await refresh()
    await syncDynamicTasks()
  })()
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

function setTab(t) {
  tab.value = t
}

function showError(error, fallback, map = {}) {
  const code = Number(error && error.code)
  const msg = map[code] || String((error && error.message) || fallback || uni.$t('操作失败'))
  uni.showToast({ title: msg, icon: 'none' })
}

function pad(n) {
  return String(n).padStart(2, '0')
}

function formatDateTime(ts) {
  const d = new Date(ts)
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
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

async function syncDynamicTasks() {
  if (syncingDynamics.value) return
  const list = Array.isArray(state.value.dynamics) ? state.value.dynamics.slice() : []
  if (!list.length) return

  syncingDynamics.value = true
  try {
    const taskState = ensureTaskState()
    const logged = !!uni.getStorageSync('auth_logged_in')
    const dateKeys = Array.from(
      new Set(
        list
          .map((item) => resolveDateKey(item.taskDate || (item.detail && item.detail.dateText) || item.createdAt))
          .filter(Boolean),
      ),
    )

    if (logged && dateKeys.length) {
      for (const key of dateKeys) {
        try {
          const remoteTasks = await tasksApi.getTaskInfoList({ startDate: key, endDate: key })
          setTaskCursorDate(taskState, key)
          replaceTaskList(taskState, remoteTasks)
        } catch (e) {}
      }
    }

    const latestState = ensureTaskState()
    const activityState = ensureActivityState()

    for (const dynamic of list) {
      const taskId = dynamic && dynamic.taskId ? String(dynamic.taskId).trim() : String((dynamic && dynamic.id) || '').trim()
      if (!taskId) continue
      const task = findTask(latestState, taskId)
      if (!task) continue
      const baseStars = Math.abs(Number(task.hearts || (dynamic.detail && dynamic.detail.starText) || 0))
      const action = task.completedAtTs ? 'done' : dynamic.action
      updateDynamic(activityState, dynamic.id, {
        taskId,
        taskDate: task.date || dynamic.taskDate || '',
        action,
        task: {
          ...(dynamic.task || {}),
          title: task.title || (dynamic.task && dynamic.task.title) || '',
          points: action === 'done' ? baseStars : -baseStars,
          icon: taskIconFromTitle(task.title || (dynamic.task && dynamic.task.title) || ''),
        },
        detail: {
          ...(dynamic.detail || {}),
          dateText: formatTaskDateText(task, dynamic.detail && dynamic.detail.dateText),
          repeatText: formatRepeatText(task, dynamic.detail && dynamic.detail.repeatText),
          starText: String(baseStars),
          assignTo: resolveAssignee(task, dynamic.detail && dynamic.detail.assignTo),
          doneAtText: task.completedAtTs
            ? `完成于 ${formatDateTime(task.completedAtTs === 1 ? Date.now() : task.completedAtTs)}`
            : dynamic.detail && dynamic.detail.doneAtText
              ? dynamic.detail.doneAtText
              : uni.$t('未完成'),
        },
      })
    }

    state.value = ensureActivityState()
  } finally {
    syncingDynamics.value = false
  }
}

async function refresh() {
  const [dynamicRes, noticeRes, inviteRes] = await Promise.allSettled([
    noticeApi.getDynamicList(),
    noticeApi.getNoticeList(),
    noticeApi.getInviteList(),
  ])
  const s = ensureActivityState()
  replaceActivityCollections(s, {
    dynamics: dynamicRes.status === 'fulfilled' ? dynamicRes.value : [],
    notices: noticeRes.status === 'fulfilled' ? noticeRes.value : [],
    invites: inviteRes.status === 'fulfilled' ? inviteRes.value : [],
  })
  state.value = ensureActivityState()
  const firstError = [dynamicRes, noticeRes, inviteRes].find((item) => item.status === 'rejected')
  if (firstError && firstError.status === 'rejected') {
    showError(firstError.reason, uni.$t('加载失败'), { 201: uni.$t('用户不存在') })
  }
}

function openDynamic(id) {
  uni.navigateTo({ url: `/pages/activity/dynamic-detail?id=${encodeURIComponent(id)}` })
}

function openNotice(id) {
  uni.navigateTo({ url: `/pages/activity/notice-detail?id=${encodeURIComponent(id)}` })
}

async function accept(id) {
  const item = (state.value.invites || []).find((x) => x.id === id)
  if (!item || !item.inviterEmail || submitting.value) return
  submitting.value = true
  try {
    await usersApi.agreeAddFriend({ inviterEmail: item.inviterEmail })
    uni.showToast({ title: uni.$t('已加入'), icon: 'none' })
    const s = ensureActivityState()
    removeInvite(s, id)
    state.value = ensureActivityState()
  } catch (e) {
    showError(e, uni.$t('操作失败'), { 201: uni.$t('用户不存在'), 202: uni.$t('添加失败') })
  } finally {
    submitting.value = false
  }
}

async function reject(id) {
  const item = (state.value.invites || []).find((x) => x.id === id)
  if (!item || !item.inviterEmail || submitting.value) return
  submitting.value = true
  try {
    await usersApi.refuseAddFriend({ inviterEmail: item.inviterEmail })
    uni.showToast({ title: uni.$t('已取消'), icon: 'none' })
    const s = ensureActivityState()
    removeInvite(s, id)
    state.value = ensureActivityState()
  } catch (e) {
    showError(e, uni.$t('操作失败'), { 201: uni.$t('用户不存在'), 202: uni.$t('拒绝失败') })
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: #ffffff;
  padding-bottom: 220rpx;
}

.tabs {
  padding: 18rpx 28rpx 12rpx;
  display: flex;
  align-items: center;
  gap: 60rpx;
}

.tab {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8rpx;
}

.tab-text {
  font-size: 30rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.6);
}

.tab-text.active {
  font-size: 44rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.9);
}

.underline {
  width: 40rpx;
  height: 8rpx;
  align-self: center;
  border-radius: 9999rpx;
  background: #3d6afb;
}

.empty {
  padding: 220rpx 28rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.empty-img {
  width: 280rpx;
}

.empty-text {
  margin-top: 18rpx;
  font-size: 26rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.45);
}

.list {
  padding: 10rpx 28rpx 0;
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.card {
  background: #ffffff;
  border-radius: 28rpx;
  padding: 22rpx;
  box-shadow: 0 10rpx 26rpx rgba(17, 17, 17, 0.06);
}

.head {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.avatar {
  width: 56rpx;
  height: 56rpx;
  border-radius: 9999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-text {
  color: #ffffff;
  font-size: 28rpx;
  font-weight: 900;
}

.name {
  font-size: 30rpx;
  font-weight: 900;
}

.time {
  margin-left: auto;
  font-size: 24rpx;
  font-weight: 700;
  color: rgba(17, 17, 17, 0.45);
}

.body {
  margin-top: 18rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.desc {
  display: block;
  font-size: 26rpx;
  font-weight: 700;
  color: rgba(17, 17, 17, 0.6);
}

.row {
  margin-top: 10rpx;
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.task {
  font-size: 32rpx;
  font-weight: 800;
  color: #333333;
}

.points {
  height: 44rpx;
  padding: 0 14rpx;
  border-radius: 9999rpx;
  background: rgba(17, 17, 17, 0.04);
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.star-icon {
  width: 26rpx;
  height: 26rpx;
}

.points-text {
  font-size: 26rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.65);
}

.task-icon {
  width: 120rpx;
  height: 86rpx;
  border-radius: 22rpx;
  background: rgba(17, 17, 17, 0.04);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.task-glyph {
  font-size: 40rpx;
}

.done-badge {
  position: absolute;
  top: 6rpx;
  right: 6rpx;
  width: 38rpx;
  height: 38rpx;
  border-radius: 9999rpx;
  background: #34c38f;
  display: flex;
  align-items: center;
  justify-content: center;
}

.done-text {
  color: #ffffff;
  font-size: 22rpx;
  font-weight: 900;
}

.notice {
  background: #ffffff;
  border-radius: 28rpx;
  padding: 22rpx;
  box-shadow: 0 10rpx 26rpx rgba(17, 17, 17, 0.06);
}

.n-head {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.n-icon {
  width: 56rpx;
  height: 56rpx;
  border-radius: 9999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.n-icon-img {
  width: 56rpx;
  height: 56rpx;
}

.n-title {
  font-size: 30rpx;
  font-weight: 900;
}

.n-time {
  margin-left: auto;
  font-size: 24rpx;
  font-weight: 700;
  color: rgba(17, 17, 17, 0.45);
}

.n-sub {
  display: block;
  margin-top: 14rpx;
  font-size: 32rpx;
  font-weight: 900;
}

.n-body {
  display: block;
  margin-top: 10rpx;
  font-size: 26rpx;
  line-height: 40rpx;
  font-weight: 700;
  color: rgba(17, 17, 17, 0.6);
}

.n-foot {
  margin-top: 18rpx;
  padding-top: 16rpx;
  border-top: 2rpx solid rgba(17, 17, 17, 0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.n-more {
  font-size: 26rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.7);
}

.n-chev {
  font-size: 34rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.25);
}

.invite {
  background: #ffffff;
  border-radius: 28rpx;
  padding: 22rpx;
  box-shadow: 0 10rpx 26rpx rgba(17, 17, 17, 0.06);
}

.inv-text {
  margin-top: 14rpx;
  font-size: 28rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.7);
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.inv-link {
  color: #3d6afb;
  font-weight: 900;
}

.inv-actions {
  margin-top: 16rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.btn {
  flex: 1;
  height: 84rpx;
  border-radius: 9999rpx;
  background: #3d6afb;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn.light {
  background: #eef2ff;
}

.btn-text {
  color: #ffffff;
  font-size: 30rpx;
  font-weight: 900;
}

.light-text {
  color: #3d6afb;
}
</style>
