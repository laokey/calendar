<template>
  <view class="bl-page page">
    <BlHeader :title="title" back back-icon-src="/static/sync/icon_nav_back_small.png" />

    <view class="steps">
      <view v-for="(s, idx) in steps" :key="idx" class="step">
        <text class="step-text">{{ idx + 1 }}.{{ s.text }}</text>
        <image v-if="s.image" class="shot-img" :src="s.image" mode="widthFix" />
        <view v-else class="shot" />
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

function asset(path) {
  return encodeURI(path)
}

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
  if (type.value === 'icloud') {
    return [
      { text: '打开日历应用程序', image: asset('/static/sync/icloud/Slice 77.png') },
      { text: '点击底部日历', image: asset('/static/sync/icloud/Slice 77(1).png') },
      { text: '点击已同步的 iCloud 日历右侧信息按钮', image: asset('/static/sync/icloud/Slice 77(2).png') },
      { text: '选择公开日历', image: asset('/static/sync/icloud/Slice 77(3).png') },
      { text: '点击共享链接', image: asset('/static/sync/icloud/Slice 77(4).png') },
      { text: '复制或发送日历 URL', image: asset('/static/sync/icloud/Slice 77(5).png') },
      { text: '将 URL 粘贴到下方输入框', image: asset('/static/sync/icloud/Slice 77(6).png') },
      { text: '确认同步完成', image: asset('/static/sync/icloud/Slice 78.png') },
    ]
  }
  if (type.value === 'teamsnap') {
    return [
      { text: '在电脑上登录 TeamSnap 网站', image: asset('/static/sync/teamsnap/Slice 77.png') },
      { text: '进入团队页面', image: asset('/static/sync/teamsnap/Slice 77(1).png') },
      { text: '打开赛程或设置入口', image: asset('/static/sync/teamsnap/Slice 77(2).png') },
      { text: '选择同步日历或导出', image: asset('/static/sync/teamsnap/Slice 77(3).png') },
      { text: '复制完整日历或仅赛事链接', image: asset('/static/sync/teamsnap/Slice 77(4).png') },
    ]
  }
  if (type.value === 'cozi') {
    return [
      { text: '打开 Cozi 应用程序', image: asset('/static/sync/cozi/Slice 77.png') },
      { text: '点击家庭图标', image: asset('/static/sync/cozi/Slice 77(1).png') },
      { text: '选择设置', image: asset('/static/sync/cozi/Slice 77(2).png') },
      { text: '点击共享 Cozi 日历', image: asset('/static/sync/cozi/Slice 77(3).png') },
      { text: '共享所有事件或特定日历并点击按钮', image: asset('/static/sync/cozi/Slice 77(4).png') },
      { text: '点击 Cozi 网址', image: asset('/static/sync/cozi/Slice 77(5).png') },
      { text: '将 URL 粘贴到应用程序或邮件中', image: asset('/static/sync/cozi/Slice 77(6).png') },
    ]
  }
  if (type.value === 'subscribed') {
    return [
      { text: '打开订阅日历来源页面', image: asset('/static/sync/subscribed/Slice 77.png') },
      { text: '找到对应订阅日历', image: asset('/static/sync/subscribed/Slice 77(1).png') },
      { text: '打开订阅详情', image: asset('/static/sync/subscribed/Slice 77(2).png') },
      { text: '复制订阅网址', image: asset('/static/sync/subscribed/Slice 77(3).png') },
      { text: '发送或保存订阅链接', image: asset('/static/sync/subscribed/Slice 77(4).png') },
      { text: '将链接粘贴到下方输入框', image: asset('/static/sync/subscribed/Slice 77(5).png') },
    ]
  }
  return [
    { text: '打开日历应用', image: asset('/static/sync/icloud/Slice 77.png') },
    { text: '选择日历/订阅详情', image: asset('/static/sync/icloud/Slice 77(1).png') },
    { text: '复制订阅网址', image: asset('/static/sync/icloud/Slice 77(2).png') },
    { text: '将链接粘贴到邮件或输入框中', image: asset('/static/sync/icloud/Slice 77(3).png') },
  ]
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

.shot-img {
  width: 100%;
  display: block;
  border-radius: 22rpx;
  overflow: hidden;
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
