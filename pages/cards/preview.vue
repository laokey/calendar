<template>
  <view class="bl-page preview-page">
    <BlHeader title="预览" back>
      <template #right>
        <view class="top-refresh" @click="reload"><text class="top-refresh-text">↻</text></view>
      </template>
    </BlHeader>

    <view class="stage">
      <view class="card photo">
        <view v-if="draft.photoPath" class="photo-wrap">
          <image class="photo-img" :src="draft.photoPath" mode="aspectFill" />
        </view>
        <view v-else class="placeholder"><text class="ph">未添加照片</text></view>
      </view>

      <view class="card content">
        <view class="content-inner">
          <text class="content-emoji">😀</text>
          <text class="content-text">{{ doodleTitle }}</text>
          <view v-if="stickerEmoji" class="content-sticker"><text class="content-sticker-text">{{ stickerEmoji }}</text></view>
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
          <view class="mode-ico"><text class="mode-ico-text">▶</text></view>
          <view class="mode-meta">
            <text class="mode-title">自动播放</text>
            <text class="mode-sub bl-muted">收到相框后，祝福会自动打开</text>
          </view>
        </view>
        <image
          class="mode-sel"
          :src="playMode === 'auto' ? '/static/calendar/icon_radio_on.png' : '/static/calendar/icon_radio_off.png'"
          mode="aspectFit"
        />
      </view>

      <view class="mode-item" @click="playMode = 'manual'">
        <view class="mode-left">
          <view class="mode-ico"><text class="mode-ico-text">☝</text></view>
          <view class="mode-meta">
            <text class="mode-title">手动播放</text>
            <text class="mode-sub bl-muted">收到相框后，祝福会手动打开</text>
          </view>
        </view>
        <image
          class="mode-sel"
          :src="playMode === 'manual' ? '/static/calendar/icon_radio_on.png' : '/static/calendar/icon_radio_off.png'"
          mode="aspectFit"
        />
      </view>
    </view>

    <view class="schedule">
      <view class="schedule-head">
        <text class="schedule-title">定期发送</text>
        <switch :checked="scheduleEnabled" color="#3d6afb" @change="scheduleEnabled = !!$event.detail.value" />
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
import BlHeader from '../../components/BlHeader.vue'
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

const doodleTitle = computed(() => {
  const list = draft.value?.doodle?.texts || []
  const t = list.length ? list[list.length - 1] : null
  return t && t.text ? String(t.text) : ''
})

const stickerEmoji = computed(() => {
  const list = draft.value?.doodle?.stickers || []
  const s = list.length ? list[list.length - 1] : null
  return s && s.emoji ? String(s.emoji) : ''
})

const canSend = computed(() => {
  return String(message.value || '').trim().length > 0
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
  padding-bottom: 240rpx;
}

.top-refresh {
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 12rpx;
}

.top-refresh-text {
  font-size: 34rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.55);
}

.stage {
  margin-top: 18rpx;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18rpx;
  align-items: stretch;
}

.card {
  height: 420rpx;
  border-radius: 24rpx;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 10rpx 26rpx rgba(17, 17, 17, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
}

.card.photo {
  transform: rotate(-6deg);
}

.card.content {
  background: rgba(255, 214, 77, 0.22);
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

.content-inner {
  width: 100%;
  height: 100%;
  padding: 20rpx;
  position: relative;
}

.content-emoji {
  font-size: 44rpx;
  font-weight: 900;
}

.content-text {
  margin-top: 10rpx;
  font-size: 42rpx;
  font-weight: 900;
  line-height: 56rpx;
  color: rgba(17, 17, 17, 0.9);
}

.content-sticker {
  position: absolute;
  right: 24rpx;
  bottom: 24rpx;
}

.content-sticker-text {
  font-size: 64rpx;
}

.msg {
  margin-top: 18rpx;
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.95);
  padding: 18rpx 18rpx;
  min-height: 180rpx;
  box-shadow: 0 10rpx 26rpx rgba(17, 17, 17, 0.06);
  position: relative;
}

.msg-input {
  width: 100%;
  min-height: 140rpx;
  font-size: 30rpx;
  font-weight: 800;
  line-height: 44rpx;
  color: rgba(17, 17, 17, 0.85);
}

.ph-msg {
  color: rgba(255, 75, 63, 0.85);
}

.counter {
  position: absolute;
  right: 18rpx;
  bottom: 14rpx;
  font-size: 24rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.35);
}

.section {
  display: block;
  margin-top: 24rpx;
  font-size: 28rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.85);
}

.mode {
  margin-top: 12rpx;
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.mode-item {
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 10rpx 26rpx rgba(17, 17, 17, 0.06);
  padding: 18rpx 18rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.mode-left {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.mode-ico {
  width: 72rpx;
  height: 72rpx;
  border-radius: 22rpx;
  background: rgba(61, 106, 251, 0.12);
  border: 2rpx solid rgba(61, 106, 251, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
}

.mode-ico-text {
  font-size: 28rpx;
  font-weight: 900;
  color: #3d6afb;
}

.mode-meta {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.mode-title {
  font-size: 30rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.9);
}

.mode-sub {
  font-size: 24rpx;
  font-weight: 700;
}

.mode-sel {
  width: 40rpx;
  height: 40rpx;
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

.schedule-grid {
  margin-top: 14rpx;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14rpx;
}

.schedule-cell {
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 10rpx 26rpx rgba(17, 17, 17, 0.06);
  padding: 18rpx 18rpx;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.schedule-label {
  font-size: 24rpx;
  font-weight: 700;
}

.schedule-value {
  font-size: 30rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.9);
}

.send {
  position: fixed;
  left: 28rpx;
  right: 28rpx;
  bottom: 34rpx;
  height: 104rpx;
  border-radius: 999rpx;
  background: #3d6afb;
  display: flex;
  align-items: center;
  justify-content: center;
}

.send.disabled {
  background: rgba(61, 106, 251, 0.18);
}

.send-text {
  color: #ffffff;
  font-size: 34rpx;
  font-weight: 900;
}
</style>

