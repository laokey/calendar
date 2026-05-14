<template>
  <view class="bl-page form-page">
    <BlHeader :title="isEdit ? '编辑任务' : '添加任务'" back>
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
        <view class="face" />
        <text class="label">表情符号(可选)</text>
      </view>
      <view class="row-right">
        <text class="val">{{ emoji || '无' }}</text>
        <text class="chev">˅</text>
      </view>
    </view>

    <view class="block row-between">
      <view class="row-left">
        <view class="cal" />
        <text class="label">日期</text>
      </view>
      <switch :checked="dateEnabled" color="#3d6afb" @change="dateEnabled = !!$event.detail.value" />
    </view>

    <view v-if="dateEnabled" class="block row-between" @click="openDate">
      <text class="val">{{ dateText }}</text>
      <text class="chev">›</text>
    </view>

    <view class="block row-between">
      <view class="row-left">
        <view class="clock" />
        <text class="label">时间</text>
      </view>
      <switch :checked="timeEnabled" color="#3d6afb" @change="timeEnabled = !!$event.detail.value" />
    </view>

    <view v-if="timeEnabled" class="block row-between" @click="openTime">
      <text class="val">{{ time }}</text>
      <text class="chev">›</text>
    </view>

    <view class="block row-between">
      <view class="row-left">
        <view class="repeat" />
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
      <view class="tip-close" @click="tipOpen = false"><text class="tip-close-text">×</text></view>
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
          <BlAvatar :glyph="m.glyph" :color="m.color" :size="72" />
          <view v-if="memberId === m.id" class="mem-check"><text class="check">✓</text></view>
          <text class="mem-name">{{ m.name }}</text>
        </view>
        <view class="mem add" @click="goAddMember">
          <view class="add-circle"><text class="add-plus">+</text></view>
          <text class="mem-name">添加</text>
        </view>
      </view>
    </view>

    <view class="block row-between" @click="openPriority">
      <view class="row-left">
        <view class="bolt" />
        <text class="label">优先级</text>
      </view>
      <view class="row-right">
        <text class="val">{{ priorityText }}</text>
        <text class="chev">›</text>
      </view>
    </view>

    <view class="bottom-save" @click="save">
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

    <BlSheet v-model="dateSheetOpen" title="日期" confirm-text="确定" @confirm="confirmDate">
      <picker-view class="pv" :value="dateIndices" @change="onDateChange">
        <picker-view-column class="col">
          <view v-for="y in years" :key="y" class="pv-item"><text class="pv-text">{{ y }}</text></view>
        </picker-view-column>
        <picker-view-column class="col">
          <view v-for="m in months" :key="m" class="pv-item"><text class="pv-text">{{ m }}</text></view>
        </picker-view-column>
        <picker-view-column class="col">
          <view v-for="d in days" :key="d" class="pv-item"><text class="pv-text">{{ d }}</text></view>
        </picker-view-column>
      </picker-view>
    </BlSheet>

    <BlSheet v-model="timeSheetOpen" title="时间" confirm-text="确定" @confirm="confirmTime">
      <picker-view class="pv" :value="timeIndices" @change="onTimeChange">
        <picker-view-column class="col">
          <view v-for="h in hours" :key="h" class="pv-item"><text class="pv-text">{{ h }}</text></view>
        </picker-view-column>
        <picker-view-column class="col">
          <view v-for="m in minutes" :key="m" class="pv-item"><text class="pv-text">{{ m }}</text></view>
        </picker-view-column>
      </picker-view>
    </BlSheet>

    <BlSheet v-model="prioritySheetOpen" title="" :confirm-text="''">
      <view class="prio-sheet">
        <view v-for="opt in priorityOptions" :key="opt.value" class="prio-item" @click="priorityDraft = opt.value">
          <view class="prio-left">
            <view class="prio-dot" :style="{ background: opt.color }" />
            <text class="prio-text">{{ opt.label }}</text>
          </view>
          <view class="prio-right">
            <view v-if="priorityDraft === opt.value" class="prio-check"><text class="prio-check-text">✓</text></view>
            <view v-else class="prio-empty" />
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

const years = Array.from({ length: 21 }, (_, i) => 2020 + i)
const months = Array.from({ length: 12 }, (_, i) => i + 1)
const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))
const dateIndices = ref([0, 0, 0])
const timeIndices = ref([0, 0])

const days = computed(() => {
  const y = years[dateIndices.value[0]] || 2026
  const m = months[dateIndices.value[1]] || 1
  const last = new Date(y, m, 0).getDate()
  return Array.from({ length: last }, (_, i) => i + 1)
})

function syncDateIndicesByKey(key) {
  const parts = String(key || '').split('-')
  const y = parts.length === 3 ? Number(parts[0]) : 2026
  const m = parts.length === 3 ? Number(parts[1]) : 1
  const d = parts.length === 3 ? Number(parts[2]) : 1
  const yIdx = Math.max(0, years.indexOf(y))
  const mIdx = Math.max(0, months.indexOf(m))
  const last = new Date(y, m, 0).getDate()
  const day = Math.min(Math.max(1, d), last)
  dateIndices.value = [yIdx, mIdx, day - 1]
}

function syncTimeIndicesByValue(t) {
  const parts = String(t || '').split(':')
  const h = parts.length === 2 ? parts[0] : '00'
  const mm = parts.length === 2 ? parts[1] : '00'
  const hIdx = Math.max(0, hours.indexOf(h))
  const mIdx = Math.max(0, minutes.indexOf(mm))
  timeIndices.value = [hIdx, mIdx]
}

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
  syncDateIndicesByKey(date.value)
  dateSheetOpen.value = true
}

function onDateChange(e) {
  const v = e && e.detail ? e.detail.value : []
  if (!Array.isArray(v) || v.length < 3) return
  const yIdx = v[0]
  const mIdx = v[1]
  const dIdx = v[2]
  dateIndices.value = [yIdx, mIdx, dIdx]
  const y = years[yIdx] || 2026
  const m = months[mIdx] || 1
  const last = new Date(y, m, 0).getDate()
  if (dIdx > last - 1) dateIndices.value = [yIdx, mIdx, last - 1]
}

function confirmDate() {
  const y = years[dateIndices.value[0]] || 2026
  const m = months[dateIndices.value[1]] || 1
  const d = days.value[dateIndices.value[2]] || 1
  date.value = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  dateSheetOpen.value = false
}

function openTime() {
  syncTimeIndicesByValue(time.value)
  timeSheetOpen.value = true
}

function onTimeChange(e) {
  const v = e && e.detail ? e.detail.value : []
  if (!Array.isArray(v) || v.length < 2) return
  timeIndices.value = [v[0], v[1]]
}

function confirmTime() {
  const h = hours[timeIndices.value[0]] || '00'
  const m = minutes[timeIndices.value[1]] || '00'
  time.value = `${h}:${m}`
  timeSheetOpen.value = false
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

.chev {
  font-size: 34rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.4);
}

.face,
.cal,
.clock,
.repeat,
.bolt {
  width: 28rpx;
  height: 28rpx;
  border-radius: 8rpx;
  background: rgba(17, 17, 17, 0.12);
}

.clock,
.repeat {
  border-radius: 999rpx;
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

.tip-close-text {
  font-size: 42rpx;
  font-weight: 700;
  color: rgba(17, 17, 17, 0.45);
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

.add-plus {
  font-size: 40rpx;
  font-weight: 700;
  color: rgba(17, 17, 17, 0.6);
}

.bottom-save {
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

.bottom-save-text {
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

.pv {
  height: 420rpx;
  margin-top: 6rpx;
}

.pv-item {
  height: 84rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pv-text {
  font-size: 34rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.88);
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

.prio-empty {
  width: 34rpx;
  height: 34rpx;
  border-radius: 999rpx;
  background: rgba(17, 17, 17, 0.12);
}

.prio-check {
  width: 34rpx;
  height: 34rpx;
  border-radius: 999rpx;
  background: #3d6afb;
  display: flex;
  align-items: center;
  justify-content: center;
}

.prio-check-text {
  color: #ffffff;
  font-size: 22rpx;
  font-weight: 900;
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

