<template>
  <view class="bl-page give-page">
    <BlHeader title="给予心心" back back-icon-src="/static/reward/icon_nav_back_small.png" />

    <view class="card">
      <view class="card-head">
        <view class="head-left">
          <image class="head-icon" src="/static/reward/icon_members_small.png" mode="aspectFit" />
          <text class="head-title"><text class="req">*</text>选择成员</text>
        </view>
      </view>

      <view class="members">
        <view v-for="m in memberItems" :key="m.id" class="mem" @click="memberId = m.id">
          <BlAvatar :glyph="m.glyph" :src="m.avatarUrl" :color="m.color" :size="84" />
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
          <image class="head-icon is-heart" src="/static/reward/icon_heart_orange_small.png" mode="aspectFit" />
          <text class="head-title"><text class="req">*</text>心心</text>
        </view>
      </view>
      <view class="heart-input">
        <input v-model="hearts" class="input" type="number" placeholder="请输入心心数量" placeholder-class="ph" />
        <view v-if="hearts" class="clear" @click="hearts = ''">
          <image class="clear-img" src="/static/reward/icon_close_x.png" mode="aspectFit" />
        </view>
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
import { ensureCalendarState, listMembers, setMembers } from '../../utils/calendarStore'
import { addHeartTransfer, computeHeartBalance, ensureRewardState } from '../../utils/rewardStore'
import { membersApi } from '../../utils/api'

const calendarState = ref(ensureCalendarState())
const rewardState = ref(ensureRewardState())

const memberId = ref('')
const hearts = ref('10')

async function syncRemoteMembers() {
  const logged = !!uni.getStorageSync('auth_logged_in')
  if (!logged) return false
  try {
    const list = await membersApi.getMemberList()
    setMembers(calendarState.value, membersApi.mapRemoteMembersToLocalMembers(list))
    return true
  } catch (e) {
    return false
  }
}

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
onShow(() => {
  ;(async () => {
    await syncRemoteMembers()
    refresh()
  })()
})

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
  uni.navigateTo({ url: '/pages/members/member-add' })
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
  background: #ffffff;
  min-height: 100vh;
  box-sizing: border-box;
}

.card {
  margin-top: 18rpx;
  background: #fafafa;
  border-radius: 22rpx;
  padding: 20rpx 22rpx;
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

.head-icon {
  width: 28rpx;
  height: 28rpx;
  display: block;
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
  background: #fafafa;
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

.clear-img {
  width: 28rpx;
  height: 28rpx;
  display: block;
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
  bottom: calc(34rpx + env(safe-area-inset-bottom));
  height: 96rpx;
  background: #3d6afb;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 18rpx 36rpx rgba(61, 106, 251, 0.22);
}

.bottom-text {
  color: #ffffff;
  font-size: 34rpx;
  font-weight: 900;
}
</style>
