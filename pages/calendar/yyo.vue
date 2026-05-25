<template>
  <view class="bl-page">
    <BlHeader back>
      <template #center>
        <view class="center">
          <view class="mini-icon" />
          <text class="title">YYO的日历</text>
        </view>
      </template>
    </BlHeader>

    <view v-if="active" class="top-card">
      <view class="bl-card device-card">
        <view class="bl-status-tag"><text>已激活</text></view>
        <view class="bl-row">
          <view class="thumb">
            <image class="thumb-img" src="/static/device/device_thumb.png" mode="aspectFit" />
          </view>
          <view class="meta">
            <text class="name">YYO的日历</text>
            <text class="email bl-muted">发送事件：601342282@qq.com</text>
          </view>
        </view>
      </view>

      <view class="bl-card-soft day-card">
        <text class="day-title">星期四，03月26日</text>
        <view class="task-card is-pink">
          <view class="task-left">
            <text class="task-title">钢琴课</text>
            <view class="task-time">
              <view class="clock" />
              <text class="time-text">17:25–18:24</text>
            </view>
          </view>
          <view class="bl-avatar is-red"><text>姐</text></view>
        </view>
        <view class="task-card is-gray">
          <view class="task-left">
            <text class="task-title">家庭聚会</text>
            <view class="task-time">
              <view class="clock" />
              <text class="time-text">17:25–18:24</text>
            </view>
          </view>
          <view class="avatars">
            <view class="bl-avatar is-blue"><text>弟</text></view>
            <view class="bl-avatar is-red"><text>姐</text></view>
            <view class="bl-avatar is-purple"><text>妈</text></view>
            <view class="bl-avatar is-green"><text>爸</text></view>
          </view>
        </view>
      </view>
    </view>

    <view v-else class="top-card">
      <view class="bl-card activate-card">
        <view class="hero">
          <image class="device-img" src="/static/device/device_hero_plain.png" mode="aspectFit" />
        </view>
        <text class="activate-title">准备激活设备？</text>
        <text class="activate-desc bl-muted">激活设备后，下拉可刷新应用</text>
        <view class="bl-btn-primary" @click="goActivate">
          <text>激活设备</text>
          <view class="bl-btn-arrow">
            <text class="arrow">→</text>
          </view>
        </view>
      </view>

      <view class="bl-card-soft day-empty">
        <text class="day-title">星期四，03月26日</text>
        <view class="empty-activity">
          <image class="empty-icon" src="/static/home/icon_none_activity.png" mode="aspectFit" />
          <text class="empty-text bl-muted">今日无活动</text>
        </view>
      </view>
    </view>

    <view class="grid">
      <view v-for="item in menus" :key="item.title" class="tile" :class="item.cls" @click="open(item.title)">
        <view class="tile-icon"><image class="tile-icon-img" :src="item.icon" mode="aspectFit" /></view>
        <text class="tile-title">{{ item.title }}</text>
        <text class="tile-sub bl-muted">{{ item.sub }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { onLoad } from '@dcloudio/uni-app'
import { ref } from 'vue'
import BlHeader from '../../components/BlHeader.vue'

const active = ref(false)

const menus = ref([
  { title: '日历', sub: '今天没有活动', icon: '/static/home/icon_menu_calendar.png', cls: 'is-purple' },
  { title: '任务', sub: '剩余0个', icon: '/static/home/icon_menu_tasks.png', cls: 'is-blue' },
  { title: '奖励', sub: '大胆和小目标', icon: '/static/home/icon_menu_rewards.png', cls: 'is-salmon' },
  { title: '清单', sub: '2清单', icon: '/static/home/icon_menu_list.png', cls: 'is-green' },
  { title: '餐食', sub: '我们吃什么?', icon: '/static/home/icon_menu_meals.png', cls: 'is-orange' },
  { title: '相册', sub: '2个文件', icon: '/static/home/icon_menu_gallery.png', cls: 'is-red' },
  { title: '同步', sub: '同步在线日历', icon: '/static/home/icon_menu_sync.png', cls: 'is-mint' },
  { title: '成员管理', sub: '2个成员', icon: '/static/home/icon_menu_users.png', cls: 'is-indigo' },
  { title: '设备管理', sub: '控制功能', icon: '/static/home/icon_menu_devices.png', cls: 'is-blue2' },
  { title: '用户管理', sub: '邀请你爱的人', icon: '/static/home/icon_menu_members.png', cls: 'is-indigo2' },
  { title: '通知', sub: '通知事件', icon: '/static/home/icon_menu_notice.png', cls: 'is-salmon2' },
  { title: '贺卡', sub: '给设备推送祝福', icon: '/static/home/icon_menu_cards.png', cls: 'is-orange2' },
])

onLoad((options) => {
  active.value = options?.active === '1'
})

function open(title) {
  if (title === '日历') {
    uni.navigateTo({ url: '/pages/calendar/index' })
    return
  }
  if (title === '任务') {
    uni.navigateTo({ url: '/pages/tasks/index' })
    return
  }
  if (title === '奖励') {
    uni.navigateTo({ url: '/pages/rewards/index' })
    return
  }
  if (title === '清单') {
    uni.navigateTo({ url: '/pages/lists/index' })
    return
  }
  if (title === '餐食') {
    uni.navigateTo({ url: '/pages/meals/index' })
    return
  }
  if (title === '同步') {
    uni.navigateTo({ url: '/pages/sync/sync-home' })
    return
  }
  if (title === '成员管理') {
    uni.navigateTo({ url: '/pages/members/index' })
    return
  }
  if (title === '设备管理') {
    uni.navigateTo({ url: '/pages/device/index' })
    return
  }
  if (title === '用户管理') {
    uni.navigateTo({ url: '/pages/users/index' })
    return
  }
  if (title === '相册') {
    uni.navigateTo({ url: '/pages/gallery/index' })
    return
  }
  if (title === '通知') {
    uni.navigateTo({ url: '/pages/activity/index?tab=notice' })
    return
  }
  if (title === '贺卡') {
    uni.navigateTo({ url: '/pages/cards/index' })
    return
  }
  uni.showToast({ title, icon: 'none' })
}

function goActivate() {
  uni.navigateTo({ url: '/pages/device/activate' })
}
</script>

<style scoped lang="scss">
.bl-page {
  background: #ffffff;
}

.center {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.mini-icon {
  width: 34rpx;
  height: 24rpx;
  border-radius: 6rpx;
  background: linear-gradient(135deg, #ffd24d 0%, #3d6afb 100%);
}

.title {
  font-size: 34rpx;
  font-weight: 900;
}

.top-card {
  margin-top: 0;
}

.device-card {
  position: relative;
}

.thumb {
  width: 110rpx;
  height: 82rpx;
  border-radius: 14rpx;
  position: relative;
  overflow: hidden;
}

.thumb-img {
  width: 100%;
  height: 100%;
}

.meta {
  margin-left: 18rpx;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.name {
  font-size: 32rpx;
  font-weight: 900;
}

.email {
  font-size: 24rpx;
}

.day-card {
  margin-top: 18rpx;
}

.day-title {
  display: block;
  font-size: 26rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.7);
  margin-bottom: 14rpx;
}

.task-card {
  border-radius: 24rpx;
  padding: 18rpx 18rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.task-card + .task-card {
  margin-top: 14rpx;
}

.task-card.is-pink {
  background: #fdecee;
}

.task-card.is-gray {
  background: rgba(255, 255, 255, 0.55);
}

.task-left {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.task-title {
  font-size: 30rpx;
  font-weight: 900;
}

.task-time {
  display: flex;
  align-items: center;
  gap: 10rpx;
  color: rgba(17, 17, 17, 0.55);
  font-size: 24rpx;
  font-weight: 700;
}

.clock {
  width: 26rpx;
  height: 26rpx;
  border-radius: 9999rpx;
  border: 3rpx solid rgba(17, 17, 17, 0.25);
  position: relative;
}

.clock::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  width: 8rpx;
  height: 2rpx;
  background: rgba(17, 17, 17, 0.35);
  transform: translate(-10%, -50%);
}

.avatars {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.bl-avatar.is-blue {
  background: #4c8dff;
}

.bl-avatar.is-red {
  background: #ff5a5f;
}

.bl-avatar.is-purple {
  background: #9b59ff;
}

.bl-avatar.is-green {
  background: #4cc38a;
}

.activate-card {
  background: rgba(17, 17, 17, 0.04);
  padding-bottom: 18rpx;
}

.hero {
  height: 320rpx;
  position: relative;
}

.device-img {
  position: absolute;
  left: 50%;
  top: 10rpx;
  width: 600rpx;
  height: 300rpx;
  transform: translateX(-50%);
}

.device-plate {
  position: absolute;
  left: 50%;
  top: 120rpx;
  width: 640rpx;
  height: 260rpx;
  transform: translateX(-50%);
  background: radial-gradient(circle at 50% 40%, rgba(61, 106, 251, 0.22) 0%, rgba(61, 106, 251, 0) 70%);
  border-radius: 9999rpx;
}

.device-frame {
  position: absolute;
  left: 50%;
  top: 10rpx;
  width: 420rpx;
  height: 220rpx;
  transform: translateX(-50%) rotate(-10deg);
  border-radius: 22rpx;
  background: #111111;
  box-shadow: 0 18rpx 40rpx rgba(17, 17, 17, 0.16);
}

.device-frame::after {
  content: '';
  position: absolute;
  left: 16rpx;
  top: 16rpx;
  right: 16rpx;
  bottom: 16rpx;
  border-radius: 16rpx;
  background: #f6f6f6;
}

.activate-title {
  display: block;
  text-align: center;
  font-size: 30rpx;
  font-weight: 900;
  color: #3d6afb;
  margin-top: 2rpx;
}

.activate-desc {
  display: block;
  text-align: center;
  font-size: 24rpx;
  font-weight: 650;
  margin-top: 8rpx;
}

.bl-btn-primary {
  margin-top: 20rpx;
}

.arrow {
  font-size: 30rpx;
  font-weight: 900;
}

.bl-card-soft.day-empty {
  margin-top: 18rpx;
  background: url('/static/home/bg_none_activity.png') no-repeat;
  background-size: 100% 100%;
}

.empty-activity {
  height: 240rpx;
  margin-top: 22rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
}

.empty-icon {
  width: 120rpx;
  height: 120rpx;
  display: block;
}

.empty-text {
  padding-top: 12rpx;
  font-size: 20rpx;
  font-weight: 400;
}

.grid {
  margin-top: 18rpx;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18rpx;
}

.tile {
  border-radius: 28rpx;
  padding: 20rpx 18rpx;
  min-height: 154rpx;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  background: #ffffff;
  box-shadow: 0 10rpx 26rpx rgba(17, 17, 17, 0.06);
}

.tile-icon {
  width: 70rpx;
  height: 70rpx;
  border-radius: 24rpx;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tile-icon-img {
  width: 70rpx;
  height: 70rpx;
}

.tile-title {
  font-size: 30rpx;
  font-weight: 900;
}

.tile-sub {
  font-size: 22rpx;
  font-weight: 650;
}

.tile.is-purple {
  background: #eef0ff;
}

.tile.is-blue {
  background: #eaf2ff;
}

.tile.is-salmon {
  background: #fdecee;
}

.tile.is-green {
  background: #eaf7f1;
}

.tile.is-orange {
  background: #fff1e1;
}

.tile.is-red {
  background: #ffe8e9;
}

.tile.is-mint {
  background: #e8fbf4;
}

.tile.is-indigo {
  background: #eef2ff;
}

.tile.is-blue2 {
  background: #eaf2ff;
}

.tile.is-indigo2 {
  background: #eef2ff;
}

.tile.is-salmon2 {
  background: #fff0f0;
}

.tile.is-orange2 {
  background: #fff2e6;
}
</style>

<style lang="scss">
page {
  background: #ffffff !important;
}
</style>
