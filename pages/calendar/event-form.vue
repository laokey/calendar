<template>
  <view class="bl-page form-page">
    <BlHeader :title="isEdit ? '编辑事件' : '添加事项'" back>
      <template #right>
        <view class="top-save" @click="save">
          <text class="top-save-text">保存</text>
        </view>
      </template>
    </BlHeader>

    <view class="block">
      <view class="field-title">
                <image class="field-icon" src="/static/calendar/icon_form_title_edit.png" mode="aspectFit" />

        <text class="req">*</text>
        <text>标题</text>
      </view>
      <view class="input-wrap">
        <input v-model="title" class="input" :placeholder="isEdit ? '' : '请输入标题'" placeholder-class="ph" />
      </view>
    </view>

    <view class="block row-between">
      <view class="row-left">
        <text class="label">全天</text>
      </view>
      <switch :checked="allDay" color="#3d6afb" @change="allDay = !!$event.detail.value" />
    </view>

    <view v-if="!allDay" class="time-grid">
      <view class="time-card" @click="openDate('start')">
        <view class="time-head">
          <image class="field-icon is-clock" src="/static/calendar/icon_form_clock.png" mode="aspectFit" />
          <text class="time-label">开始时间</text>
        </view>
        <text class="time-val">{{ startDateText }}</text>
      </view>
      <view class="time-card" @click="openTime('start')">
        <view class="time-head">
          <image class="field-icon is-clock" src="/static/calendar/icon_form_clock.png" mode="aspectFit" />
          <text class="time-label">&nbsp;</text>
        </view>
        <text class="time-val">{{ startTime }}</text>
      </view>

      <view class="time-card" @click="openDate('end')">
        <view class="time-head">
          <image class="field-icon is-clock" src="/static/calendar/icon_form_clock.png" mode="aspectFit" />
          <text class="time-label">结束时间</text>
        </view>
        <text class="time-val">{{ endDateText }}</text>
      </view>
      <view class="time-card" @click="openTime('end')">
        <view class="time-head">
          <image class="field-icon is-clock" src="/static/calendar/icon_form_clock.png" mode="aspectFit" />
          <text class="time-label">&nbsp;</text>
        </view>
        <text class="time-val">{{ endTime }}</text>
      </view>
    </view>

    <view v-else class="block">
      <view class="row-between" @click="openDate('start')">
        <view class="row-left">
          <image class="field-icon is-clock" src="/static/calendar/icon_form_clock.png" mode="aspectFit" />
          <text class="label">开始时间</text>
        </view>
        <text class="val">{{ startDateText }}</text>
      </view>
      <view class="divider" />
      <view class="row-between" @click="openDate('end')">
        <view class="row-left">
          <image class="field-icon is-clock" src="/static/calendar/icon_form_clock.png" mode="aspectFit" />
          <text class="label">结束时间</text>
        </view>
        <text class="val">{{ endDateText }}</text>
      </view>
    </view>

    <view class="block row-between">
      <view class="row-left">
        <image class="field-icon is-target" src="/static/calendar/icon_refresh.png" mode="aspectFit" />
        <text class="label">重复</text>
      </view>
      <switch :checked="repeatOn" color="#3d6afb" @change="onRepeatToggle" />
    </view>

    <view v-if="repeatOn" class="block repeat-block">
      <view class="repeat-row">
        <text class="label">每一个</text>
        <view class="repeat-right">
          <input v-model="repeatEvery" class="every-input" type="number" />
          <view class="unit-wrap">
            <BlSegmented v-model="repeatUnit" :options="repeatUnits" />
          </view>
        </view>
      </view>
      <view v-if="repeatUnit === 'month'" class="repeat-row" @click="openRepeatMonthRule">
        <view class="row-left">
          <image class="field-icon is-edit" src="/static/calendar/icon_form_title_edit.png" mode="aspectFit" />
          <text class="label">在什么时候</text>
        </view>
        <view class="repeat-month">
          <view class="repeat-pill is-active"><text class="repeat-pill-text">{{ monthRuleTextLeft }}</text></view>
          <view class="repeat-pill"><text class="repeat-pill-text">{{ monthRuleTextRight }}</text></view>
        </view>
      </view>
      <view class="repeat-row row-between">
        <view class="row-left">
          <image class="field-icon is-target" src="/static/calendar/icon_form_target.png" mode="aspectFit" />
          <text class="label">重复直到</text>
        </view>
        <switch :checked="repeatUntilOn" color="#3d6afb" @change="repeatUntilOn = !!$event.detail.value" />
      </view>
      <view v-if="repeatUntilOn" class="repeat-row row-between" @click="openDate('until')">
        <text class="label">截止</text>
        <text class="val">{{ repeatUntilText }}</text>
      </view>
    </view>

    <view class="block">
      <view class="field-title">
        <image class="field-icon" src="/static/calendar/icon_form_members.png" mode="aspectFit" />
                <text class="req">*</text>
        <text>选择成员</text>
      </view>
      <view class="members">
        <view v-for="m in selectedMembers" :key="m.id" class="mem" @click="openMemberSelect">
          <BlAvatar :glyph="m.glyph" :src="m.avatarUrl" :color="m.color" :size="72" />
          <view class="mem-check"><text class="check">✓</text></view>
          <text class="mem-name">{{ m.name }}</text>
        </view>
        <view class="mem add" @click="openMemberSelect">
          <view class="add-circle">
            <image class="add-plus-img" src="/static/calendar/icon_plus.png" mode="aspectFit" />
          </view>
          <text class="mem-name">添加</text>
        </view>
      </view>
    </view>

    <view class="block">
      <view class="row-between" @click="toggleSync">
        <view class="row-left">
          <image class="field-icon" src="/static/calendar/icon_form_location_alt.png" mode="aspectFit" />
          <text class="label">同步日历</text>
        </view>
        <image class="chev-img" :class="{ 'is-open': syncOpen }" src="/static/calendar/icon_chevron_down.png" mode="aspectFit" />
      </view>
      <view v-if="syncOpen" class="sync-body">
        <view class="row-between sync-row">
          <text class="val">无</text>
          <image class="radio-img" src="/static/calendar/icon_check_on.png" mode="aspectFit" />
        </view>
        <view class="sync-add">
          <text class="sync-add-text">+ 添加</text>
        </view>
      </view>
    </view>

    <view class="block">
      <view class="row-left">
        <image class="field-icon" src="/static/calendar/icon_form_edit.png" mode="aspectFit" />
        <text class="label">描述</text>
      </view>
      <view class="input-wrap is-textarea">
        <textarea v-model="desc" class="textarea" :placeholder="isEdit ? '' : '请输入描述'" placeholder-class="ph" />
      </view>
    </view>

    <view class="block">
      <view class="row-left">
        <image class="field-icon" src="/static/calendar/icon_form_location.png" mode="aspectFit" />
        <text class="label">定位&天气</text>
      </view>
      <view class="input-wrap">
        <input v-model="location" class="input" :placeholder="isEdit ? '' : '请输入描述'" placeholder-class="ph" />
      </view>
    </view>

    <view class="bottom-save" @click="save">
      <image class="bottom-save-bg" src="/static/calendar/btn_primary_gradient.png" mode="scaleToFill" />
      <text class="bottom-save-text">保存</text>
    </view>

    <BlDatePickerSheet v-model="dateSheetOpen" :title="dateSheetTitle" :value="activeDateValue" @confirm="onDatePicked" />

    <BlTimePickerSheet v-model="timeSheetOpen" title="时间" :value="activeTimeValue" @confirm="onTimePicked" />

    <BlSheet v-model="repeatSheetOpen" title="" :confirm-text="''">
      <view class="repeat-actions">
        <view class="repeat-action" @click="applyRepeatEdit('this')"><text class="repeat-action-text">本次活动</text></view>
        <view class="repeat-action" @click="applyRepeatEdit('future')"><text class="repeat-action-text">本次活动和未来活动</text></view>
        <view class="repeat-action" @click="applyRepeatEdit('all')"><text class="repeat-action-text">所有活动</text></view>
        <view class="repeat-cancel" @click="repeatSheetOpen = false"><text class="repeat-cancel-text">取消</text></view>
      </view>
    </BlSheet>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import BlAvatar from '../../components/BlAvatar.vue'
import BlHeader from '../../components/BlHeader.vue'
import BlSegmented from '../../components/BlSegmented.vue'
import BlSheet from '../../components/BlSheet.vue'
import BlDatePickerSheet from '../../components/BlDatePickerSheet.vue'
import BlTimePickerSheet from '../../components/BlTimePickerSheet.vue'
import {
  addEvent,
  ensureCalendarState,
  findEvent,
  listMembers,
  saveCalendarState,
  updateEvent,
} from '../../utils/calendarStore'

const state = ref(ensureCalendarState())
const members = ref(listMembers(state.value))

const isEdit = ref(false)
const eventId = ref('')
const originalHasRepeat = ref(false)

const title = ref('')
const allDay = ref(false)
const startDate = ref('')
const startTime = ref('22:00')
const endDate = ref('')
const endTime = ref('23:00')
const desc = ref('')
const location = ref('')
const tagColor = ref('#4c8dff')

const repeatOn = ref(false)
const repeatEvery = ref('1')
const repeatUnit = ref('day')
const repeatUntilOn = ref(false)
const repeatUntil = ref('')
const monthRule = ref({ type: 'day', day: 27, nth: 4, weekday: 5 })

const selectedMemberIds = ref([])
const syncOpen = ref(false)

const repeatUnits = [
  { label: '天', value: 'day' },
  { label: '周', value: 'week' },
  { label: '月', value: 'month' },
  { label: '年', value: 'year' },
]

const repeatSheetOpen = ref(false)
const pendingSave = ref(null)

const dateSheetOpen = ref(false)
const dateKind = ref('start')

const timeSheetOpen = ref(false)
const timeKind = ref('start')

const dateSheetTitle = computed(() => {
  if (dateKind.value === 'start') return '开始时间'
  if (dateKind.value === 'end') return '结束时间'
  return '结束时间'
})

function toCnDateText(key) {
  const parts = String(key || '').split('-')
  if (parts.length !== 3) return ''
  return `${parts[0]}年${Number(parts[1])}月${Number(parts[2])}日`
}

const startDateText = computed(() => toCnDateText(startDate.value))
const endDateText = computed(() => toCnDateText(endDate.value))
const repeatUntilText = computed(() => toCnDateText(repeatUntil.value))

const monthRuleTextLeft = computed(() => `${monthRule.value.day}号`)
const monthRuleTextRight = computed(() => `第${monthRule.value.nth}个星期${['日', '一', '二', '三', '四', '五', '六'][monthRule.value.weekday]}`)

const selectedMembers = computed(() =>
  (selectedMemberIds.value || [])
    .map((id) => members.value.find((m) => m.id === id))
    .filter((x) => !!x),
)

const activeDateValue = computed(() => {
  if (dateKind.value === 'end') return endDate.value
  if (dateKind.value === 'until') return repeatUntil.value || endDate.value
  return startDate.value
})

const activeTimeValue = computed(() => (timeKind.value === 'end' ? endTime.value : startTime.value))

onLoad((options) => {
  state.value = ensureCalendarState()
  members.value = listMembers(state.value)

  const id = options && options.id ? String(options.id) : ''
  const date = options && options.date ? String(options.date) : ''
  if (id) {
    isEdit.value = true
    eventId.value = id
    const ev = findEvent(state.value, id)
    if (ev) {
      title.value = ev.title || ''
      allDay.value = !!ev.allDay
      startDate.value = ev.startDate || date || state.value.cursorDate
      startTime.value = ev.startTime || '22:00'
      endDate.value = ev.endDate || startDate.value
      endTime.value = ev.endTime || '23:00'
      desc.value = ev.desc || ''
      location.value = ev.location || ''
      tagColor.value = ev.tagColor || '#4c8dff'
      selectedMemberIds.value = Array.isArray(ev.memberIds) ? ev.memberIds.slice() : []
      repeatOn.value = !!ev.repeat
      originalHasRepeat.value = !!ev.repeat
      if (ev.repeat) {
        repeatEvery.value = String(ev.repeat.every || 1)
        repeatUnit.value = ev.repeat.unit || 'day'
        repeatUntilOn.value = !!ev.repeat.until
        repeatUntil.value = ev.repeat.until || ''
        monthRule.value = ev.repeat.monthRule || monthRule.value
      }
      return
    }
  }

  startDate.value = date || state.value.cursorDate
  endDate.value = startDate.value
})

onShow(() => {
  state.value = ensureCalendarState()
  members.value = listMembers(state.value)
  if (eventId.value) {
    const ev = findEvent(state.value, eventId.value)
    if (ev && Array.isArray(ev.memberIds)) selectedMemberIds.value = ev.memberIds.slice()
  } else {
    try {
      const raw = uni.getStorageSync('calendar_member_select_tmp')
      if (raw) {
        const ids = typeof raw === 'string' ? JSON.parse(raw) : raw
        if (Array.isArray(ids)) selectedMemberIds.value = ids.slice()
        uni.removeStorageSync('calendar_member_select_tmp')
      }
    } catch (e) {}
  }
})

function openDate(kind) {
  dateKind.value = kind
  dateSheetOpen.value = true
}

function openTime(kind) {
  timeKind.value = kind
  timeSheetOpen.value = true
}

function onDatePicked(key) {
  if (dateKind.value === 'start') {
    startDate.value = key
    if (endDate.value < key) endDate.value = key
  } else if (dateKind.value === 'end') {
    endDate.value = key
    if (startDate.value > key) startDate.value = key
  } else if (dateKind.value === 'until') {
    repeatUntil.value = key
  }
}

function onTimePicked(t) {
  if (timeKind.value === 'start') startTime.value = t
  if (timeKind.value === 'end') endTime.value = t
}

function onRepeatToggle(e) {
  repeatOn.value = !!(e && e.detail ? e.detail.value : false)
  if (!repeatOn.value) {
    repeatUntilOn.value = false
    repeatUntil.value = ''
  }
}

function openMemberSelect() {
  const ids = encodeURIComponent(JSON.stringify(selectedMemberIds.value || []))
  uni.navigateTo({ url: `/pages/members/members-select?ids=${ids}&from=${encodeURIComponent(isEdit.value ? 'edit' : 'add')}` })
}

function toggleSync() {
  syncOpen.value = !syncOpen.value
}

function openRepeatMonthRule() {
  uni.showToast({ title: '该项为展示占位', icon: 'none' })
}

function buildPayload() {
  const n = String(title.value || '').trim()
  const payload = {
    title: n,
    allDay: !!allDay.value,
    startDate: startDate.value,
    startTime: startTime.value,
    endDate: endDate.value,
    endTime: endTime.value,
    memberIds: selectedMemberIds.value.slice(),
    desc: desc.value,
    location: location.value,
    color: payloadColor(),
    tagColor: tagColor.value,
    repeat: repeatOn.value
      ? {
          every: Number(repeatEvery.value || 1) || 1,
          unit: repeatUnit.value,
          until: repeatUntilOn.value ? repeatUntil.value : '',
          monthRule: repeatUnit.value === 'month' ? monthRule.value : null,
        }
      : null,
  }
  return payload
}

function payloadColor() {
  const ids = selectedMemberIds.value || []
  if (!ids.length) return '#eef4ff'
  const m = members.value.find((x) => x.id === ids[0])
  if (!m) return '#eef4ff'
  const c = String(m.color || '#3d6afb')
  if (c === '#3d6afb' || c === '#4c8dff') return '#eaf2ff'
  if (c === '#ff5a5f') return '#fdecee'
  if (c === '#4cc38a') return '#eaf7f1'
  return '#ffffff'
}

function validate() {
  const n = String(title.value || '').trim()
  if (!n) {
    uni.showToast({ title: '请输入标题', icon: 'none' })
    return false
  }
  if (!selectedMemberIds.value.length) {
    uni.showToast({ title: '请选择成员', icon: 'none' })
    return false
  }
  if (!startDate.value || !endDate.value) {
    uni.showToast({ title: '请选择日期', icon: 'none' })
    return false
  }
  return true
}

function save() {
  if (!validate()) return
  const payload = buildPayload()
  if (isEdit.value) {
    if (originalHasRepeat.value && payload.repeat) {
      pendingSave.value = payload
      repeatSheetOpen.value = true
      return
    }
    updateEvent(state.value, eventId.value, payload)
    uni.$emit && uni.$emit('calendar:refresh')
    uni.navigateBack()
    return
  }
  addEvent(state.value, payload)
  saveCalendarState(state.value)
  uni.$emit && uni.$emit('calendar:refresh')
  uni.navigateBack()
}

function applyRepeatEdit(scope) {
  repeatSheetOpen.value = false
  if (!pendingSave.value) return
  updateEvent(state.value, eventId.value, pendingSave.value)
  pendingSave.value = null
  uni.$emit && uni.$emit('calendar:refresh')
  if (scope === 'this') {
    uni.showToast({ title: '已应用到本次活动', icon: 'none' })
  } else if (scope === 'future') {
    uni.showToast({ title: '已应用到未来活动', icon: 'none' })
  }
  uni.navigateBack()
}
</script>

<style scoped lang="scss">
.form-page {
  padding-bottom: 240rpx;
  background: #ffffff;
  min-height: 100vh;
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

.input-wrap.is-textarea {
  height: 140rpx;
  align-items: flex-start;
  padding-top: 16rpx;
}

.input {
  flex: 1;
  font-size: 34rpx;
  font-weight: 900;
  color: #111111;
}

.textarea {
  width: 100%;
  height: 110rpx;
  font-size: 30rpx;
  font-weight: 700;
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

.divider {
  height: 1rpx;
  background: rgba(17, 17, 17, 0.08);
  margin: 14rpx 0;
}

.time-grid {
  margin-top: 16rpx;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14rpx;
}

.time-card {
  background: #ffffff;
  border-radius: 28rpx;
  padding: 20rpx 22rpx;
  box-shadow: 0 10rpx 26rpx rgba(17, 17, 17, 0.06);
}

.time-head {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.time-label {
  font-size: 26rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.85);
}

.time-val {
  margin-top: 8rpx;
  font-size: 26rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.65);
}

.field-icon {
  width: 30rpx;
  height: 30rpx;
  flex-shrink: 0;
  display: block;
}

.repeat-block {
  padding: 18rpx 22rpx;
}

.repeat-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 14rpx;
}

.repeat-row:first-child {
  margin-top: 0;
}

.repeat-right {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.every-input {
  width: 80rpx;
  height: 72rpx;
  border-radius: 20rpx;
  background: rgba(17, 17, 17, 0.04);
  text-align: center;
  font-size: 30rpx;
  font-weight: 900;
}

.unit-wrap {
  width: 360rpx;
}

.repeat-month {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.repeat-pill {
  height: 64rpx;
  padding: 0 18rpx;
  border-radius: 18rpx;
  background: rgba(17, 17, 17, 0.04);
  display: flex;
  align-items: center;
}

.repeat-pill.is-active {
  background: #3d6afb;
}

.repeat-pill-text {
  font-size: 26rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.75);
}

.repeat-pill.is-active .repeat-pill-text {
  color: #ffffff;
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

.chev-img {
  width: 22rpx;
  height: 22rpx;
  display: block;
  transform: rotate(0deg);
  transition: transform 160ms ease;
}

.chev-img.is-open {
  transform: rotate(180deg);
}

.sync-body {
  margin-top: 16rpx;
  padding-top: 10rpx;
}

.sync-row {
  padding: 12rpx 0;
}

.radio-img {
  width: 34rpx;
  height: 34rpx;
  display: block;
}

.sync-add {
  margin-top: 8rpx;
  height: 84rpx;
  border-radius: 22rpx;
  background: rgba(17, 17, 17, 0.04);
  display: flex;
  align-items: center;
  justify-content: center;
}

.sync-add-text {
  font-size: 28rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.75);
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
  position: fixed;
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

.repeat-actions {
  padding: 6rpx 0 10rpx;
}

.repeat-action {
  height: 92rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.repeat-action-text {
  font-size: 32rpx;
  font-weight: 900;
  color: #111111;
}

.repeat-cancel {
  margin-top: 18rpx;
  height: 92rpx;
  border-radius: 999rpx;
  background: rgba(17, 17, 17, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
}

.repeat-cancel-text {
  font-size: 32rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.8);
}

</style>

<style lang="scss">
page {
  background: #ffffff !important;
}
</style>
