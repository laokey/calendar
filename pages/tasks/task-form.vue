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
      <view class="field-title">
        <text class="req">*</text>
        <text>标题</text>
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
      <view class="row-right">
        <text class="val">{{ emoji || '无' }}</text>
        <image class="chev-img" src="/static/task/icon_chevron_down.png" mode="aspectFit" />
      </view>
    </view>

    <view class="block row-between">
      <view class="row-left">
        <image class="field-icon" src="/static/task/icon_calendar.png" mode="aspectFit" />
        <text class="label">日期</text>
      </view>
      <switch :checked="dateEnabled" color="#3d6afb" @change="dateEnabled = !!$event.detail.value" />
    </view>

    <view v-if="dateEnabled" class="block row-between" @click="openDate">
      <text class="val">{{ dateText }}</text>
      <image class="chev-img" src="/static/task/icon_chevron_right.png" mode="aspectFit" />
    </view>

    <view class="block row-between">
      <view class="row-left">
        <image class="field-icon" src="/static/task/icon_clock_blue.png" mode="aspectFit" />
        <text class="label">时间</text>
      </view>
      <switch :checked="timeEnabled" color="#3d6afb" @change="timeEnabled = !!$event.detail.value" />
    </view>

    <view v-if="timeEnabled" class="block row-between" @click="openTime">
      <text class="val">{{ time }}</text>
      <image class="chev-img" src="/static/task/icon_chevron_right.png" mode="aspectFit" />
    </view>

    <view class="block row-between">
      <view class="row-left">
        <image class="field-icon" src="/static/task/icon_repeat.png" mode="aspectFit" />
        <text class="label">重复</text>
      </view>
      <switch :checked="repeatEnabled" color="#3d6afb" @change="repeatEnabled = !!$event.detail.value" />
    </view>

    <view class="block">
      <view class="row-left">
        <view class="heart" />
        <text class="label">心心</text>
      </view>
    </view>

    <view v-if="tipOpen" class="tip">
      <text class="tip-text">用心心获取奖励，培养好习惯</text>
      <view class="tip-close" @click="tipOpen = false">
        <image class="tip-close-img" src="/static/task/icon_close_circle_grey.png" mode="aspectFit" />
      </view>
    </view>

    <view class="block row-between">
      <text class="label">心心数量</text>
      <view class="stepper">
        <view class="step" @click="hearts = Math.max(0, hearts - 1)"><text class="step-text">-</text></view>
        <text class="step-val">{{ hearts }}</text>
        <view class="step" @click="hearts = hearts + 1"><text class="step-text">+</text></view>
      </view>
    </view>

    <view class="block">
      <view class="field-title">
        <text class="req">*</text>
        <text>选择成员</text>
      </view>
      <view class="members">
        <view v-for="m in members" :key="m.id" class="mem" @click="memberId = m.id">
          <BlAvatar :glyph="m.glyph" :src="m.avatarUrl" :color="m.color" :size="72" />
          <view v-if="memberId === m.id" class="mem-check"><text class="check">✓</text></view>
          <text class="mem-name">{{ m.name }}</text>
        </view>
        <view class="mem add" @click="goAddMember">
          <view class="add-circle">
            <image class="add-plus-img" src="/static/task/icon_plus.png" mode="aspectFit" />
          </view>
          <text class="mem-name">添加</text>
        </view>
      </view>
    </view>

    <view class="block row-between" @click="openPriority">
      <view class="row-left">
        <image class="field-icon" src="/static/task/icon_bolt_blue.png" mode="aspectFit" />
        <text class="label">优先级</text>
      </view>
      <view class="row-right">
        <text class="val">{{ priorityText }}</text>
        <image class="chev-img" src="/static/task/icon_chevron_right.png" mode="aspectFit" />
      </view>
    </view>

    <view class="bottom-save" @click="save">
      <image class="bottom-save-bg" src="/static/task/bg_task_gradient_card.png" mode="scaleToFill" />
      <text class="bottom-save-text">保存</text>
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
            <view class="prio-dot" :style="{ background: opt.color }" />
            <text class="prio-text">{{ opt.label }}</text>
          </view>
          <view class="prio-right">
            <image
              class="prio-sel-img"
              :src="priorityDraft === opt.value ? '/static/task/icon_radio_on.png' : '/static/task/icon_radio_off.png'"
              mode="aspectFit"
            />
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
import { computed, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import BlAvatar from '../../components/BlAvatar.vue'
import BlHeader from '../../components/BlHeader.vue'
import BlSheet from '../../components/BlSheet.vue'
import BlDatePickerSheet from '../../components/BlDatePickerSheet.vue'
import BlTimePickerSheet from '../../components/BlTimePickerSheet.vue'
import { ensureCalendarState, listMembers } from '../../utils/calendarStore'
import { addTask, ensureTaskState, findTask, updateTask } from '../../utils/taskStore'

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
const hearts = ref(10)
const memberId = ref('me')
const priority = ref('none')

const tipOpen = ref(true)

const emojiSheetOpen = ref(false)
const dateSheetOpen = ref(false)
const timeSheetOpen = ref(false)
const prioritySheetOpen = ref(false)

const emojiOptions = ['笑', '酷', '赞', '爱', '星', '书', '钢', '跑', '洗', '吃', '球', '家']

function toCnDateText(key) {
  const parts = String(key || '').split('-')
  if (parts.length !== 3) return ''
  return `${parts[0]}年${Number(parts[1])}月${Number(parts[2])}日`
}

const dateText = computed(() => toCnDateText(date.value))

const members = computed(() => [
  { id: 'me', name: '我的', glyph: '我', color: '#4cc38a' },
  ...listMembers(calendarState.value).filter((m) => m.enabled !== false),
])

const priorityOptions = [
  { label: '高优先级', value: 'high', color: '#ff3b30' },
  { label: '中优先级', value: 'mid', color: '#ffb020' },
  { label: '低优先级', value: 'low', color: '#3d6afb' },
  { label: '无优先级', value: 'none', color: 'rgba(17, 17, 17, 0.2)' },
]

const priorityDraft = ref('none')

const priorityText = computed(() => {
  const opt = priorityOptions.find((x) => x.value === priority.value)
  return opt ? opt.label : '无优先级'
})

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
      hearts.value = Number(t.hearts || 0) || 0
      memberId.value = t.memberId || 'me'
      priority.value = t.priority || 'none'
    }
  }
})

onShow(() => {
  calendarState.value = ensureCalendarState()
})

function selectEmoji(e) {
  emoji.value = e
  emojiSheetOpen.value = false
}

function openDate() {
  dateSheetOpen.value = true
}

function onDatePicked(key) {
  date.value = key
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
  uni.navigateTo({ url: '/pages/calendar/member-add' })
}

function validate() {
  if (!String(title.value || '').trim()) {
    uni.showToast({ title: '请输入标题', icon: 'none' })
    return false
  }
  if (!memberId.value) {
    uni.showToast({ title: '请选择成员', icon: 'none' })
    return false
  }
  if (dateEnabled.value && !date.value) {
    uni.showToast({ title: '请选择日期', icon: 'none' })
    return false
  }
  return true
}

function save() {
  if (!validate()) return
  const payload = {
    title: title.value,
    emoji: emoji.value,
    dateEnabled: dateEnabled.value,
    date: date.value,
    timeEnabled: timeEnabled.value,
    time: time.value,
    repeat: repeatEnabled.value ? { unit: 'day', every: 1, id: `rp_${Date.now()}` } : null,
    hearts: hearts.value,
    priority: priority.value,
    memberId: memberId.value,
  }
  if (isEdit.value && taskId.value) {
    updateTask(taskState.value, taskId.value, payload)
  } else {
    addTask(taskState.value, payload)
  }
  uni.$emit && uni.$emit('task:refresh')
  uni.navigateBack()
}
</script>

<style scoped lang="scss">
.form-page {
  padding-bottom: 240rpx;
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
  background: #ffffff;
  border-radius: 28rpx;
  padding: 20rpx 22rpx;
  margin-top: 16rpx;
  box-shadow: 0 10rpx 26rpx rgba(17, 17, 17, 0.06);
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
  background: rgba(17, 17, 17, 0.04);
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

.row-left {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.row-right {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.label {
  font-size: 30rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.88);
}

.val {
  font-size: 28rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.6);
}

.field-icon {
  width: 28rpx;
  height: 28rpx;
  flex-shrink: 0;
  display: block;
}

.chev-img {
  width: 22rpx;
  height: 22rpx;
  display: block;
}

.heart {
  width: 26rpx;
  height: 26rpx;
  border-radius: 8rpx;
  background: #ffb020;
}

.tip {
  margin-top: 14rpx;
  background: #eaf2ff;
  border-radius: 18rpx;
  height: 76rpx;
  padding: 0 18rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.tip-text {
  font-size: 26rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.75);
}

.tip-close {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.tip-close-img {
  width: 28rpx;
  height: 28rpx;
  display: block;
}

.stepper {
  display: flex;
  align-items: center;
  gap: 18rpx;
}

.step {
  width: 62rpx;
  height: 62rpx;
  border-radius: 18rpx;
  background: rgba(17, 17, 17, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
}

.step-text {
  font-size: 34rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.75);
}

.step-val {
  min-width: 52rpx;
  text-align: center;
  font-size: 30rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.8);
}

.members {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
  padding-top: 10rpx;
}

.mem {
  width: 116rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.mem-check {
  position: absolute;
  top: 44rpx;
  right: 16rpx;
  width: 26rpx;
  height: 26rpx;
  border-radius: 999rpx;
  background: #2ecc71;
  display: flex;
  align-items: center;
  justify-content: center;
}

.check {
  font-size: 18rpx;
  font-weight: 900;
  color: #ffffff;
}

.mem-name {
  margin-top: 10rpx;
  font-size: 24rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.75);
}

.mem.add .mem-name {
  color: rgba(17, 17, 17, 0.55);
}

.add-circle {
  width: 72rpx;
  height: 72rpx;
  border-radius: 999rpx;
  background: rgba(17, 17, 17, 0.04);
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-plus-img {
  width: 28rpx;
  height: 28rpx;
  display: block;
}

.bottom-save {
  position: fixed;
  left: 28rpx;
  right: 28rpx;
  bottom: 34rpx;
  height: 104rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.bottom-save-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.bottom-save-text {
  position: relative;
  color: #ffffff;
  font-size: 34rpx;
  font-weight: 900;
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
  padding: 6rpx 0 10rpx;
}

.prio-item {
  height: 88rpx;
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

.prio-dot {
  width: 26rpx;
  height: 26rpx;
  border-radius: 999rpx;
}

.prio-text {
  font-size: 30rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.88);
}

.prio-sel-img {
  width: 34rpx;
  height: 34rpx;
  display: block;
}

.prio-actions {
  margin-top: 14rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.prio-btn {
  flex: 1;
  height: 92rpx;
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
