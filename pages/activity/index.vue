<template>
  <view class="page">
    <view class="tabs" :style="{ paddingTop: safeTop + 'px' }">
      <view class="tab" @click="setTab('dynamic')">
        <text class="tab-text" :class="{ active: tab === 'dynamic' }">动态</text>
        <view v-if="tab === 'dynamic'" class="underline" />
      </view>
      <view class="tab" @click="setTab('notice')">
        <text class="tab-text" :class="{ active: tab === 'notice' }">通知</text>
        <view v-if="tab === 'notice'" class="underline" />
      </view>
      <view class="tab" @click="setTab('invite')">
        <text class="tab-text" :class="{ active: tab === 'invite' }">邀请</text>
        <view v-if="tab === 'invite'" class="underline" />
      </view>
    </view>

    <view v-if="tab === 'dynamic'">
      <view v-if="state.dynamics.length === 0" class="empty">
        <image class="empty-img" src="/static/message/img_empty_activity.png" mode="widthFix" />
        <text class="empty-text">暂无动态</text>
      </view>

      <view v-else class="list">
        <view v-for="item in state.dynamics" :key="item.id" class="card" @click="openDynamic(item.id)">
          <view class="head">
            <view class="avatar" :style="{ background: item.who.color }">
              <text class="avatar-text">{{ item.who.glyph }}</text>
            </view>
            <text class="name">{{ item.who.name }}</text>
            <text class="time">{{ item.whenText }}</text>
          </view>
          <view class="body">
            <view class="left">
              <text class="desc">“{{ item.who.name }}”{{ item.action === 'done' ? '完成了任务' : '取消了任务' }}</text>
              <view class="row">
                <text class="task">{{ item.task.title }}</text>
                <view class="points">
                  <image class="star-icon" src="/static/message/icon_star.png" mode="aspectFit" />
                  <text class="points-text">{{ item.task.points > 0 ? '+' + item.task.points : item.task.points }}</text>
                </view>
              </view>
            </view>
            <view class="right">
              <view class="task-icon">
                <text class="task-glyph">{{ item.task.icon === 'run' ? '🏃' : '🥣' }}</text>
                <view v-if="item.action === 'done'" class="done-badge"><text class="done-text">✓</text></view>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <view v-else-if="tab === 'notice'">
      <view v-if="state.notices.length === 0" class="empty">
        <image class="empty-img" src="/static/message/img_empty_activity.png" mode="widthFix" />
        <text class="empty-text">暂无通知</text>
      </view>

      <view v-else class="list">
        <view v-for="n in state.notices" :key="n.id" class="notice" @click="openNotice(n.id)">
          <view class="n-head">
            <view class="n-icon">
              <image
                class="n-icon-img"
                :src="n.type === 'message' ? '/static/message/icon_notice_bell.png' : '/static/message/icon_notice_speaker.png'"
                mode="aspectFit"
              />
            </view>
            <text class="n-title">{{ n.title }}</text>
            <text class="n-time">{{ n.timeText }}</text>
          </view>
          <text class="n-sub">{{ n.subject }}</text>
          <text class="n-body">{{ n.preview }}</text>
          <view class="n-foot">
            <text class="n-more">查看详情</text>
            <text class="n-chev">›</text>
          </view>
        </view>
      </view>
    </view>

    <view v-else>
      <view v-if="state.invites.length === 0" class="empty">
        <image class="empty-img" src="/static/message/img_empty_activity.png" mode="widthFix" />
        <text class="empty-text">暂无邀请</text>
      </view>

      <view v-else class="list">
        <view v-for="inv in state.invites" :key="inv.id" class="invite">
          <view class="head">
            <view class="avatar" :style="{ background: inv.from.color }">
              <text class="avatar-text">{{ inv.from.glyph }}</text>
            </view>
            <text class="name">{{ inv.from.name }}</text>
            <text class="time">{{ inv.timeText }}</text>
          </view>
          <view class="inv-text">
            <text>邀请你加入</text>
            <text class="inv-link">{{ inv.calendarName }}</text>
          </view>
          <view class="inv-actions">
            <view class="btn light" @click="reject(inv.id)"><text class="btn-text light-text">取消</text></view>
            <view class="btn" @click="accept(inv.id)"><text class="btn-text">确定</text></view>
          </view>
        </view>
      </view>
    </view>

    <BlBottomNav active="magic" />
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import BlBottomNav from '../../components/BlBottomNav.vue'
import { ensureActivityState, removeInvite } from '../../utils/activityStore'

const tab = ref('dynamic')
const state = ref(ensureActivityState())

onLoad((options) => {
  if (options && options.tab) {
    const t = String(options.tab)
    if (t === 'dynamic' || t === 'notice' || t === 'invite') tab.value = t
  }
})

onShow(() => {
  state.value = ensureActivityState()
})

const safeTop = computed(() => {
  try {
    const info = uni.getSystemInfoSync()
    const insets = info && info.safeAreaInsets ? info.safeAreaInsets : null
    return insets && typeof insets.top === 'number' ? insets.top : 0
  } catch (e) {
    return 0
  }
})

function setTab(t) {
  tab.value = t
}

function openDynamic(id) {
  uni.navigateTo({ url: `/pages/activity/dynamic-detail?id=${encodeURIComponent(id)}` })
}

function openNotice(id) {
  uni.navigateTo({ url: `/pages/activity/notice-detail?id=${encodeURIComponent(id)}` })
}

function accept(id) {
  uni.showToast({ title: '已加入', icon: 'none' })
  const s = ensureActivityState()
  removeInvite(s, id)
  state.value = ensureActivityState()
}

function reject(id) {
  uni.showToast({ title: '已取消', icon: 'none' })
  const s = ensureActivityState()
  removeInvite(s, id)
  state.value = ensureActivityState()
}
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: #ffffff;
  padding-bottom: 220rpx;
}

.tabs {
  padding: 18rpx 28rpx 12rpx;
  display: flex;
  align-items: center;
  gap: 52rpx;
}

.tab {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8rpx;
}

.tab-text {
  font-size: 30rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.6);
}

.tab-text.active {
  font-size: 44rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.9);
}

.underline {
  width: 36rpx;
  height: 8rpx;
  border-radius: 9999rpx;
  background: #3d6afb;
}

.empty {
  padding: 220rpx 28rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.empty-img {
  width: 280rpx;
}

.empty-text {
  margin-top: 18rpx;
  font-size: 26rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.45);
}

.list {
  padding: 10rpx 28rpx 0;
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.card {
  background: #ffffff;
  border-radius: 28rpx;
  padding: 22rpx;
  box-shadow: 0 10rpx 26rpx rgba(17, 17, 17, 0.06);
}

.head {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.avatar {
  width: 56rpx;
  height: 56rpx;
  border-radius: 9999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-text {
  color: #ffffff;
  font-size: 28rpx;
  font-weight: 900;
}

.name {
  font-size: 30rpx;
  font-weight: 900;
}

.time {
  margin-left: auto;
  font-size: 24rpx;
  font-weight: 700;
  color: rgba(17, 17, 17, 0.45);
}

.body {
  margin-top: 18rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.desc {
  display: block;
  font-size: 26rpx;
  font-weight: 700;
  color: rgba(17, 17, 17, 0.6);
}

.row {
  margin-top: 10rpx;
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.task {
  font-size: 34rpx;
  font-weight: 900;
}

.points {
  height: 44rpx;
  padding: 0 14rpx;
  border-radius: 9999rpx;
  background: rgba(17, 17, 17, 0.04);
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.star-icon {
  width: 26rpx;
  height: 26rpx;
}

.points-text {
  font-size: 26rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.65);
}

.task-icon {
  width: 120rpx;
  height: 86rpx;
  border-radius: 22rpx;
  background: rgba(17, 17, 17, 0.04);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.task-glyph {
  font-size: 40rpx;
}

.done-badge {
  position: absolute;
  top: 6rpx;
  right: 6rpx;
  width: 38rpx;
  height: 38rpx;
  border-radius: 9999rpx;
  background: #34c38f;
  display: flex;
  align-items: center;
  justify-content: center;
}

.done-text {
  color: #ffffff;
  font-size: 22rpx;
  font-weight: 900;
}

.notice {
  background: #ffffff;
  border-radius: 28rpx;
  padding: 22rpx;
  box-shadow: 0 10rpx 26rpx rgba(17, 17, 17, 0.06);
}

.n-head {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.n-icon {
  width: 56rpx;
  height: 56rpx;
  border-radius: 9999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.n-icon-img {
  width: 56rpx;
  height: 56rpx;
}

.n-title {
  font-size: 30rpx;
  font-weight: 900;
}

.n-time {
  margin-left: auto;
  font-size: 24rpx;
  font-weight: 700;
  color: rgba(17, 17, 17, 0.45);
}

.n-sub {
  display: block;
  margin-top: 14rpx;
  font-size: 32rpx;
  font-weight: 900;
}

.n-body {
  display: block;
  margin-top: 10rpx;
  font-size: 26rpx;
  line-height: 40rpx;
  font-weight: 700;
  color: rgba(17, 17, 17, 0.6);
}

.n-foot {
  margin-top: 18rpx;
  padding-top: 16rpx;
  border-top: 2rpx solid rgba(17, 17, 17, 0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.n-more {
  font-size: 26rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.7);
}

.n-chev {
  font-size: 34rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.25);
}

.invite {
  background: #ffffff;
  border-radius: 28rpx;
  padding: 22rpx;
  box-shadow: 0 10rpx 26rpx rgba(17, 17, 17, 0.06);
}

.inv-text {
  margin-top: 14rpx;
  font-size: 28rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.7);
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.inv-link {
  color: #3d6afb;
  font-weight: 900;
}

.inv-actions {
  margin-top: 16rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.btn {
  flex: 1;
  height: 84rpx;
  border-radius: 9999rpx;
  background: #3d6afb;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn.light {
  background: #eef2ff;
}

.btn-text {
  color: #ffffff;
  font-size: 30rpx;
  font-weight: 900;
}

.light-text {
  color: #3d6afb;
}
</style>
