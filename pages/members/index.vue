<template>
  <view class="bl-page">
    <BlHeader :title="$t('成员管理')" back>
      <template #right>
        <view class="add-btn" @click="goAdd">
          <image class="add-img" src="/static/calendar/icon_plus_circle.png" mode="aspectFit" />
        </view>
      </template>
    </BlHeader>

    <view class="section">
      <text class="section-title">{{ $t('成员') }}</text>
      <text class="section-sub bl-muted">{{ $t('为家庭中的每位成员分配各自的颜色') }}</text>
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
          @longpress.stop.prevent="onHandleLongPress"
          @mousedown.stop.prevent="onHandleMouseDown"
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
      <text class="section-title">{{ $t('日历颜色') }}</text>
      <text class="section-sub bl-muted">{{ $t('如果需要为节日、第三方日历等非人物事项添加颜色，可以在此处整理。') }}</text>
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
          @longpress.stop.prevent="onHandleLongPress"
          @mousedown.stop.prevent="onHandleMouseDown"
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

    <text class="tip bl-muted">{{ $t('提示：可以通过长按并拖动来进行排序') }}</text>
  </view>
</template>

<script setup>
import { onShow } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'
import BlAvatar from '../../components/BlAvatar.vue'
import BlHeader from '../../components/BlHeader.vue'
import { ensureCalendarState, listMembers, setMembers } from '../../utils/calendarStore'
import { membersApi } from '../../utils/api'

const state = ref(ensureCalendarState())
const members = ref([])

function glyphFromName(name) {
  const n = String(name || '').trim()
  if (!n) return ''
  return n.length >= 2 ? n.slice(-2, -1) : n.slice(0, 1)
}

async function syncRemoteMembers() {
  const logged = !!uni.getStorageSync('auth_logged_in')
  if (!logged) return false
  uni.showLoading({ title: uni.$t('加载中') })
  try {
    const list = await membersApi.getMemberList()
    const mapped = (list || []).map((m) => {
      const type = Number(m && m.memberType)
      return {
        id: String(m && m.memberId ? m.memberId : ''),
        name: m && m.memberName ? String(m.memberName) : '',
        glyph: glyphFromName(m && m.memberName),
        color: membersApi.memberHexFromColorIndex(m && m.memberColor),
        enabled: true,
        group: type === 1 ? 'calendarColor' : 'member',
        avatarUrl: m && m.avatarUrl ? String(m.avatarUrl) : '',
      }
    })
    setMembers(state.value, mapped.filter((x) => x && x.id))
    return true
  } catch (e) {
    uni.showToast({ title: String((e && e.message) || uni.$t('获取成员失败')), icon: 'none' })
    return false
  } finally {
    try {
      uni.hideLoading()
    } catch (e) {}
  }
}

function refresh() {
  state.value = ensureCalendarState()
  members.value = listMembers(state.value)
}

onShow(() => {
  ;(async () => {
    await syncRemoteMembers()
    refresh()
  })()
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
let windowBound = false
const itemStepPx = (() => {
  try {
    if (typeof uni?.upx2px === 'function') return uni.upx2px(132)
  } catch (e) {}
  return 66
})()

function eventPointY(e) {
  const t = e?.touches?.[0] || e?.changedTouches?.[0]
  if (t) {
    const y = t.clientY !== undefined ? t.clientY : t.pageY !== undefined ? t.pageY : t.y
    const n = Number(y)
    return Number.isFinite(n) ? n : NaN
  }
  const y = e?.clientY !== undefined ? e.clientY : e?.pageY !== undefined ? e.pageY : e?.y
  const n = Number(y)
  return Number.isFinite(n) ? n : NaN
}

function bindWindowDrag() {
  if (windowBound) return
  if (typeof window === 'undefined') return
  windowBound = true
  try {
    window.addEventListener('mousemove', onDragMove, { passive: false })
    window.addEventListener('mouseup', onDragEnd, { passive: false })
    window.addEventListener('touchmove', onDragMove, { passive: false })
    window.addEventListener('touchend', onDragEnd, { passive: false })
    window.addEventListener('touchcancel', onDragEnd, { passive: false })
  } catch (e) {}
}

function unbindWindowDrag() {
  if (!windowBound) return
  windowBound = false
  if (typeof window === 'undefined') return
  try {
    window.removeEventListener('mousemove', onDragMove, false)
    window.removeEventListener('mouseup', onDragEnd, false)
    window.removeEventListener('touchmove', onDragMove, false)
    window.removeEventListener('touchend', onDragEnd, false)
    window.removeEventListener('touchcancel', onDragEnd, false)
  } catch (e) {}
}

function onHandleTouchStart(e) {
  const y = eventPointY(e)
  if (!Number.isFinite(y)) return
  const ds = e?.currentTarget?.dataset || {}
  const group = ds.group === 'calendarColor' ? 'calendarColor' : 'member'
  const idx = Number(ds.index)
  if (!Number.isFinite(idx)) return
  const list = group === 'calendarColor' ? colorList.value : memberList.value
  const m = list[idx]
  if (!m) return
  pressStartClientY = y
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
  bindWindowDrag()
}

function onHandleMouseDown(e) {
  const y = eventPointY(e)
  if (!Number.isFinite(y)) return
  const ds = e?.currentTarget?.dataset || {}
  const group = ds.group === 'calendarColor' ? 'calendarColor' : 'member'
  const idx = Number(ds.index)
  if (!Number.isFinite(idx)) return
  const list = group === 'calendarColor' ? colorList.value : memberList.value
  const m = list[idx]
  if (!m) return
  pressStartClientY = y
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
  bindWindowDrag()
}

function onHandleLongPress(e) {
  const y = eventPointY(e)
  const ds = e?.currentTarget?.dataset || {}
  const group = ds.group === 'calendarColor' ? 'calendarColor' : 'member'
  const idx = Number(ds.index)
  if (!Number.isFinite(idx)) return
  const list = group === 'calendarColor' ? colorList.value : memberList.value
  const m = list[idx]
  if (!m) return
  if (pressTimer) clearTimeout(pressTimer)
  pressTimer = null
  pendingStart = null
  dragging.value = true
  draggingId.value = String(m.id)
  draggingGroup.value = group
  dragIndex = idx
  if (Number.isFinite(y)) {
    pressStartClientY = y
    dragStartClientY = y
  }
  bindWindowDrag()
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
  const y = eventPointY(e)
  if (!Number.isFinite(y)) return
  if (!dragging.value) {
    if (pendingStart && Math.abs(y - pressStartClientY) > 6) {
      pendingStart = null
      if (pressTimer) clearTimeout(pressTimer)
      pressTimer = null
    }
    return
  }
  const dy = y - dragStartClientY
  if (Math.abs(dy) < itemStepPx / 2) return
  const direction = dy > 0 ? 1 : -1
  moveInGroup(direction)
  dragStartClientY = y
}

function onDragEnd() {
  if (pressTimer) clearTimeout(pressTimer)
  pressTimer = null
  pendingStart = null
  unbindWindowDrag()
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
