<template>
  <view class="preview-page" :style="{ paddingTop: safeTop + 'px' }">
    <view class="topbar">
      <view class="topbar-side" @click="back">
        <image class="topbar-back" src="/static/card/icon-card-nav-back.png" mode="aspectFit" />
      </view>
      <view class="topbar-center">
        <text class="topbar-title">预览</text>
      </view>
      <view class="topbar-side right" @click="reload">
        <image class="topbar-refresh" src="/static/card/icon-card-loading.png" mode="aspectFit" />
      </view>
    </view>

    <view class="stage">
      <view class="book">
        <view class="book-page left-page">
          <view class="card photo">
            <view v-if="draft.photoPath || draft.imageUrl" class="photo-wrap">
              <image class="photo-img" :src="draft.photoPath || draft.imageUrl" mode="aspectFill" />
            </view>
            <view v-else class="placeholder"><text class="ph">未添加照片</text></view>
          </view>
        </view>
        <view class="book-page right-page">
          <view class="card content">
            <CardDoodlePreview canvas-id="cardPreviewCanvas" :doodle="draft.doodle" background="transparent" />
          </view>
        </view>
      </view>
    </view>

    <view class="msg">
      <textarea v-model="message" class="msg-input" placeholder="*写下您的祝福..." placeholder-class="ph-msg" maxlength="100" />
      <text class="counter">{{ message.length }}/100</text>
    </view>

    <text class="section">显示模式</text>
    <view class="mode">
      <view class="mode-item" @click="playMode = 'auto'">
        <view class="mode-left">
          <view class="mode-ico"><image class="mode-ico-img" src="/static/card/icon-card-play.png" mode="aspectFit" /></view>
          <view class="mode-meta">
            <text class="mode-title">自动播放</text>
            <text class="mode-sub bl-muted">收到相框后，祝福会自动打开</text>
          </view>
        </view>
        <image class="mode-sel" :src="playMode === 'auto' ? '/static/card/icon-card-select-on.png' : '/static/common/icon_radio_off.png'" mode="aspectFit" />
      </view>

      <view class="mode-item" @click="playMode = 'manual'">
        <view class="mode-left">
          <view class="mode-ico"><image class="mode-ico-img" src="/static/card/icon-card-hand-pointer.png" mode="aspectFit" /></view>
          <view class="mode-meta">
            <text class="mode-title">手动播放</text>
            <text class="mode-sub bl-muted">收到相框后，祝福会手动打开</text>
          </view>
        </view>
        <image class="mode-sel" :src="playMode === 'manual' ? '/static/card/icon-card-select-on.png' : '/static/common/icon_radio_off.png'" mode="aspectFit" />
      </view>
    </view>

    <view class="schedule">
      <view class="schedule-head">
        <text class="schedule-title">定期发送</text>
        <view class="schedule-switch" :class="{ on: scheduleEnabled }" @click="scheduleEnabled = !scheduleEnabled">
          <view class="schedule-switch-dot" />
        </view>
      </view>

      <view v-if="scheduleEnabled" class="schedule-grid">
        <picker mode="date" :value="scheduleDate" @change="scheduleDate = $event.detail.value">
          <view class="schedule-cell">
            <text class="schedule-label bl-muted">发送日期</text>
            <text class="schedule-value">{{ scheduleDate }}</text>
          </view>
        </picker>
        <picker mode="time" :value="scheduleTime" @change="scheduleTime = $event.detail.value">
          <view class="schedule-cell">
            <text class="schedule-label bl-muted">发送时间</text>
            <text class="schedule-value">{{ scheduleTime }}</text>
          </view>
        </picker>
      </view>
    </view>

    <view class="send" :class="{ disabled: !canSend }" @click="send">
      <text class="send-text">发送卡片</text>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import CardDoodlePreview from '../../components/CardDoodlePreview.vue'
import { ensureCardDraft, saveCardDraft } from '../../utils/cardStore'

const draft = ref(ensureCardDraft())
const message = ref('')
const playMode = ref('auto')
const scheduleEnabled = ref(false)
const scheduleDate = ref('')
const scheduleTime = ref('')

onShow(() => {
  draft.value = ensureCardDraft()
  message.value = String(draft.value.message || '')
  playMode.value = draft.value.playMode === 'manual' ? 'manual' : 'auto'
  scheduleEnabled.value = !!draft.value.scheduleEnabled
  scheduleDate.value = String(draft.value.scheduleDate || '')
  scheduleTime.value = String(draft.value.scheduleTime || '')
})

const canSend = computed(() => {
  return String(message.value || '').trim().length > 0
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

function persist() {
  draft.value = saveCardDraft({
    ...draft.value,
    message: message.value,
    playMode: playMode.value,
    scheduleEnabled: !!scheduleEnabled.value,
    scheduleDate: scheduleDate.value,
    scheduleTime: scheduleTime.value,
  })
}

function reload() {
  draft.value = ensureCardDraft()
}

function back() {
  uni.navigateBack()
}

function send() {
  if (!canSend.value) {
    uni.showToast({ title: '请输入祝福内容', icon: 'none' })
    return
  }
  persist()
  uni.navigateTo({ url: '/pages/cards/share' })
}
</script>

<style scoped lang="scss">
.preview-page {
  min-height: 100vh;
  background: #eaf2ff;
  padding: 0 36rpx 240rpx;
}

.topbar {
  height: 92rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.topbar-side {
  width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.topbar-side.right {
  justify-content: flex-end;
}

.topbar-back {
  width: 26rpx;
  height: 26rpx;
  display: block;
}

.topbar-refresh {
  width: 30rpx;
  height: 30rpx;
  display: block;
  opacity: 0.72;
}

.topbar-center {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.topbar-title {
  font-size: 32rpx;
  font-weight: 900;
  color: #111111;
}

.stage {
  margin-top: 26rpx;
  position: relative;
  width: 100%;
  aspect-ratio: 246 / 150;
  overflow: visible;
  display: flex;
  align-items: center;
  justify-content: center;
}

.book {
  width: 90%;
  height: 88%;
  display: flex;
  box-shadow: 0 16rpx 32rpx rgba(17, 17, 17, 0.08);
  border-radius: 16rpx;
}

.book-page {
  flex: 1;
  position: relative;
  height: 100%;
}

.book-page.left-page {
  background: #ffffff;
  border-radius: 16rpx 0 0 16rpx;
  box-shadow: inset -12rpx 0 20rpx -12rpx rgba(17, 17, 17, 0.08);
}

.book-page.right-page {
  background: #f2e9c9;
  border-radius: 0 16rpx 16rpx 0;
  box-shadow: inset 12rpx 0 20rpx -12rpx rgba(17, 17, 17, 0.15);
}

.card {
  position: absolute;
  border-radius: 0;
  overflow: hidden;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card.photo {
  left: -5%;
  top: 6%;
  width: 95%;
  height: 95%;
  transform: rotate(-7deg);
  transform-origin: center center;
}

.card.content {
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background: transparent;
  z-index: 1;
}

.photo-wrap {
  width: 100%;
  height: 100%;
}

.photo-img {
  width: 100%;
  height: 100%;
}

.placeholder .ph {
  font-size: 28rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.45);
}

.msg {
  margin-top: 22rpx;
  border-radius: 22rpx;
  background: rgba(255, 255, 255, 0.96);
  padding: 16rpx 18rpx 42rpx;
  min-height: 164rpx;
  box-shadow: 0 8rpx 20rpx rgba(17, 17, 17, 0.05);
  position: relative;
}

.msg-input {
  width: 100%;
  min-height: 108rpx;
  font-size: 24rpx;
  font-weight: 700;
  line-height: 38rpx;
  color: rgba(17, 17, 17, 0.85);
}

.ph-msg {
  color: rgba(17, 17, 17, 0.28);
}

.counter {
  position: absolute;
  right: 18rpx;
  bottom: 14rpx;
  font-size: 24rpx;
  font-weight: 700;
  color: rgba(17, 17, 17, 0.28);
}

.section {
  display: block;
  margin-top: 38rpx;
  font-size: 28rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.85);
}

.mode {
  margin-top: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.mode-item {
  border-radius: 20rpx;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 8rpx 18rpx rgba(17, 17, 17, 0.05);
  padding: 16rpx 18rpx;
  margin-bottom: 12rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.mode-left {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.mode-ico {
  width: 58rpx;
  height: 58rpx;
  border-radius: 14rpx;
  background: rgba(61, 106, 251, 0.08);
  border: 2rpx solid rgba(61, 106, 251, 0.36);
  display: flex;
  align-items: center;
  justify-content: center;
}

.mode-ico-img {
  width: 28rpx;
  height: 28rpx;
  display: block;
}

.mode-meta {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.mode-title {
  font-size: 26rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.9);
}

.mode-sub {
  font-size: 20rpx;
  font-weight: 700;
  line-height: 30rpx;
}

.mode-sel {
  width: 28rpx;
  height: 28rpx;
  display: block;
}

.schedule {
  margin-top: 18rpx;
}

.schedule-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.schedule-title {
  font-size: 28rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.85);
}

.schedule-switch {
  width: 70rpx;
  height: 38rpx;
  border-radius: 999rpx;
  background: rgba(17, 17, 17, 0.15);
  padding: 4rpx;
  display: flex;
  align-items: center;
  transition: all 0.2s ease;
}

.schedule-switch.on {
  background: #3d6afb;
}

.schedule-switch-dot {
  width: 30rpx;
  height: 30rpx;
  border-radius: 999rpx;
  background: #ffffff;
  transition: transform 0.2s ease;
}

.schedule-switch.on .schedule-switch-dot {
  transform: translateX(32rpx);
}

.schedule-grid {
  margin-top: 12rpx;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12rpx;
}

.schedule-cell {
  border-radius: 18rpx;
  background: rgba(255, 255, 255, 0.72);
  padding: 16rpx 16rpx 14rpx;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.schedule-label {
  font-size: 20rpx;
  font-weight: 700;
  color: rgba(17, 17, 17, 0.28);
}

.schedule-value {
  font-size: 28rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.9);
}

.send {
  position: fixed;
  left: 28rpx;
  right: 28rpx;
  bottom: 34rpx;
  height: 92rpx;
  border-radius: 999rpx;
  background: #3d6afb;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 16rpx 28rpx rgba(61, 106, 251, 0.2);
}

.send.disabled {
  background: rgba(61, 106, 251, 0.18);
  box-shadow: none;
}

.send-text {
  color: #ffffff;
  font-size: 30rpx;
  font-weight: 900;
}
</style>
