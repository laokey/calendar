<template>
  <view class="bl-page">
    <BlHeader title="成员管理" back>
      <template #right>
        <view class="add-btn" @click="goAdd">
          <text class="add-text">+</text>
        </view>
      </template>
    </BlHeader>

    <view class="list">
      <view v-for="m in members" :key="m.id" class="item">
        <view class="left">
          <BlAvatar :glyph="m.glyph" :color="m.color" :size="72" />
          <text class="name">{{ m.name }}</text>
        </view>
        <switch :checked="!!m.enabled" color="#3d6afb" @change="toggle(m.id, $event.detail.value)" />
      </view>
    </view>
  </view>
</template>

<script setup>
import { onShow } from '@dcloudio/uni-app'
import { ref } from 'vue'
import BlAvatar from '../../components/BlAvatar.vue'
import BlHeader from '../../components/BlHeader.vue'
import { ensureCalendarState, listMembers, setMemberEnabled } from '../../utils/calendarStore'

const state = ref(ensureCalendarState())
const members = ref([])

function refresh() {
  state.value = ensureCalendarState()
  members.value = listMembers(state.value)
}

onShow(() => {
  refresh()
})

function toggle(id, v) {
  setMemberEnabled(state.value, id, !!v)
  refresh()
  uni.$emit && uni.$emit('calendar:refresh')
}

function goAdd() {
  uni.navigateTo({ url: '/pages/calendar/member-add' })
}
</script>

<style scoped lang="scss">
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

.list {
  margin-top: 10rpx;
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
</style>

