<template>
  <view class="bl-page select-page">
    <BlHeader title="选择成员" back>
      <template #right>
        <view class="add-btn" @click="goAdd">
          <text class="add-text">+</text>
        </view>
      </template>
    </BlHeader>

    <view class="hint">
      <text class="hint-title">成员</text>
      <text class="hint-sub bl-muted">为家庭中的每位成员分配各自的颜色</text>
    </view>

    <view class="list">
      <view v-for="m in members" :key="m.id" class="item" @click="toggle(m.id)">
        <view class="left">
          <BlAvatar :glyph="m.glyph" :color="m.color" :size="72" />
          <text class="name">{{ m.name }}</text>
        </view>
        <view class="right">
          <view v-if="selectedIds.includes(m.id)" class="check">
            <text class="check-text">✓</text>
          </view>
          <view v-else class="dot" />
        </view>
      </view>
    </view>

    <view class="bottom-save" @click="save">
      <text class="bottom-save-text">保存</text>
    </view>
  </view>
</template>

<script setup>
import { onLoad, onShow } from '@dcloudio/uni-app'
import { ref } from 'vue'
import BlAvatar from '../../components/BlAvatar.vue'
import BlHeader from '../../components/BlHeader.vue'
import { ensureCalendarState, listMembers, updateEvent } from '../../utils/calendarStore'

const state = ref(ensureCalendarState())
const members = ref([])
const selectedIds = ref([])
const eventId = ref('')

function refresh() {
  state.value = ensureCalendarState()
  members.value = listMembers(state.value).filter((m) => m.enabled !== false)
}

onLoad((options) => {
  eventId.value = options && options.eventId ? String(options.eventId) : ''
  const idsRaw = options && options.ids ? String(options.ids) : '[]'
  try {
    selectedIds.value = JSON.parse(decodeURIComponent(idsRaw))
  } catch (e) {
    selectedIds.value = []
  }
  refresh()
})

onShow(() => {
  refresh()
})

function toggle(id) {
  const idx = selectedIds.value.indexOf(id)
  if (idx >= 0) {
    selectedIds.value.splice(idx, 1)
  } else {
    selectedIds.value.push(id)
  }
}

function save() {
  const ids = selectedIds.value.slice()
  if (eventId.value) {
    updateEvent(state.value, eventId.value, { memberIds: ids })
    uni.$emit && uni.$emit('calendar:refresh')
    uni.navigateBack()
    return
  }
  uni.setStorageSync('calendar_member_select_tmp', JSON.stringify(ids))
  uni.navigateBack()
}

function goAdd() {
  uni.navigateTo({ url: '/pages/calendar/member-add' })
}
</script>

<style scoped lang="scss">
.select-page {
  padding-bottom: 240rpx;
}

.add-btn {
  width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-text {
  font-size: 48rpx;
  font-weight: 700;
  color: #111111;
  line-height: 1;
}

.hint {
  margin-top: 8rpx;
}

.hint-title {
  font-size: 40rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.95);
}

.hint-sub {
  margin-top: 10rpx;
  display: block;
  font-size: 26rpx;
  font-weight: 700;
}

.list {
  margin-top: 16rpx;
}

.item {
  height: 118rpx;
  background: #ffffff;
  border-radius: 24rpx;
  padding: 0 22rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 10rpx 26rpx rgba(17, 17, 17, 0.06);
  margin-top: 14rpx;
}

.left {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.name {
  font-size: 32rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.9);
}

.right {
  width: 64rpx;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.dot {
  width: 34rpx;
  height: 34rpx;
  border-radius: 999rpx;
  background: rgba(17, 17, 17, 0.12);
}

.check {
  width: 44rpx;
  height: 44rpx;
  border-radius: 999rpx;
  background: #3d6afb;
  display: flex;
  align-items: center;
  justify-content: center;
}

.check-text {
  color: #ffffff;
  font-size: 26rpx;
  font-weight: 900;
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
</style>

