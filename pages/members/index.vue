<template>
  <view class="bl-page">
    <BlHeader title="成员管理" back>
      <template #right>
        <view class="add-btn" @click="goAdd">
          <image class="add-img" src="/static/calendar/icon_plus_circle.png" mode="aspectFit" />
        </view>
      </template>
    </BlHeader>

    <view class="section">
      <text class="section-title">成员</text>
      <text class="section-sub bl-muted">为家庭中的每位成员分配各自的颜色</text>
    </view>

    <view class="list">
      <view
        v-for="(m, idx) in memberList"
        :key="m.id"
        class="row"
        :class="{ 'is-dragging': dragging && draggingId === m.id }"
        @click="openEdit(m.id)"
      >
        <view class="left">
          <BlAvatar :glyph="m.glyph" :src="m.avatarUrl" :color="m.color" :size="48" />
          <text class="name">{{ m.name }}</text>
        </view>
        <view
          class="drag-handle"
          :data-group="'member'"
          :data-index="idx"
          @touchstart.stop.prevent="onHandleTouchStart"
          @touchmove.stop.prevent="onDragMove"
          @touchend.stop.prevent="onDragEnd"
          @touchcancel.stop.prevent="onDragEnd"
        >
          <view class="drag-line" />
          <view class="drag-line" />
          <view class="drag-line" />
        </view>
      </view>
    </view>

    <view class="section">
      <text class="section-title">日历颜色</text>
      <text class="section-sub bl-muted">如果需要为节日、第三方日历等非人物事项添加颜色，可以在此处整理。</text>
    </view>

    <view class="list">
      <view
        v-for="(m, idx) in colorList"
        :key="m.id"
        class="row"
        :class="{ 'is-dragging': dragging && draggingId === m.id }"
        @click="openEdit(m.id)"
      >
        <view class="left">
          <BlAvatar :glyph="m.glyph" :src="m.avatarUrl" :color="m.color" :size="48" />
          <text class="name">{{ m.name }}</text>
        </view>
        <view
          class="drag-handle"
          :data-group="'calendarColor'"
          :data-index="idx"
          @touchstart.stop.prevent="onHandleTouchStart"
          @touchmove.stop.prevent="onDragMove"
          @touchend.stop.prevent="onDragEnd"
          @touchcancel.stop.prevent="onDragEnd"
        >
          <view class="drag-line" />
          <view class="drag-line" />
          <view class="drag-line" />
        </view>
      </view>
    </view>

    <text class="tip bl-muted">提示:可以通过长按并拖动来进行排序</text>
  </view>
</template>

<script setup>
import { onShow } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'
import BlAvatar from '../../components/BlAvatar.vue'
import BlHeader from '../../components/BlHeader.vue'
import { ensureCalendarState, listMembers, setMembers } from '../../utils/calendarStore'

const state = ref(ensureCalendarState())
const members = ref([])

function refresh() {
  state.value = ensureCalendarState()
  members.value = listMembers(state.value)
}

onShow(() => {
  refresh()
})

const memberList = computed(() => (members.value || []).filter((m) => (m && m.group) !== 'calendarColor'))
const colorList = computed(() => (members.value || []).filter((m) => (m && m.group) === 'calendarColor'))

function goAdd() {
  uni.navigateTo({ url: '/pages/members/member-add' })
}

function openEdit(id) {
  if (dragging.value) return
  uni.navigateTo({ url: `/pages/members/member-add?id=${encodeURIComponent(String(id || ''))}` })
}

const dragging = ref(false)
const draggingId = ref('')
const draggingGroup = ref('member')
let dragIndex = -1
let dragStartClientY = 0
let pressTimer = null
let pressStartClientY = 0
let pendingStart = null
const itemStepPx = (() => {
  try {
    if (typeof uni?.upx2px === 'function') return uni.upx2px(132)
  } catch (e) {}
  return 66
})()

function onHandleTouchStart(e) {
  const touch = e?.touches?.[0]
  if (!touch) return
  const ds = e?.currentTarget?.dataset || {}
  const group = ds.group === 'calendarColor' ? 'calendarColor' : 'member'
  const idx = Number(ds.index)
  if (!Number.isFinite(idx)) return
  const list = group === 'calendarColor' ? colorList.value : memberList.value
  const m = list[idx]
  if (!m) return
  pressStartClientY = touch.clientY
  pendingStart = { id: String(m.id), group, idx }
  if (pressTimer) clearTimeout(pressTimer)
  pressTimer = setTimeout(() => {
    if (!pendingStart) return
    dragging.value = true
    draggingId.value = pendingStart.id
    draggingGroup.value = pendingStart.group
    dragIndex = pendingStart.idx
    dragStartClientY = pressStartClientY
    pendingStart = null
  }, 260)
}

function commitOrder() {
  const merged = [...memberList.value, ...colorList.value]
  setMembers(state.value, merged)
  refresh()
  uni.$emit && uni.$emit('calendar:refresh')
}

function moveInGroup(direction) {
  const group = draggingGroup.value
  const list = group === 'calendarColor' ? colorList.value.slice() : memberList.value.slice()
  const nextIdx = dragIndex + direction
  if (nextIdx < 0 || nextIdx >= list.length) return
  const moved = list.splice(dragIndex, 1)[0]
  list.splice(nextIdx, 0, moved)
  if (group === 'calendarColor') {
    members.value = [...memberList.value, ...list]
  } else {
    members.value = [...list, ...colorList.value]
  }
  dragIndex = nextIdx
}

function onDragMove(e) {
  const touch = e?.touches?.[0]
  if (!touch) return
  if (!dragging.value) {
    if (pendingStart && Math.abs(touch.clientY - pressStartClientY) > 6) {
      pendingStart = null
      if (pressTimer) clearTimeout(pressTimer)
      pressTimer = null
    }
    return
  }
  const dy = touch.clientY - dragStartClientY
  if (Math.abs(dy) < itemStepPx / 2) return
  const direction = dy > 0 ? 1 : -1
  moveInGroup(direction)
  dragStartClientY = touch.clientY
}

function onDragEnd() {
  if (pressTimer) clearTimeout(pressTimer)
  pressTimer = null
  pendingStart = null
  if (!dragging.value) return
  dragging.value = false
  draggingId.value = ''
  draggingGroup.value = 'member'
  dragIndex = -1
  commitOrder()
}
</script>

<style scoped lang="scss">
.bl-page {
  background: #ffffff;
  height: 100vh;
}
.add-btn {
  width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-img {
  width: 54rpx;
  height: 54rpx;
  display: block;
}

.section {
  margin-top: 20rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 800;
  color: #333333;
}

.section-sub {
  margin-top: 10rpx;
  display: block;
  font-size: 26rpx;
  font-weight: 400;
}

.list {
  margin-top: 16rpx;
}

.row {
  height: 108rpx;
  background: #fafafa;
  border-radius: 24rpx;
  padding: 0 22rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 2rpx solid rgba(17, 17, 17, 0.04);
}

.row + .row {
  margin-top: 14rpx;
}

.row.is-dragging {
  opacity: 0.7;
}

.left {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.name {
  font-size: 28rpx;
  font-weight: 800;
  color: #333333;
}

.drag-handle {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
}

.drag-line {
  width: 28rpx;
  height: 4rpx;
  border-radius: 999rpx;
  background: rgba(17, 17, 17, 0.35);
}

.tip {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 36rpx;
  text-align: center;
  font-size: 26rpx;
  font-weight: 400;
}
</style>
