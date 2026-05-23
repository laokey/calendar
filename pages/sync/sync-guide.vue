<template>
  <view class="bl-page page">
    <BlHeader :title="title" back back-icon-src="/static/sync/icon_nav_back_small.png" />

    <view class="steps">
      <view v-for="(s, idx) in steps" :key="idx" class="step">
        <text class="step-text">{{ idx + 1 }}.{{ s }}</text>
        <view class="shot" />
      </view>
    </view>

    <view class="share-card">
      <text class="share-title">将分享链接发送至:</text>
      <view class="share-row">
        <text class="share-email">{{ myEmail }}</text>
        <view class="copy" @click="copyEmail"><text class="copy-text">复制</text></view>
      </view>
    </view>

    <view class="paste">
      <textarea v-model="pasted" class="paste-area" placeholder="在此处粘贴网址" placeholder-class="ph" />
    </view>

    <view class="bottom-action">
      <view class="bl-btn-primary" @click="done"><text>完成</text></view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import BlHeader from '../../components/BlHeader.vue'

const type = ref('icloud')
const pasted = ref('')
const myEmail = ref('a1234567890@myecalendar.cn')

onLoad((options) => {
  type.value = String(options && options.type ? options.type : 'icloud')
})

const title = computed(() => {
  if (type.value === 'cozi') return '同步Cozi'
  if (type.value === 'teamsnap') return '同步Teamsnap'
  if (type.value === 'subscribed') return '同步已订阅日历'
  return '同步iCloud日历'
})

const steps = computed(() => {
  if (type.value === 'teamsnap') {
    return ['在电脑上登录go.teamsnap.com 网站。', '进入“日程安排”标签页', '在设置中选择“同步日历/导出”', '复制“完整日历”或“仅赛事”链接']
  }
  if (type.value === 'cozi') {
    return ['打开Cozi应用程序', '点击家庭座图标', '选择设置', '点击共享Cozi日历', '复制日历共享链接']
  }
  if (type.value === 'subscribed') {
    return ['打开日历应用', '选择日历/订阅详情', '复制订阅网址', '将链接粘贴到邮件或输入框中']
  }
  return ['打开日历应用', '选择日历/订阅详情', '复制订阅网址', '将链接粘贴到邮件或输入框中']
})

function copyEmail() {
  uni.setClipboardData({
    data: myEmail.value,
    success() {
      uni.showToast({ title: '已复制', icon: 'none' })
    },
  })
}

function done() {
  uni.navigateBack()
}
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: #ffffff;
  padding-bottom: 220rpx;
}

.steps {
  margin-top: 10rpx;
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.step {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.step-text {
  font-size: 26rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.85);
}

.shot {
  height: 260rpx;
  border-radius: 22rpx;
  background: rgba(17, 17, 17, 0.04);
}

.share-card {
  margin-top: 20rpx;
  background: rgba(17, 17, 17, 0.04);
  border-radius: 22rpx;
  padding: 22rpx;
}

.share-title {
  display: block;
  font-size: 26rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.7);
  margin-bottom: 14rpx;
}

.share-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
}

.share-email {
  font-size: 28rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.92);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.copy {
  flex-shrink: 0;
  padding: 0 22rpx;
  height: 62rpx;
  border-radius: 9999rpx;
  background: rgba(61, 106, 251, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
}

.copy-text {
  font-size: 26rpx;
  font-weight: 900;
  color: #3d6afb;
}

.paste {
  margin-top: 18rpx;
  background: rgba(17, 17, 17, 0.04);
  border-radius: 22rpx;
  padding: 18rpx 22rpx;
}

.paste-area {
  width: 100%;
  height: 180rpx;
  font-size: 28rpx;
  font-weight: 700;
  color: rgba(17, 17, 17, 0.9);
}

.ph {
  color: rgba(17, 17, 17, 0.35);
  font-weight: 700;
}

.bottom-action {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 20rpx 28rpx calc(20rpx + env(safe-area-inset-bottom));
  background: #ffffff;
}
</style>

