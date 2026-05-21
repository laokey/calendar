<template>
  <view class="bl-page share-page">
    <BlHeader back title="">
      <template #center>
        <text class="head-title"> </text>
      </template>
    </BlHeader>

    <view class="hero">
      <view class="hero-icon">
        <text class="hero-emoji">💬</text>
      </view>
      <text class="hero-title">分享给您的家人或朋友</text>
      <text class="hero-sub bl-muted">您想共享哪个设备</text>
    </view>

    <view class="list">
      <view v-for="d in devices" :key="d.id" class="row" @click="selectedId = d.id">
        <text class="row-text">{{ d.name }}</text>
        <image
          class="row-sel"
          :src="selectedId === d.id ? '/static/common/icon_radio_on.png' : '/static/common/icon_radio_off.png'"
          mode="aspectFit"
        />
      </view>
    </view>

    <view class="send" @click="confirmSend">
      <text class="send-text">发送卡片</text>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import BlHeader from '../../components/BlHeader.vue'
import { clearCardDraft, ensureCardDraft } from '../../utils/cardStore'
import { addCardRecord, ensureMeState } from '../../utils/meStore'
import { ensureCalendarState, listMembers } from '../../utils/calendarStore'

const draft = ref(ensureCardDraft())
const selectedId = ref('')

const devices = computed(() => {
  const state = ensureCalendarState()
  const members = listMembers(state).filter((m) => m && m.group !== 'calendarColor')
  const list = members.slice(0, 6).map((m) => ({ id: String(m.id), name: `${m.name}的日历` }))
  if (!list.length) return [{ id: 'dev_1', name: '家庭日历' }]
  return list
})

onShow(() => {
  draft.value = ensureCardDraft()
  if (!selectedId.value && devices.value.length) selectedId.value = String(devices.value[0].id)
})

function confirmSend() {
  const dev = devices.value.find((x) => x.id === selectedId.value)
  if (!dev) {
    uni.showToast({ title: '请选择设备', icon: 'none' })
    return
  }
  uni.showToast({ title: '已发送', icon: 'none' })
  const me = ensureMeState()
  addCardRecord(me, {
    title: '贺卡',
    device: dev.name,
    message: draft.value.message || '',
    mode: draft.value.playMode || 'auto',
  })
  clearCardDraft()
  uni.navigateBack({ delta: 3 })
}
</script>

<style scoped lang="scss">
.share-page {
  min-height: 100vh;
  background: #ffffff;
  padding-bottom: 240rpx;
}

.hero {
  margin-top: 70rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.hero-icon {
  width: 180rpx;
  height: 180rpx;
  border-radius: 9999rpx;
  background: rgba(61, 106, 251, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-emoji {
  font-size: 74rpx;
}

.hero-title {
  margin-top: 24rpx;
  font-size: 34rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.9);
}

.hero-sub {
  margin-top: 14rpx;
  font-size: 26rpx;
  font-weight: 700;
}

.list {
  margin-top: 40rpx;
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.row {
  height: 118rpx;
  border-radius: 24rpx;
  background: rgba(17, 17, 17, 0.04);
  padding: 0 22rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.row-text {
  font-size: 30rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.85);
}

.row-sel {
  width: 44rpx;
  height: 44rpx;
  display: block;
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

.send-text {
  color: #ffffff;
  font-size: 34rpx;
  font-weight: 900;
}
</style>

