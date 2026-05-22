<template>
  <view class="bl-page detail-page">
    <BlHeader back>
      <template #right>
        <view class="actions">
          <view class="action edit" @click="goEdit">
            <image class="action-icon" src="/static/calendar/icon_edit_square.png" mode="aspectFit" />
          </view>
          <view class="action del" @click="confirmDelete">
            <image class="action-icon" src="/static/calendar/icon_trash.png" mode="aspectFit" />
          </view>
        </view>
      </template>
    </BlHeader>

    <view class="hero" @click="goEdit">
      <view class="hero-bg" />
      <view class="hero-content">
        <text class="hero-title">{{ event.title }}</text>
        <text class="hero-sub">{{ dateText }}</text>
      </view>
    </view>

    <view v-if="event.repeat" class="block repeat-row">
      <image class="row-icon" src="/static/calendar/icon_form_target.png" mode="aspectFit" />
      <text class="repeat-text">{{ repeatText }}</text>
    </view>

    <view class="block">
      <view class="member-row" @click="openMemberManage">
        <text class="member-title">成员管理</text>
        <image class="member-link" src="/static/calendar/icon_nav_next_circle_small.png" mode="aspectFit" />
      </view>
      <view class="member-list">
        <view v-for="m in selectedMembers" :key="m.id" class="member-item">
          <BlAvatar :glyph="m.glyph" :src="m.avatarUrl" :color="m.color" :size="72" />
          <text class="member-name">{{ m.name }}</text>
        </view>
      </view>
    </view>

    <view v-if="event.desc" class="block info">
      <image class="row-icon" src="/static/calendar/icon_form_title_edit.png" mode="aspectFit" />
      <text class="info-text">{{ event.desc }}</text>
    </view>

    <view v-if="event.location" class="block info">
      <image class="row-icon" src="/static/calendar/icon_form_location.png" mode="aspectFit" />
      <text class="info-text">{{ event.location }}</text>
    </view>

    <view class="bottom-edit" @click="goEdit">
      <image class="bottom-edit-bg" src="/static/calendar/btn_primary_gradient.png" mode="scaleToFill" />
      <text class="bottom-edit-text">编辑</text>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import BlAvatar from '../../components/BlAvatar.vue'
import BlHeader from '../../components/BlHeader.vue'
import { deleteEvent, ensureCalendarState, eventDateText, findEvent, listMembers } from '../../utils/calendarStore'

const state = ref(ensureCalendarState())
const members = ref(listMembers(state.value))
const event = ref({
  id: '',
  title: '',
  allDay: false,
  startDate: '',
  startTime: '',
  endDate: '',
  endTime: '',
  memberIds: [],
  desc: '',
  location: '',
  repeat: null,
})

onLoad((options) => {
  state.value = ensureCalendarState()
  members.value = listMembers(state.value)
  const id = options && options.id ? String(options.id) : ''
  const ev = id ? findEvent(state.value, id) : null
  if (!ev) {
    uni.showToast({ title: '事件不存在', icon: 'none' })
    setTimeout(() => uni.navigateBack(), 350)
    return
  }
  event.value = ev
})

const dateText = computed(() => eventDateText(event.value))

const repeatText = computed(() => {
  if (!event.value.repeat) return ''
  const every = event.value.repeat.every || 1
  const unit = event.value.repeat.unit || 'day'
  const map = { day: '天', week: '周', month: '月', year: '年' }
  return `每${every}${map[unit] || '天'}`
})

const selectedMembers = computed(() =>
  (event.value.memberIds || [])
    .map((id) => members.value.find((m) => m.id === id))
    .filter((x) => !!x),
)

function goEdit() {
  uni.navigateTo({ url: `/pages/calendar/event-form?id=${event.value.id}` })
}

function openMemberManage() {
  const ids = encodeURIComponent(JSON.stringify(event.value.memberIds || []))
  uni.navigateTo({ url: `/pages/members/members-select?ids=${ids}&eventId=${event.value.id}` })
}

function confirmDelete() {
  uni.showModal({
    title: '',
    content: '您确定要删除吗？',
    confirmText: '删除',
    cancelText: '取消',
    confirmColor: '#3d6afb',
    success(res) {
      if (!res.confirm) return
      deleteEvent(state.value, event.value.id)
      uni.$emit && uni.$emit('calendar:refresh')
      uni.navigateBack()
    },
  })
}
</script>

<style scoped lang="scss">
.detail-page {
  padding-bottom: 240rpx;
}

.actions {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.action {
  height: 64rpx;
  padding: 0 18rpx;
  border-radius: 16rpx;
  background: rgba(17, 17, 17, 0.04);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
}

.action-icon {
  width: 28rpx;
  height: 28rpx;
  display: block;
}

.action-text {
  font-size: 26rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.85);
}

.action.del {
  background: rgba(255, 59, 48, 0.1);
}

.del-text {
  color: #ff3b30;
}

.hero {
  margin-top: 10rpx;
  height: 180rpx;
  border-radius: 28rpx;
  overflow: hidden;
  position: relative;
  box-shadow: 0 10rpx 26rpx rgba(17, 17, 17, 0.06);
}

.hero-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #4c8dff 0%, #1b2b76 100%);
}

.hero-content {
  position: relative;
  padding: 34rpx 28rpx;
}

.hero-title {
  font-size: 40rpx;
  font-weight: 900;
  color: #ffffff;
}

.hero-sub {
  margin-top: 12rpx;
  display: block;
  font-size: 26rpx;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.92);
}

.block {
  background: #ffffff;
  border-radius: 28rpx;
  padding: 20rpx 22rpx;
  margin-top: 16rpx;
  box-shadow: 0 10rpx 26rpx rgba(17, 17, 17, 0.06);
}

.repeat-row {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.row-icon {
  width: 30rpx;
  height: 30rpx;
  flex-shrink: 0;
  display: block;
}

.repeat-text {
  font-size: 28rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.7);
}

.member-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.member-title {
  color: #3d6afb;
  font-size: 30rpx;
  font-weight: 900;
}

.member-link {
  width: 40rpx;
  height: 40rpx;
  display: block;
}

.member-list {
  margin-top: 18rpx;
  display: flex;
  align-items: center;
  gap: 22rpx;
}

.member-item {
  width: 120rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.member-name {
  margin-top: 10rpx;
  font-size: 24rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.75);
}

.info {
  display: flex;
  align-items: flex-start;
  gap: 12rpx;
}

.info-icon {
  width: 30rpx;
  height: 30rpx;
  border-radius: 10rpx;
  background: rgba(17, 17, 17, 0.12);
}

.loc-icon {
  width: 30rpx;
  height: 30rpx;
  border-radius: 999rpx;
  background: rgba(17, 17, 17, 0.12);
}

.info-text {
  flex: 1;
  font-size: 28rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.75);
  line-height: 1.4;
}

.bottom-edit {
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

.bottom-edit-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.bottom-edit-text {
  position: relative;
  color: #ffffff;
  font-size: 34rpx;
  font-weight: 900;
}
</style>
