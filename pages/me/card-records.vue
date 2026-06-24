<template>
  <view class="page">
    <view class="head" :style="{ paddingTop: safeTop + 'px' }">
      <view class="head-left" @click="back"><image class="back-img" src="/static/my/icon_back.png" mode="aspectFit" /></view>
      <text class="title">卡片记录</text>
      <view class="head-right" @click="clearAll"><text class="clear">清除</text></view>
    </view>

    <view class="tabs">
      <view class="tab" @click="active = 'local'">
        <text class="tab-text" :class="{ on: active === 'local' }">本地</text>
      </view>
      <view class="tab" @click="active = 'online'">
        <text class="tab-text" :class="{ on: active === 'online' }">在线</text>
      </view>
    </view>

    <view v-if="items.length === 0" class="empty">
      <image class="empty-img" src="/static/my/img_empty_cards.png" mode="widthFix" />
      <text class="empty-text">尚无卡片记录</text>
    </view>

    <view v-else class="list">
      <view v-for="it in items" :key="it.id" class="card">
        <view class="top">
          <view class="env"><image class="env-img" src="/static/my/icon_cards.png" mode="aspectFit" /></view>
          <view class="meta">
            <text class="c-title">{{ it.title }}</text>
            <text class="c-sub">设备：{{ it.device }}</text>
            <text class="c-sub">时间：{{ it.timeText }}</text>
          </view>
        </view>

        <view class="bottom">
          <text class="badge" :class="{ unread: it.status === 'unread' }">{{ it.status === 'unread' ? '未读' : '已读' }}</text>
          <view class="actions">
            <view class="a-btn" @click="preview(it)"><image class="a-img" src="/static/task/icon_edit_square.png" mode="aspectFit" /></view>
            <template v-if="active === 'local'">
              <view class="a-btn" @click="undo(it.id)"><image class="a-img" src="/static/my/icon_preview.png" mode="aspectFit" /></view>
              <view class="a-btn danger" @click="remove(it.id)"><image class="a-img danger-img" src="/static/task/icon_trash_red.png" mode="aspectFit" /></view>
            </template>
          </view>
        </view>
      </view>
    </view>

    <!-- 自定义删除/撤销弹窗 -->
    <view v-if="dialogVisible" class="dialog-mask" @click="closeDialog">
      <view class="dialog-content" @click.stop>
        <text class="d-title">{{ dialogType === 'remove' ? '删除' : '撤销' }}</text>
        <text class="d-sub">{{ dialogType === 'remove' ? '设备端的卡片也将被删除' : '您确定要撤回卡片吗？' }}</text>
        <view class="d-actions">
          <view class="d-btn cancel" @click="closeDialog"><text class="d-btn-text cancel-text">取消</text></view>
          <view class="d-btn confirm" @click="confirmDialog"><text class="d-btn-text confirm-text">{{ dialogType === 'remove' ? '删除' : '撤销' }}</text></view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { clearCardRecords, deleteCardRecord, ensureMeState, listCardRecords } from '../../utils/meStore'
import { cardsApi } from '../../utils/api'

const state = ref(ensureMeState())
const active = ref('local')
const onlineItems = ref([])
const dialogVisible = ref(false)
const dialogType = ref('') // 'remove' | 'undo'
const activeId = ref('')

onShow(() => {
  state.value = ensureMeState()
  refreshOnline()
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

const items = computed(() => {
  if (active.value === 'online') return onlineItems.value
  return listCardRecords(state.value)
})

function back() {
  uni.navigateBack()
}

function clearAll() {
  if (!items.value.length) return
  if (active.value === 'online') {
    uni.showToast({ title: '在线记录暂不支持清除', icon: 'none' })
    return
  }
  uni.showModal({
    title: '',
    content: '确定清除全部卡片记录？',
    cancelText: '取消',
    confirmText: '清除',
    success: (res) => {
      if (!res.confirm) return
      const s = ensureMeState()
      clearCardRecords(s)
      state.value = ensureMeState()
    },
  })
}

function preview(it) {
  if (!it) return
  if (active.value === 'online') {
    const url = String(it.imageUrl || '').trim()
    if (url) {
      uni.previewImage({ urls: [url] })
    }
    const msg = String(it.message || '').trim()
    if (msg) {
      uni.showModal({ title: '祝福语', content: msg, showCancel: false })
    }
    return
  }
  uni.navigateTo({ url: `/pages/me/card-preview?id=${encodeURIComponent(String(it.id || ''))}` })
}

function undo(id) {
  activeId.value = id
  dialogType.value = 'undo'
  dialogVisible.value = true
}

function remove(id) {
  activeId.value = id
  dialogType.value = 'remove'
  dialogVisible.value = true
}

function closeDialog() {
  dialogVisible.value = false
  activeId.value = ''
}

function confirmDialog() {
  if (!activeId.value) return
  const s = ensureMeState()
  deleteCardRecord(s, activeId.value)
  state.value = ensureMeState()
  if (dialogType.value === 'undo') {
    uni.showToast({ title: '已撤回', icon: 'none' })
  }
  closeDialog()
}

async function refreshOnline() {
  const logged = !!uni.getStorageSync('auth_logged_in')
  if (!logged) {
    onlineItems.value = []
    return
  }
  try {
    const list = await cardsApi.getGreetingCardList()
    onlineItems.value = (list || []).map((c) => {
      const isTimer = Number(c && c.isTimer) === 1
      const timeText = isTimer ? `${c.timedDate || ''} ${c.timedTime || ''}`.trim() : ''
      return {
        id: String(c.cardId || ''),
        title: '贺卡',
        device: String(c.deviceEmail || ''),
        timeText,
        status: 'read',
        message: String(c.greetings || ''),
        imageUrl: String(c.imageUrl || ''),
      }
    })
  } catch (e) {
    onlineItems.value = []
  }
}
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: #ffffff;
  padding: 0 28rpx 40rpx;
}

.head {
  position: sticky;
  top: 0;
  z-index: 999;
  background: #ffffff;
  padding: 18rpx 0 12rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.head-left {
  width: 120rpx;
  display: flex;
  align-items: center;
}

.back {
  font-size: 56rpx;
  font-weight: 700;
  line-height: 1;
  color: rgba(17, 17, 17, 0.85);
}

.back-img {
  width: 44rpx;
  height: 44rpx;
  opacity: 0.9;
}

.title {
  font-size: 34rpx;
  font-weight: 900;
  color: #111111;
}

.head-right {
  width: 120rpx;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.tabs {
  margin-top: 10rpx;
  display: flex;
  align-items: center;
  gap: 18rpx;
}

.tab {
  height: 64rpx;
  padding: 0 22rpx;
  border-radius: 9999rpx;
  background: rgba(17, 17, 17, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
}

.tab-text {
  font-size: 26rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.55);
}

.tab-text.on {
  color: rgba(17, 17, 17, 0.9);
}

.clear {
  font-size: 28rpx;
  font-weight: 500;
  color: #406DFF;
}

.empty {
  padding: 220rpx 0 0;
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
  font-weight: 500;
  color: #888888;
}

.list {
  margin-top: 16rpx;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.card {
  border-radius: 24rpx;
  background: #f8f8f8;
  box-shadow: none;
  padding: 32rpx;
}

.top {
  display: flex;
  align-items: flex-start;
  gap: 24rpx;
}

.env {
  width: 120rpx;
  height: 120rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.env-img {
  width: 120rpx;
  height: 120rpx;
}

.meta {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.c-title {
  font-size: 32rpx;
  font-weight: 800;
  color: #111111;
}

.c-sub {
  font-size: 26rpx;
  font-weight: 500;
  color: #888888;
}

.bottom {
  margin-top: 24rpx;
  padding: 8px 18rpx;
  background: #ffffff;
  border-radius: 16rpx;
  border: 2rpx solid rgba(17, 17, 17, 0.05);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.badge {
  font-size: 28rpx;
  font-weight: 500;
  color: #888888;
}

.badge.unread {
  color: #ff3b30;
}

.actions {
  display: flex;
  background: #ffffff;
  align-items: center;
  gap: 24rpx;
}

.a-btn {
  display: flex;
  align-items: center;
  justify-content: center;
}

.a-img {
  width: 40rpx;
  height: 40rpx;
  opacity: 0.8;
}

.a-btn.danger .a-img {
  opacity: 1;
}

.dialog-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 80rpx;
}

.dialog-content {
  width: 100%;
  background: #ffffff;
  border-radius: 32rpx;
  padding: 48rpx 40rpx 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24rpx;
}

.d-title {
  font-size: 36rpx;
  font-weight: 900;
  color: #111111;
}

.d-sub {
  font-size: 28rpx;
  font-weight: 500;
  color: #333333;
  text-align: center;
}

.d-actions {
  margin-top: 24rpx;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.d-btn {
  flex: 1;
  height: 96rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.d-btn.cancel {
  background: #EFF2FF;
}

.d-btn.confirm {
  background: #406DFF;
}

.d-btn-text {
  font-size: 32rpx;
  font-weight: 800;
}

.cancel-text {
  color: #406DFF;
}

.confirm-text {
  color: #ffffff;
}
</style>
