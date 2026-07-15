<template>
  <view class="bl-page form-page">
    <BlHeader :title="isEdit ? '编辑任务' : '添加任务'" back back-icon-src="/static/task/icon_nav_back_small.png">
      <template #right>
        <view class="top-save" @click="save">
          <text class="top-save-text">保存</text>
        </view>
      </template>
    </BlHeader>

    <view class="block">
      <view class="field-row">
        <view class="row-left">
          <image class="field-icon" src="/static/task/icon_title_t.png" mode="aspectFit" />
          <text class="req">*</text>
          <text class="label">标题</text>
        </view>
      </view>
      <view class="input-wrap">
        <input v-model="title" class="input" placeholder="请输入标题" placeholder-class="ph" />
      </view>
    </view>

    <view class="block row-between" @click="emojiSheetOpen = true">
      <view class="row-left">
        <image class="field-icon" src="/static/task/icon_smiley.png" mode="aspectFit" />
        <text class="label">表情符号(可选)</text>
      </view>
      <image class="chev-img" src="/static/task/icon_chevron_down.png" mode="aspectFit" />
    </view>

    <view class="block">
      <view class="row-between">
        <view class="row-left">
          <image class="field-icon" src="/static/common/icon_calendar.png" mode="aspectFit" />
          <text class="label">日期</text>
        </view>
        <switch :checked="dateEnabled" color="#3d6afb" @change="dateEnabled = !!$event.detail.value" />
      </view>
      <view v-if="dateEnabled" class="row-val-full" @click="openDate">
        <text class="val">{{ dateText }}</text>
      </view>
    </view>

    <view class="block row-between">
      <view class="row-left">
        <image class="field-icon" src="/static/task/icon_clock_grey.png" mode="aspectFit" />
        <text class="label">时间</text>
      </view>
      <switch :checked="timeEnabled" color="#3d6afb" @change="timeEnabled = !!$event.detail.value" />
    </view>

    <view v-if="timeEnabled" class="block row-between" @click="openTime">
      <text class="val">{{ time }}</text>
      <image class="chev-img" src="/static/task/icon_chevron_right.png" mode="aspectFit" />
    </view>

    <BlRepeatSection
      v-model="repeatEnabled"
      mode="full"
      theme="task"
      :repeat-icon-src="'/static/task/icon_repeat.png'"
      v-model:every="repeatEvery"
      v-model:unit="repeatUnit"
      :unit-options="repeatUnits"
      v-model:monthRule="repeatMonthRule"
      v-model:weekdays="repeatWeekdays"
      v-model:untilOn="repeatUntilOn"
      v-model:until="repeatUntil"
      :start-date="date"
      :default-until="date"
      @request-until-pick="openRepeatUntilDate"
    />

    <view class="block row-between">
      <view class="row-left">
        <image class="field-icon" src="/static/task/icon_heart_orange.png" mode="aspectFit" />
        <text class="label">心心</text>
      </view>
      <view class="row-right">
        <input v-model="heartsText" class="hearts-input" type="number" placeholder="0" placeholder-class="ph" />
        <view v-if="Number(heartsText) > 0" class="hearts-clear" @click.stop="heartsText = '0'">
          <image class="hearts-clear-img" src="/static/task/icon_close.png" mode="aspectFit" />
        </view>
      </view>
    </view>

    <view v-if="tipOpen" class="tip">
      <text class="tip-text">用心心获取奖励，培养好习惯</text>
      <view class="tip-close" @click="tipOpen = false">
        <image class="tip-close-img" src="/static/task/icon_close.png" mode="aspectFit" />
      </view>
    </view>

    <view class="block">
      <view class="field-row">
        <view class="row-left">
          <image class="field-icon" src="/static/task/icon_task_members_small.png" mode="aspectFit" />
          <text class="req">*</text>
          <text class="label">选择成员</text>
        </view>
      </view>
      <view class="members">
        <view v-for="m in members" :key="m.id" class="mem" @click="toggleMember(m.id)">
          <view class="avatar-wrap">
            <BlAvatar :glyph="m.glyph" :src="m.avatarUrl" :color="m.color" :size="84" />
            <view v-if="isMemberSelected(m.id)" class="mem-check-badge">
              <image class="badge-check-img" src="/static/task/icon_check_circle_green.png" mode="aspectFit" />
            </view>
          </view>
          <text class="mem-name">{{ m.name }}</text>
        </view>
        <view class="mem add" @click="goAddMember">
          <view class="add-circle">
            <image class="add-plus-img" src="/static/task/icon_chevron_right.png" mode="aspectFit" />
          </view>
          <text class="mem-name">添加</text>
        </view>
      </view>
    </view>

    <view class="block row-between" @click="openPriority">
      <view class="row-left">
        <image class="field-icon" src="/static/task/icon_bolt_black.png" mode="aspectFit" />
        <text class="label">优先级</text>
      </view>
      <view class="row-right">
        <text class="val">{{ priorityText }}</text>
        <image class="field-icon right-bolt" :class="{ 'is-none': priority === 'none' }" :src="priorityIconSrc" mode="aspectFit" />
      </view>
    </view>

    <view class="save-placeholder"></view>

    <view class="bottom-action">
      <button class="save-btn" @click="save">保存</button>
    </view>

    <BlSheet v-model="emojiSheetOpen" title="选择表情" :confirm-text="''">
      <view class="emoji-grid">
        <view v-for="e in emojiOptions" :key="e" class="emoji-item" @click="selectEmoji(e)">
          <text class="emoji-text">{{ e }}</text>
        </view>
        <view class="emoji-item clear" @click="selectEmoji('')">
          <text class="emoji-text">清除</text>
        </view>
      </view>
      <view class="sheet-cancel" @click="emojiSheetOpen = false"><text class="sheet-cancel-text">取消</text></view>
    </BlSheet>

    <BlDatePickerSheet v-model="dateSheetOpen" title="日期" :value="date" @confirm="onDatePicked" />

    <BlTimePickerSheet v-model="timeSheetOpen" title="时间" :value="time" @confirm="onTimePicked" />

    <BlSheet v-model="prioritySheetOpen" title="" :confirm-text="''">
      <view class="prio-sheet">
        <view v-for="opt in priorityOptions" :key="opt.value" class="prio-item" @click="priorityDraft = opt.value">
          <view class="prio-left">
            <image class="prio-icon" :src="opt.icon" mode="aspectFit" />
            <text class="prio-text">{{ opt.label }}</text>
          </view>
          <view class="prio-right">
            <image
              v-if="priorityDraft === opt.value"
              class="prio-check-img"
              src="/static/task/icon_check_circle_blue.png"
              mode="aspectFit"
            />
            <view v-else class="prio-radio" />
          </view>
        </view>
        <view class="prio-actions">
          <view class="prio-btn cancel" @click="prioritySheetOpen = false"><text class="prio-btn-text">取消</text></view>
          <view class="prio-btn ok" @click="confirmPriority"><text class="prio-btn-text ok-text">确认</text></view>
        </view>
      </view>
    </BlSheet>
  </view>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import BlAvatar from '../../components/BlAvatar.vue'
import BlHeader from '../../components/BlHeader.vue'
import BlSheet from '../../components/BlSheet.vue'
import BlDatePickerSheet from '../../components/BlDatePickerSheet.vue'
import BlTimePickerSheet from '../../components/BlTimePickerSheet.vue'
import BlRepeatSection from '../../components/BlRepeatSection.vue'
import { ensureCalendarState, listMembers, setMembers } from '../../utils/calendarStore'
import { addTask, ensureTaskState, findTask, updateTask } from '../../utils/taskStore'
import { membersApi, tasksApi } from '../../utils/api'

const taskState = ref(ensureTaskState())
const calendarState = ref(ensureCalendarState())

const isEdit = ref(false)
const taskId = ref('')

const title = ref('')
const emoji = ref('')
const dateEnabled = ref(true)
const date = ref('')
const timeEnabled = ref(false)
const time = ref('17:25')
const repeatEnabled = ref(false)
const repeatEvery = ref('1')
const repeatUnit = ref('day')
const repeatUntilOn = ref(false)
const repeatUntil = ref('')
const repeatMonthRule = ref(monthRuleFromDateKey(''))
const repeatWeekdays = ref([])
const hearts = ref(10)
const memberIds = ref([])
const priority = ref('none')

const tipOpen = ref(true)

const heartsText = computed({
  get() {
    const v = Number(hearts.value || 0)
    if (!Number.isFinite(v) || v <= 0) return '0'
    return String(Math.floor(v))
  },
  set(val) {
    const raw = String(val ?? '')
    const digits = raw.replace(/[^\d]/g, '')
    const n = digits ? Number(digits) : 0
    const safe = Number.isFinite(n) ? Math.max(0, Math.min(9999, Math.floor(n))) : 0
    hearts.value = safe
  },
})

const emojiSheetOpen = ref(false)
const dateSheetOpen = ref(false)
const dateKind = ref('task')
const timeSheetOpen = ref(false)
const prioritySheetOpen = ref(false)

const emojiOptions = ['笑', '酷', '赞', '爱', '星', '书', '钢', '跑', '洗', '吃', '球', '家']
const repeatUnits = [
  { label: '天', value: 'day' },
  { label: '周', value: 'week' },
  { label: '月', value: 'month' },
  { label: '年', value: 'year' },
]

function isRemoteTaskMode() {
  return !!uni.getStorageSync('auth_logged_in')
}

function toCnDateText(key) {
  const parts = String(key || '').split('-')
  if (parts.length !== 3) return ''
  return `${parts[0]}年${Number(parts[1])}月${Number(parts[2])}日`
}

function weekdayFromDateKey(key) {
  const parts = String(key || '').split('-')
  if (parts.length !== 3) return 0
  const y = Number(parts[0])
  const m = Number(parts[1])
  const d = Number(parts[2])
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return 0
  const dateObj = new Date(y, m - 1, d)
  const w = dateObj.getDay()
  return Number.isFinite(w) ? w : 0
}

function monthRuleFromDateKey(key, type = 'day') {
  const parts = String(key || '').split('-')
  if (parts.length !== 3) return { type, day: 1, nth: 1, weekday: 0 }
  const day = Number(parts[2])
  const weekday = weekdayFromDateKey(key)
  const safeDay = Number.isFinite(day) && day > 0 ? Math.floor(day) : 1
  return {
    type: type === 'weekday' ? 'weekday' : 'day',
    day: safeDay,
    nth: Math.floor((safeDay - 1) / 7) + 1,
    weekday,
  }
}

const dateText = computed(() => toCnDateText(date.value))

const members = computed(() => [
  // { id: 'me', name: '我的', glyph: '我', color: '#4cc38a' },
  ...listMembers(calendarState.value).filter((m) => m.enabled !== false),
])

function pickDefaultMemberId(list) {
  const src = Array.isArray(list) ? list : []
  const first = src.find((m) => m && m.id && m.enabled !== false)
  return first && first.id ? String(first.id) : ''
}

function resolveSelectedMemberIds() {
  const list = members.value
  const current = Array.isArray(memberIds.value) ? memberIds.value.map((x) => String(x || '').trim()).filter(Boolean) : []
  const valid = current.filter((id) => id !== 'me' && Array.isArray(list) && list.some((m) => m && String(m.id) === id))
  if (valid.length) return valid
  const fallback = pickDefaultMemberId(list)
  return fallback ? [fallback] : []
}

watch(
  members,
  () => {
    const next = resolveSelectedMemberIds()
    const current = Array.isArray(memberIds.value) ? memberIds.value.map((x) => String(x || '').trim()).filter(Boolean) : []
    if (next.join(',') !== current.join(',')) memberIds.value = next
  },
  { immediate: true },
)

const priorityOptions = [
  { label: '高优先级', value: 'high', icon: '/static/task/icon_bolt_red.png' },
  { label: '中优先级', value: 'mid', icon: '/static/task/icon_bolt_yellow.png' },
  { label: '低优先级', value: 'low', icon: '/static/task/icon_bolt_blue.png' },
  { label: '无优先级', value: 'none', icon: '/static/task/icon_bolt_black_small.png' },
]

const priorityDraft = ref('none')

const priorityText = computed(() => {
  const opt = priorityOptions.find((x) => x.value === priority.value)
  return opt ? opt.label : '无优先级'
})

const priorityIconSrc = computed(() => {
  const opt = priorityOptions.find((x) => x.value === priority.value)
  return opt ? opt.icon : '/static/task/icon_bolt_black_small.png'
})

watch(
  date,
  (next, prev) => {
    repeatMonthRule.value = monthRuleFromDateKey(next, repeatMonthRule.value && repeatMonthRule.value.type)
    const nextWeekday = weekdayFromDateKey(next)
    const prevWeekday = weekdayFromDateKey(prev)
    const current = Array.isArray(repeatWeekdays.value) ? repeatWeekdays.value.map((x) => Number(x)).filter((x) => Number.isFinite(x)) : []
    if (!current.length || (current.length === 1 && current[0] === prevWeekday)) {
      repeatWeekdays.value = [nextWeekday]
    }
  },
  { immediate: true },
)

onLoad((options) => {
  taskState.value = ensureTaskState()
  calendarState.value = ensureCalendarState()

  const id = options && options.id ? String(options.id) : ''
  const d = options && options.date ? String(options.date) : taskState.value.cursorDate
  date.value = d

  if (id) {
    isEdit.value = true
    taskId.value = id
    const t = findTask(taskState.value, id)
    if (t) {
      title.value = t.title || ''
      emoji.value = t.emoji || ''
      dateEnabled.value = !!t.dateEnabled
      date.value = t.date || d
      timeEnabled.value = !!t.timeEnabled
      time.value = t.time || time.value
      repeatEnabled.value = !!t.repeat
      repeatEvery.value = t && t.repeat && t.repeat.every ? String(t.repeat.every) : '1'
      repeatUnit.value = t && t.repeat && t.repeat.unit ? String(t.repeat.unit) : 'day'
      repeatUntilOn.value = !!(t && t.repeat && t.repeat.until)
      repeatUntil.value = t && t.repeat && t.repeat.until ? String(t.repeat.until) : ''
      repeatMonthRule.value =
        t && t.repeat && t.repeat.monthRule
          ? { ...repeatMonthRule.value, ...t.repeat.monthRule }
          : repeatMonthRule.value
      repeatWeekdays.value =
        t && t.repeat && Array.isArray(t.repeat.weekdays) ? t.repeat.weekdays.slice() : []
      hearts.value = Number(t.hearts || 0) || 0
      memberIds.value = t.memberId ? [String(t.memberId)] : []
      priority.value = t.priority || 'none'
    }
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
    calendarState.value = ensureCalendarState()
  })()
})

function selectEmoji(e) {
  emoji.value = e
  emojiSheetOpen.value = false
}

function openDate() {
  dateKind.value = 'task'
  dateSheetOpen.value = true
}

function onDatePicked(key) {
  if (dateKind.value === 'until') {
    repeatUntil.value = key
    return
  }
  date.value = key
}

function openRepeatUntilDate() {
  dateKind.value = 'until'
  dateSheetOpen.value = true
}

function openTime() {
  timeSheetOpen.value = true
}

function onTimePicked(t) {
  time.value = t
}

function openPriority() {
  priorityDraft.value = priority.value
  prioritySheetOpen.value = true
}

function confirmPriority() {
  priority.value = priorityDraft.value
  prioritySheetOpen.value = false
}

function goAddMember() {
  uni.navigateTo({ url: '/pages/members/member-add' })
}

function validate() {
  if (!String(title.value || '').trim()) {
    uni.showToast({ title: '请输入标题', icon: 'none' })
    return false
  }
  const mids = resolveSelectedMemberIds()
  if (!mids.length) {
    uni.showToast({ title: '请选择成员', icon: 'none' })
    return false
  }
  if (isRemoteTaskMode() && !date.value) {
    uni.showToast({ title: '请选择日期', icon: 'none' })
    return false
  }
  if (dateEnabled.value && !date.value) {
    uni.showToast({ title: '请选择日期', icon: 'none' })
    return false
  }
  return true
}

function isMemberSelected(id) {
  const key = String(id || '').trim()
  if (!key) return false
  return Array.isArray(memberIds.value) && memberIds.value.some((x) => String(x) === key)
}

function toggleMember(id) {
  const key = String(id || '').trim()
  if (!key) return
  const current = Array.isArray(memberIds.value) ? memberIds.value.map((x) => String(x || '').trim()).filter(Boolean) : []
  const idx = current.indexOf(key)
  if (idx >= 0) current.splice(idx, 1)
  else current.push(key)
  memberIds.value = current
  const next = resolveSelectedMemberIds()
  if (next.join(',') !== current.join(',')) memberIds.value = next
}

function buildRepeat(seed) {
  if (!repeatEnabled.value) return null
  return {
    unit: repeatUnit.value,
    every: Number(repeatEvery.value || 1) || 1,
    until: repeatUntilOn.value ? repeatUntil.value : '',
    monthRule: repeatUnit.value === 'month' ? repeatMonthRule.value : null,
    weekdays: repeatUnit.value === 'week' ? repeatWeekdays.value.slice() : null,
    id: `rp_${seed}`,
  }
}

async function save() {
  if (!validate()) return
  const resolvedMemberIds = resolveSelectedMemberIds()
  const basePayload = {
    title: title.value,
    emoji: emoji.value,
    dateEnabled: dateEnabled.value,
    date: date.value,
    timeEnabled: timeEnabled.value,
    time: time.value,
    hearts: hearts.value,
    priority: priority.value,
  }
  if (isRemoteTaskMode()) {
    if (isEdit.value && taskId.value) {
      uni.showLoading({ title: '保存中' })
      try {
        const primaryMemberId = resolvedMemberIds[0]
        const repeatValue = buildRepeat(Date.now())
        const res = await tasksApi.updateTaskInfo({
          taskId: taskId.value,
          taskDate: date.value,
          taskTitle: title.value,
          emoji: emoji.value,
          dateEnabled: dateEnabled.value,
          date: date.value,
          timeEnabled: timeEnabled.value,
          time: time.value,
          repeat: repeatValue,
          priority: priority.value,
          hearts: hearts.value,
          memberId: primaryMemberId,
        })
        if (res && typeof res === 'object' && res.code !== undefined && res.code !== 200 && res.code !== '200') {
          uni.showToast({ title: '保存失败', icon: 'none' })
          return
        }
        updateTask(taskState.value, taskId.value, { ...basePayload, repeat: repeatValue, memberId: primaryMemberId })

        if (resolvedMemberIds.length > 1) {
          for (let i = 1; i < resolvedMemberIds.length; i += 1) {
            const mid = resolvedMemberIds[i]
            await tasksApi.addTaskInfo({
              taskDate: date.value,
              taskTitle: title.value,
              emoji: emoji.value,
              dateEnabled: dateEnabled.value,
              date: date.value,
              timeEnabled: timeEnabled.value,
              time: time.value,
              repeat: buildRepeat(`${Date.now()}_${i}`),
              priority: priority.value,
              starNumber: hearts.value,
              memberId: mid,
            })
          }
        }

        uni.$emit && uni.$emit('task:refresh')
        uni.navigateBack()
      } catch (e) {
        uni.showToast({ title: String((e && e.message) || '保存失败'), icon: 'none' })
      } finally {
        try {
          uni.hideLoading()
        } catch (e) {}
      }
      return
    }
    try {
      uni.showLoading({ title: '保存中' })
      for (let i = 0; i < resolvedMemberIds.length; i += 1) {
        const mid = resolvedMemberIds[i]
        await tasksApi.addTaskInfo({
          taskDate: date.value,
          taskTitle: title.value,
          emoji: emoji.value,
          dateEnabled: dateEnabled.value,
          date: date.value,
          timeEnabled: timeEnabled.value,
          time: time.value,
          repeat: buildRepeat(`${Date.now()}_${i}`),
          priority: priority.value,
          starNumber: hearts.value,
          memberId: mid,
        })
      }
      uni.$emit && uni.$emit('task:refresh')
      uni.navigateBack()
    } catch (e) {
      uni.showToast({ title: String((e && e.message) || '保存失败'), icon: 'none' })
    } finally {
      try {
        uni.hideLoading()
      } catch (e) {}
    }
    return
  }
  if (isEdit.value && taskId.value) {
    const primaryMemberId = resolvedMemberIds[0]
    updateTask(taskState.value, taskId.value, { ...basePayload, repeat: buildRepeat(Date.now()), memberId: primaryMemberId })
    if (resolvedMemberIds.length > 1) {
      for (let i = 1; i < resolvedMemberIds.length; i += 1) {
        const mid = resolvedMemberIds[i]
        addTask(taskState.value, { ...basePayload, repeat: buildRepeat(`${Date.now()}_${i}`), memberId: mid })
      }
    }
  } else {
    for (let i = 0; i < resolvedMemberIds.length; i += 1) {
      const mid = resolvedMemberIds[i]
      addTask(taskState.value, { ...basePayload, repeat: buildRepeat(`${Date.now()}_${i}`), memberId: mid })
    }
  }
  uni.$emit && uni.$emit('task:refresh')
  uni.navigateBack()
}
</script>

<style scoped lang="scss">
.form-page {
  padding: 28rpx 8rpx 40rpx;
  background: #ffffff;
  min-height: 100vh;
  box-sizing: border-box;
}

:deep(.bl-header) {
  margin-left: -8rpx !important;
  margin-right: -8rpx !important;
}

.save-placeholder {
  height: 160rpx;
}

.top-save {
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 12rpx;
}

.top-save-text {
  color: #3d6afb;
  font-size: 30rpx;
  font-weight: 900;
}

.block {
  background: #fafafa;
  border-radius: 28rpx;
  padding: 24rpx 28rpx;
  margin: 20rpx 0 0;
}

.field-title {
  display: flex;
  align-items: center;
  gap: 6rpx;
  font-size: 26rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.8);
  margin-bottom: 12rpx;
}

.req {
  color: #ff3b30;
}

.input-wrap {
  height: 96rpx;
  border-radius: 24rpx;
  background: #fafafa;
  padding: 0 18rpx;
  display: flex;
  align-items: center;
}

.input {
  width: 100%;
  font-size: 34rpx;
  font-weight: 900;
  color: #111111;
}

.ph {
  color: rgba(17, 17, 17, 0.35);
}

.row-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.block {
  background: #fafafa;
  border-radius: 28rpx;
  padding: 24rpx 28rpx;
  margin: 20rpx 28rpx 0;
}

.field-row {
  display: flex;
  align-items: center;
  margin-bottom: 12rpx;
}

.req {
  color: #ff4d4f;
  margin-right: 4rpx;
}

.input-wrap {
  height: 96rpx;
  border-radius: 24rpx;
  background: #fafafa;
  padding: 0 20rpx;
  display: flex;
  align-items: center;
}

.input {
  width: 100%;
  font-size: 32rpx;
  font-weight: 800;
  color: #111111;
}

.ph {
  color: rgba(17, 17, 17, 0.25);
}

.row-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.row-left {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.row-right {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.label {
  font-size: 30rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.85);
}

.hearts-input {
  width: 140rpx;
  text-align: right;
  font-size: 32rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.9);
}

.hearts-clear {
  width: 44rpx;
  height: 44rpx;
  border-radius: 9999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hearts-clear-img {
  width: 24rpx;
  height: 24rpx;
  opacity: 0.55;
}

.row-val-full {
  margin-top: 12rpx;
  padding-left: 56rpx;
}

.val {
  font-size: 28rpx;
  font-weight: 700;
  color: rgba(17, 17, 17, 0.55);
}

.field-icon {
  width: 40rpx;
  height: 40rpx;
  flex-shrink: 0;
  display: block;
}

.right-bolt {
  opacity: 0.25;
}

.right-bolt.is-none {
  opacity: 0.35;
}

.chev-img {
  width: 28rpx;
  height: 28rpx;
  display: block;
}

.tip {
  margin: 20rpx 0 0;
  background: #f0f5ff;
  border-radius: 28rpx;
  height: 84rpx;
  padding: 0 28rpx 0 84rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.tip-text {
  font-size: 28rpx;
  font-weight: 700;
  color: rgba(17, 17, 17, 0.7);
}

.tip-close {
  width: 44rpx;
  height: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tip-close-img {
  width: 24rpx;
  height: 24rpx;
  display: block;
  opacity: 0.4;
}

.members {
  display: flex;
  flex-wrap: wrap;
  gap: 24rpx;
  padding-top: 16rpx;
}

.mem {
  width: 110rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.avatar-wrap {
  position: relative;
  width: 84rpx;
  height: 84rpx;
}

.mem-check-badge {
  position: absolute;
  right: -2rpx;
  bottom: -2rpx;
  width: 32rpx;
  height: 32rpx;
  background: #ffffff;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.1);
}

.badge-check-img {
  width: 28rpx;
  height: 28rpx;
}

.mem-name {
  margin-top: 12rpx;
  font-size: 24rpx;
  font-weight: 700;
  color: rgba(17, 17, 17, 0.65);
}

.add-circle {
  width: 80rpx;
  height: 80rpx;
  border-radius: 999rpx;
  background: #ffffff;
  border: 2rpx solid rgba(17, 17, 17, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-plus-img {
  width: 62rpx;
  height: 62rpx;
  display: block;
  opacity: 0.7;
}

.mem.add .mem-name {
  color: rgba(17, 17, 17, 0.45);
}

.bottom-action {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 20rpx 28rpx calc(20rpx + env(safe-area-inset-bottom));
  background: #ffffff;
}

.save-btn {
  width: 100%;
  height: 100rpx;
  background: #3d6afb;
  border-radius: 999rpx;
  color: #ffffff;
  font-size: 34rpx;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
}

.save-btn::after {
  border: none;
}

.emoji-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 18rpx;
  padding: 10rpx 0 0;
}

.emoji-item {
  width: 150rpx;
  height: 80rpx;
  border-radius: 20rpx;
  background: rgba(17, 17, 17, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
}

.emoji-item.clear {
  background: rgba(61, 106, 251, 0.12);
}

.emoji-text {
  font-size: 28rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.75);
}

.sheet-cancel {
  margin-top: 18rpx;
  height: 92rpx;
  border-radius: 999rpx;
  background: rgba(17, 17, 17, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
}

.sheet-cancel-text {
  font-size: 32rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.8);
}

.prio-sheet {
  padding: 10rpx 18rpx 18rpx;
}

.prio-item {
  height: 92rpx;
  padding: 0 10rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.prio-left {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.prio-icon {
  width: 34rpx;
  height: 34rpx;
  display: block;
}

.prio-text {
  font-size: 30rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.88);
}

.prio-radio {
  width: 34rpx;
  height: 34rpx;
  border-radius: 999rpx;
  border: 4rpx solid rgba(17, 17, 17, 0.18);
  box-sizing: border-box;
  background: #ffffff;
}

.prio-check-img {
  width: 34rpx;
  height: 34rpx;
  display: block;
}

.prio-actions {
  margin-top: 14rpx;
  display: flex;
  align-items: center;
  gap: 18rpx;
}

.prio-btn {
  flex: 1;
  height: 96rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.prio-btn.cancel {
  background: rgba(17, 17, 17, 0.06);
}

.prio-btn.ok {
  background: #3d6afb;
}

.prio-btn-text {
  font-size: 32rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.8);
}

.ok-text {
  color: #ffffff;
}
</style>
