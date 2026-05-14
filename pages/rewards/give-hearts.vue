<template>
  <view class="bl-page give-page">
    <BlHeader title="给予心心" back />

    <view class="card">
      <view class="card-head">
        <view class="head-left">
          <view class="mini-icon" />
          <text class="head-title"><text class="req">*</text>选择成员</text>
        </view>
      </view>

      <view class="members">
        <view v-for="m in memberItems" :key="m.id" class="mem" @click="memberId = m.id">
          <BlAvatar :glyph="m.glyph" :color="m.color" :size="84" />
          <view v-if="memberId === m.id" class="mem-check"><text class="check">✓</text></view>
          <text class="mem-name">{{ m.name }}</text>
        </view>
        <view class="mem add" @click="goAddMember">
          <view class="add-circle"><text class="add-plus">+</text></view>
          <text class="mem-name">添加</text>
        </view>
      </view>
    </view>

    <view class="card">
      <view class="card-head">
        <view class="head-left">
          <view class="heart-icon" />
          <text class="head-title"><text class="req">*</text>心心</text>
        </view>
      </view>
      <view class="heart-input">
        <input v-model="hearts" class="input" type="number" placeholder="请输入心心数量" placeholder-class="ph" />
        <view v-if="hearts" class="clear" @click="hearts = ''"><text class="clear-text">×</text></view>
      </view>
    </view>

    <view class="card table-card">
      <view class="table-head">
        <text class="th">成员</text>
        <text class="th">之前</text>
        <text class="th">之后</text>
      </view>
      <view class="table-row">
        <text class="td">{{ selectedMemberName }}</text>
        <text class="td">{{ beforeVal }}</text>
        <text class="td">{{ afterVal }}</text>
      </view>
    </view>

    <view class="bottom" @click="confirm">
      <text class="bottom-text">确认</text>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import BlAvatar from '../../components/BlAvatar.vue'
import BlHeader from '../../components/BlHeader.vue'
import { ensureCalendarState, listMembers } from '../../utils/calendarStore'
import { addHeartTransfer, computeHeartBalance, ensureRewardState } from '../../utils/rewardStore'

const calendarState = ref(ensureCalendarState())
const rewardState = ref(ensureRewardState())

const memberId = ref('')
const hearts = ref('10')

function refresh() {
  calendarState.value = ensureCalendarState()
  rewardState.value = ensureRewardState()
  if (!memberId.value) {
    const prefer = rewardState.value.activeMemberId
    const all = listMembers(calendarState.value).filter((m) => m.enabled !== false)
    memberId.value = all.some((m) => m.id === prefer) ? prefer : (all[0] ? all[0].id : '')
  }
}

onLoad(() => refresh())
onShow(() => refresh())

const memberItems = computed(() => listMembers(calendarState.value).filter((m) => m.enabled !== false))
const selectedMemberName = computed(() => {
  const m = memberItems.value.find((x) => x.id === memberId.value)
  return m ? m.name : ''
})

const beforeVal = computed(() => {
  if (!memberId.value) return 0
  return computeHeartBalance(rewardState.value, memberId.value)
})

const afterVal = computed(() => {
  const n = Number(hearts.value || 0) || 0
  return (beforeVal.value || 0) + n
})

function goAddMember() {
  uni.navigateTo({ url: '/pages/calendar/member-add' })
}

function validate() {
  if (!memberId.value) {
    uni.showToast({ title: '请选择成员', icon: 'none' })
    return false
  }
  const n = Number(hearts.value || 0) || 0
  if (n <= 0) {
    uni.showToast({ title: '请输入心心', icon: 'none' })
    return false
  }
  return true
}

function confirm() {
  if (!validate()) return
  const n = Number(hearts.value || 0) || 0
  addHeartTransfer(rewardState.value, { memberId: memberId.value, delta: n, reason: 'give' })
  uni.$emit && uni.$emit('reward:refresh')
  uni.navigateBack()
}
</script>

<style scoped lang="scss">
.give-page {
  padding-bottom: 220rpx;
}

.card {
  margin-top: 18rpx;
  background: #ffffff;
  border-radius: 28rpx;
  padding: 20rpx 22rpx;
  box-shadow: 0 10rpx 26rpx rgba(17, 17, 17, 0.06);
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.head-left {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.mini-icon {
  width: 28rpx;
  height: 28rpx;
  border-radius: 8rpx;
  background: rgba(17, 17, 17, 0.12);
}

.heart-icon {
  width: 28rpx;
  height: 28rpx;
  border-radius: 999rpx;
  background: rgba(255, 176, 32, 0.3);
}

.head-title {
  font-size: 30rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.88);
}

.req {
  color: #ff3b30;
  margin-right: 6rpx;
}

.members {
  margin-top: 14rpx;
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
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
  width: 84rpx;
  height: 84rpx;
  border-radius: 999rpx;
  background: rgba(17, 17, 17, 0.04);
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-plus {
  font-size: 44rpx;
  font-weight: 700;
  color: rgba(17, 17, 17, 0.6);
}

.heart-input {
  margin-top: 14rpx;
  height: 96rpx;
  border-radius: 24rpx;
  background: rgba(17, 17, 17, 0.04);
  padding: 0 18rpx;
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.input {
  flex: 1;
  font-size: 34rpx;
  font-weight: 900;
  color: #111111;
}

.ph {
  color: rgba(17, 17, 17, 0.35);
}

.clear {
  width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.clear-text {
  font-size: 44rpx;
  font-weight: 700;
  color: rgba(17, 17, 17, 0.45);
}

.table-card {
  padding: 12rpx 22rpx 10rpx;
}

.table-head,
.table-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.table-head {
  padding: 10rpx 0;
}

.th {
  width: 33%;
  font-size: 28rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.8);
}

.td {
  width: 33%;
  font-size: 30rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.9);
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

.bottom-text {
  color: #ffffff;
  font-size: 34rpx;
  font-weight: 900;
}
</style>
