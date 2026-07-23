<template>
  <view class="bl-page share-page">
    <BlHeader back title="">
      <template #center>
        <text class="head-title"> </text>
      </template>
    </BlHeader>

    <view class="hero">
      <view class="hero-icon">
        <image class="hero-img" src="/static/card/icon-card-share-hero.png" mode="aspectFit" />
      </view>
      <text class="hero-title">{{ $t('分享给您的家人或朋友') }}</text>
      <text class="hero-sub bl-muted">{{ $t('您想共享哪个设备') }}</text>
    </view>

    <view class="list">
      <view v-for="d in devices" :key="d.id" class="row" @click="selectedId = d.id">
        <text class="row-text">{{ d.name }}</text>
        <image
          class="row-sel"
          :src="selectedId === d.id ? '/static/common/icon_checkbox_checked.png' : '/static/common/icon_radio_off.png'"
          mode="aspectFit"
        />
      </view>
    </view>

    <view class="send" @click="confirmSend">
      <text class="send-text">{{ $t('发送卡片') }}</text>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import BlHeader from '../../components/BlHeader.vue'
import { clearCardDraft, ensureCardDraft } from '../../utils/cardStore'
import { addCardRecord, ensureMeState } from '../../utils/meStore'
import { cardsApi, deviceApi } from '../../utils/api'

const draft = ref(ensureCardDraft())
const selectedId = ref('')
const submitting = ref(false)
const deviceList = ref([])

const devices = computed(() => {
  return deviceList.value
})

onShow(() => {
  ;(async () => {
    draft.value = ensureCardDraft()
    try {
      const logged = !!uni.getStorageSync('auth_logged_in')
      if (!logged) {
        deviceList.value = []
        return
      }
      const list = await deviceApi.getCalendarDeviceList()
      deviceList.value = (list || []).map((d) => ({
        id: String(d && d.deviceEmail ? d.deviceEmail : ''),
        name: d && d.deviceName ? String(d.deviceName) : String(d && d.deviceEmail ? d.deviceEmail : ''),
        email: String(d && d.deviceEmail ? d.deviceEmail : ''),
      })).filter((x) => !!x.id)
      if (!selectedId.value && deviceList.value.length) selectedId.value = String(deviceList.value[0].id)
    } catch (e) {
      deviceList.value = []
      uni.showToast({ title: String((e && e.message) || uni.$t('加载设备失败')), icon: 'none' })
    }
  })()
})

async function confirmSend() {
  const dev = devices.value.find((x) => x.id === selectedId.value)
  if (!dev) {
    uni.showToast({ title: uni.$t('请选择设备'), icon: 'none' })
    return
  }
  if (submitting.value) return
  submitting.value = true
  try {
    const localPhoto = String(draft.value.photoPath || '').trim()
    const remotePhoto = /^https?:\/\//i.test(localPhoto) ? localPhoto : ''
    const imageUrl = remotePhoto || String(draft.value.imageUrl || '').trim()
    if (!imageUrl) {
      uni.showToast({ title: uni.$t('请选择贺卡图片'), icon: 'none' })
      return
    }
    const greetings = String(draft.value.message || '').trim()
    if (!greetings) {
      uni.showToast({ title: uni.$t('请输入祝福内容'), icon: 'none' })
      return
    }
    const scheduleEnabled = !!draft.value.scheduleEnabled
    await cardsApi.sendGreetingCard({
      deviceEmail: dev.email || dev.id,
      imageUrl,
      greetings,
      playMode: cardsApi.playModeFromDraft(draft.value.playMode),
      isTimer: scheduleEnabled ? 1 : 0,
      timedDate: scheduleEnabled ? String(draft.value.scheduleDate || '').trim() : '',
      timedTime: scheduleEnabled ? String(draft.value.scheduleTime || '').trim() : '',
    })
    uni.showToast({ title: uni.$t('已发送'), icon: 'none' })
  } catch (e) {
    uni.showToast({ title: String((e && e.message) || uni.$t('发送失败')), icon: 'none' })
    return
  } finally {
    submitting.value = false
  }
  const me = ensureMeState()
  addCardRecord(me, {
    title: uni.$t('贺卡'),
    device: dev.name,
    message: draft.value.message || '',
    mode: draft.value.playMode || 'auto',
    imageUrl: imageUrl || '',
    contentText: '',
    doodle: draft.value && draft.value.doodle ? draft.value.doodle : null,
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

.hero-img {
  width: 140rpx;
  height: 140rpx;
  display: block;
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
