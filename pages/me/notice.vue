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
        <switch :checked="notice.email" color="#4c8dff" class="sw" @change="onToggle('email', $event)" />
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
        <switch :checked="notice.system" color="#4c8dff" class="sw" @change="onToggle('system', $event)" />
      </view>

      <view class="item">
        <view class="left">
          <view class="ico">
            <image class="ico-img" src="/static/my/icon_belt.png" mode="aspectFit" />
          </view>
          <view class="meta">
            <text class="title">任务完成提醒</text>
            <text class="sub">引用APP完成任务时的提示音效</text>
          </view>
        </view>
        <switch :checked="notice.taskDone" color="#4c8dff" class="sw" @change="onToggle('taskDone', $event)" />
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
  const s = state.value.settings || {}
  const n = s.notifications || {}
  return {
    email: !!n.email,
    system: !!n.system,
    taskDone: !!n.taskDone,
  }
})

function onToggle(key, e) {
  const next = !!(e && e.detail ? e.detail.value : false)
  const current = state.value.settings && state.value.settings.notifications ? state.value.settings.notifications : {}
  const s = ensureMeState()
  updateSettings(s, { notifications: { ...current, [key]: next } })
  state.value = ensureMeState()
}
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: #ffffff;
}

.list {
  margin: 18rpx 28rpx 0;
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.item {
  background: rgba(17, 17, 17, 0.03);
  border-radius: 28rpx;
  padding: 22rpx 22rpx 22rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14rpx;
}

.left {
  flex: 1;
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
}

.ico {
  width: 35rpx;
  height: 35rpx;
  padding-top: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.ico-img {
  width: 100%;
  height: 100%;
  display: block;
  opacity: 0.75;
}

.meta {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  padding-top: 2rpx;
}

.title {
  font-size: 30rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.9);
}

.sub {
  font-size: 24rpx;
  font-weight: 700;
  color: rgba(17, 17, 17, 0.45);
  line-height: 1.25;
}

.sw {
  transform: scale(0.88);
  transform-origin: right center;
}
</style>
