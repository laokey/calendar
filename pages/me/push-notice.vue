<template>
  <view class="page">
    <BlHeader title="通知" back />

    <view class="list">
      <view class="item">
        <view class="left">
          <view class="ico">
            <image class="ico-img" src="/static/my/icon_email.png" mode="aspectFit" />
          </view>
          <view class="meta">
            <text class="title">邮件推送通知</text>
            <text class="sub">这意味着我们将推送服务通知，例如系统升级、到您注册的电子邮件地址。</text>
          </view>
        </view>
        <switch :checked="notice.email" color="#4a6cff" class="sw" @change="onToggle('email', $event)" />
      </view>

      <view class="item">
        <view class="left">
          <view class="ico">
            <image class="ico-img" src="/static/my/icon_phone.png" mode="aspectFit" />
          </view>
          <view class="meta">
            <text class="title">手机系统通知</text>
            <text class="sub">当应用程序不在使用时，推送通知，您可以启用它来推送任务和事件的提醒</text>
          </view>
        </view>
        <switch :checked="notice.system" color="#4a6cff" class="sw" @change="onToggle('system', $event)" />
      </view>

      <view class="item">
        <view class="left">
          <view class="ico">
            <image class="ico-img" src="/static/my/icon_belt.png" mode="aspectFit" />
          </view>
          <view class="meta">
            <text class="title">任务完成提醒</text>
            <text class="sub">引用 APP 完成任务时的提示音效</text>
          </view>
        </view>
        <switch :checked="notice.taskDone" color="#4a6cff" class="sw" @change="onToggle('taskDone', $event)" />
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import BlHeader from '../../components/BlHeader.vue'
import { ensureMeState, updateSettings } from '../../utils/meStore'

const state = ref(ensureMeState())

onShow(() => {
  state.value = ensureMeState()
})

const notice = computed(() => {
  const settings = state.value.settings || {}
  const notifications = settings.notifications || {}
  return {
    email: !!notifications.email,
    system: !!notifications.system,
    taskDone: !!notifications.taskDone,
  }
})

function onToggle(key, e) {
  const next = !!(e && e.detail ? e.detail.value : false)
  const settings = state.value.settings || {}
  const notifications = settings.notifications || {}
  const nextNotifications = { ...notifications, [key]: next }
  const current = ensureMeState()
  updateSettings(current, { notifications: nextNotifications })
  state.value = ensureMeState()
}
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: #ffffff;
}

.list {
  margin: 58rpx 28rpx 0;
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.item {
  background: #FAFAFA;
  border-radius: 24rpx;
  padding: 22rpx 22rpx 20rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
}

.left {
  flex: 1;
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  min-width: 0;
}

.ico {
  width: 42rpx;
  height: 42rpx;
  padding-top: 4rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.ico-img {
  width: 32rpx;
  height: 32rpx;
  display: block;
  opacity: 0.7;
}

.meta {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  min-width: 0;
}

.title {
  font-size: 32rpx;
  font-weight: 900;
  color: #333333;
  line-height: 40rpx;
}

.sub {
  font-size: 26rpx;
  font-weight: 500;
  color: #999999;
  line-height: 38rpx;
}

.sw {
  flex-shrink: 0;
  transform: scale(0.82);
  transform-origin: right center;
  margin-right: -6rpx;
}
</style>
