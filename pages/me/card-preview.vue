<template>
  <view class="preview-page" :style="{ paddingTop: safeTop + 'px' }">
    <view class="topbar">
      <view class="topbar-side" @click="back">
        <image class="topbar-back" src="/static/card/icon-card-nav-back.png" mode="aspectFit" />
      </view>
      <view class="topbar-center">
        <text class="topbar-title">{{ $t('预览') }}</text>
      </view>
      <view class="topbar-side right" @click="refresh">
        <image class="topbar-refresh" src="/static/card/icon-card-loading.png" mode="aspectFit" />
      </view>
    </view>

    <view v-if="record" class="pill">
      <text class="pill-text">{{ record.timeText || $t('未设置时间') }}</text>
    </view>

    <view v-if="record" class="stage">
      <view class="book">
        <view class="book-page left-page">
          <view class="card photo">
            <view v-if="record.imageUrl" class="photo-wrap">
              <image class="photo-img" :src="record.imageUrl" mode="aspectFill" />
            </view>
            <view v-else class="placeholder"><text class="ph">{{ $t('未添加照片') }}</text></view>
          </view>
        </view>
        <view class="book-page right-page">
          <view class="card content">
            <view class="content-inner">
              <CardDoodlePreview
                v-if="hasDoodle"
                canvas-id="cardRecordPreviewCanvas"
                :doodle="record.doodle"
                background="transparent"
              />
              <view v-else-if="rightPageText" class="content-text-wrap">
                <text class="content-text">{{ rightPageText }}</text>
              </view>
              <view v-else class="face">
                <text class="emoji">😀</text>
                <view class="sketch">
                  <view class="eye" />
                  <view class="eye" />
                  <view class="mouth" />
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <view v-if="record" class="msg">
      <text class="msg-text">{{ record.message }}</text>
    </view>

    <text class="section">{{ $t('显示模式') }}</text>
    <view class="mode">
      <view class="mode-item">
        <view class="mode-left">
          <view class="mode-ico">
            <image
              class="mode-ico-img"
              :src="Number(record && record.playMode) === 1 ? '/static/card/icon-card-hand-pointer.png' : '/static/card/icon-card-play.png'"
              mode="aspectFit"
            />
          </view>
          <view class="mode-meta">
            <text class="mode-title">{{ playModeTitle }}</text>
            <text class="mode-sub">{{ playModeDesc }}</text>
          </view>
        </view>
        <image class="mode-sel" src="/static/card/icon-card-select-on.png" mode="aspectFit" />
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import CardDoodlePreview from '../../components/CardDoodlePreview.vue'
import { ensureMeState, findCardRecord, markCardRead } from '../../utils/meStore'

const CARD_PREVIEW_STORAGE_KEY = 'card_record_preview_v1'
const id = ref('')
const state = ref(ensureMeState())
const remoteRecord = ref(null)

onLoad((options) => {
  id.value = options && options.id ? String(options.id) : ''
  loadRemoteRecord()
})

onShow(() => {
  state.value = ensureMeState()
  loadRemoteRecord()
  if (id.value) {
    const s = ensureMeState()
    markCardRead(s, id.value)
    state.value = ensureMeState()
  }
})

const record = computed(() => {
  if (remoteRecord.value && String(remoteRecord.value.id || '') === String(id.value || '')) return remoteRecord.value
  return findCardRecord(state.value, id.value)
})

const playModeTitle = computed(() => {
  const mode = Number(record.value && record.value.playMode)
  return mode === 1 ? uni.$t('手动播放') : uni.$t('自动播放')
})

const playModeDesc = computed(() => {
  const mode = Number(record.value && record.value.playMode)
  return mode === 1 ? uni.$t('收到相框后，点击后打开') : uni.$t('收到相框后，祝福会自动打开')
})

const rightPageText = computed(() => {
  const current = record.value || {}
  const explicit = String(current.contentText || '').trim()
  if (explicit) return explicit
  const msg = String(current.message || '').trim()
  return msg
})

const hasDoodle = computed(() => {
  const current = record.value || {}
  const d = current.doodle && typeof current.doodle === 'object' ? current.doodle : null
  if (!d) return false
  return !!(
    (Array.isArray(d.strokes) && d.strokes.length) ||
    (Array.isArray(d.stickers) && d.stickers.length) ||
    (Array.isArray(d.texts) && d.texts.length)
  )
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

function back() {
  uni.navigateBack()
}

function refresh() {
  state.value = ensureMeState()
  loadRemoteRecord()
}

function loadRemoteRecord() {
  try {
    const raw = uni.getStorageSync(CARD_PREVIEW_STORAGE_KEY)
    const payload = raw && typeof raw === 'object' ? raw : null
    if (payload && String(payload.id || '') === String(id.value || '')) {
      remoteRecord.value = {
        ...payload,
        id: String(payload.id || '').trim(),
        timeText: String(payload.timeText || '').trim(),
        message: String(payload.message || '').trim(),
        imageUrl: String(payload.imageUrl || '').trim(),
        doodle: payload.doodle && typeof payload.doodle === 'object' ? payload.doodle : null,
        hasDoodle: !!payload.hasDoodle,
        contentText: String(payload.contentText || '').trim(),
        playMode: Number(payload.playMode || 0) || 0,
      }
      return
    }
  } catch (e) {}
  remoteRecord.value = null
}
</script>

<style scoped lang="scss">
.preview-page {
  min-height: 100vh;
  background: #eaf2ff;
  padding: 0 36rpx 80rpx;
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

.pill {
  margin-top: 10rpx;
  display: flex;
  justify-content: center;
}

.pill-text {
  height: 64rpx;
  padding: 0 26rpx;
  border-radius: 999rpx;
  background: rgba(61, 106, 251, 0.18);
  color: #3d6afb;
  font-size: 28rpx;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
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
  position: relative;
}

.book::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 0;
  width: 8rpx;
  height: 100%;
  transform: translateX(-50%);
  background: linear-gradient(180deg, rgba(17, 17, 17, 0.08) 0%, rgba(17, 17, 17, 0.02) 100%);
  opacity: 0.7;
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

.content-inner {
  width: 100%;
  height: 100%;
  padding: 18rpx;
  box-sizing: border-box;
  overflow: hidden;
}

.content-text-wrap {
  width: 100%;
  height: 100%;
  padding: 24rpx 20rpx;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
}

.content-text {
  font-size: 30rpx;
  line-height: 1.5;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.82);
  text-align: center;
  word-break: break-all;
}

.photo-wrap,
.photo-img {
  width: 100%;
  height: 100%;
}

.photo-wrap {
  background: #ffffff;
  box-shadow: 0 10rpx 20rpx rgba(17, 17, 17, 0.08);
}

.placeholder .ph {
  font-size: 28rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.45);
}

.face {
  width: 100%;
  height: 100%;
  background: rgba(255, 214, 77, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.emoji {
  top: 16rpx;
  left: 16rpx;
  font-size: 44rpx;
  position: absolute;
}

.sketch {
  width: 188rpx;
  height: 196rpx;
  position: relative;
}

.eye {
  position: absolute;
  top: 74rpx;
  width: 18rpx;
  height: 18rpx;
  border-radius: 999rpx;
  border: 4rpx solid rgba(17, 17, 17, 0.62);
  border-top: 0;
  border-left: 0;
  transform: rotate(40deg);
  background: transparent;
}

.eye:first-child {
  left: 50rpx;
}

.eye:last-child {
  right: 50rpx;
}

.mouth {
  position: absolute;
  left: 50%;
  bottom: 48rpx;
  width: 92rpx;
  height: 40rpx;
  border: 5rpx solid rgba(17, 17, 17, 0.62);
  border-top: 0;
  border-left: 0;
  border-right: 0;
  border-radius: 0 0 999rpx 999rpx;
  transform: translateX(-50%) rotate(-6deg);
}

.sketch::before {
  content: '';
  position: absolute;
  left: 34rpx;
  top: 36rpx;
  width: 120rpx;
  height: 132rpx;
  border: 5rpx solid rgba(17, 17, 17, 0.62);
  border-radius: 46% 42% 38% 44%;
  transform: rotate(-8deg);
}

.sketch::after {
  content: '';
  position: absolute;
  left: 24rpx;
  top: 84rpx;
  width: 16rpx;
  height: 30rpx;
  border-left: 5rpx solid rgba(17, 17, 17, 0.62);
  border-radius: 999rpx;
  transform: rotate(-12deg);
}

.msg {
  margin-top: 22rpx;
  border-radius: 22rpx;
  background: rgba(255, 255, 255, 0.96);
  padding: 18rpx 20rpx 26rpx;
  min-height: 164rpx;
  box-shadow: 0 8rpx 20rpx rgba(17, 17, 17, 0.05);
}

.msg-text {
  font-size: 24rpx;
  font-weight: 700;
  line-height: 38rpx;
  color: rgba(17, 17, 17, 0.85);
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
  color: rgba(17, 17, 17, 0.45);
}

.mode-sel {
  width: 28rpx;
  height: 28rpx;
  display: block;
}
</style>
