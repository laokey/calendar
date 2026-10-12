<template>
  <view class="bl-page page">
    <BlHeader :title="title" back back-icon-src="/static/sync/icon_nav_back_small.png" />

    <view class="steps">
      <view v-for="(s, idx) in steps" :key="idx" class="step">
        <text class="step-text">{{ idx + 1 }}.{{ s.text }}</text>
        <template v-if="s.blocks && s.blocks.length">
          <template v-for="(block, blockIdx) in s.blocks" :key="`${idx}-${blockIdx}`">
            <view v-if="block.type === 'note'" class="note-card">
              <text class="note-text">{{ block.text }}</text>
            </view>
            <image v-else-if="block.type === 'image'" class="shot-img" :src="block.image" mode="widthFix" />
            <view v-else-if="block.type === 'share'" class="share-card step-share-card">
              <text class="share-title">{{ $t('将分享链接发送至:') }}</text>
              <view class="share-row">
                <text class="share-email">{{ myEmail }}</text>
                <view class="copy" @click="copyEmail"><text class="copy-text">{{ $t('复制') }}</text></view>
              </view>
            </view>
            <view v-else-if="block.type === 'paste'" class="paste step-paste">
              <textarea
                v-model="pasted"
                class="paste-area"
                :placeholder="$t('在此处粘贴网址')"
                placeholder-class="ph"
              />
            </view>
          </template>
        </template>
        <template v-else>
          <image v-if="s.image" class="shot-img" :src="s.image" mode="widthFix" />
          <view v-else class="shot" />
        </template>
      </view>
    </view>

    <view v-if="!inlineGuideActions" class="share-card">
      <text class="share-title">{{ $t('将分享链接发送至:') }}</text>
      <view class="share-row">
        <text class="share-email">{{ myEmail }}</text>
        <view class="copy" @click="copyEmail"><text class="copy-text">{{ $t('复制') }}</text></view>
      </view>
    </view>

    <view v-if="!inlineGuideActions" class="paste">
      <textarea v-model="pasted" class="paste-area" :placeholder="$t('在此处粘贴网址')" placeholder-class="ph" />
    </view>

    <view class="bottom-action">
      <view class="bl-btn-primary" :class="{ 'is-disabled': submitting || !canSubmit }" @click="done">
        <text>{{ $t('完成') }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import BlHeader from '../../components/BlHeader.vue'
import { bindICloudCalendarUrl } from '../../utils/api/sync'

const type = ref('icloud')
const pasted = ref('')
const myEmail = ref('wsliweihua@myecalerder.cn')
const submitting = ref(false)

function asset(path) {
  return encodeURI(path)
}

onLoad((options) => {
  type.value = String(options && options.type ? options.type : 'icloud')
})

const title = computed(() => {
  if (type.value === 'cozi') return uni.$t('同步Cozi')
  if (type.value === 'teamsnap') return uni.$t('同步Teamsnap')
  if (type.value === 'subscribed') return uni.$t('同步已订阅日历')
  return uni.$t('同步iCloud日历')
})

const inlineGuideActions = computed(() => type.value === 'icloud')
const canSubmit = computed(() => type.value !== 'icloud' || pasted.value.trim().length > 0)

const steps = computed(() => {
  if (type.value === 'icloud') {
    return [
      {
        text: uni.$t('打开日历应用'),
        blocks: [{ type: 'image', image: asset('/static/sync/icloud/Slice 77.png') }],
      },
      {
        text: uni.$t('选择日历或图标 📅 图标'),
        blocks: [
          { type: 'note', text: uni.$t('旧版本:对于 iOS 26 以下版本，您需要选择日历') },
          { type: 'image', image: asset('/static/sync/icloud/Slice 77(1).png') },
          { type: 'note', text: uni.$t('新版本:对于 iOS 26 及后续版本，您需要点击图标 📅 图标。') },
          { type: 'image', image: asset('/static/sync/icloud/Slice 77(2).png') },
        ],
      },
      {
        text: uni.$t('选择 ⓘ 日历图标'),
        blocks: [{ type: 'image', image: asset('/static/sync/icloud/Slice 77(3).png') }],
      },
      {
        text: uni.$t('启用“公共日历”并选择“共享链接”'),
        blocks: [
          { type: 'image', image: asset('/static/sync/icloud/Slice 77(4).png') },
          {
            type: 'note',
            text: uni.$t(
              '没有公开日历切换选项？按照以下 6 个步骤操作: 选择“设置”、“你的名字”、“iCloud”、“显示全部”、“iCloud日历”，然后打开“在此 iPhone上使用”。',
            ),
          },
        ],
      },
      {
        text: uni.$t('选择发送邮件'),
        blocks: [{ type: 'image', image: asset('/static/sync/icloud/Slice 77(5).png') }],
      },
      {
        text: uni.$t('将分享链接发送至:'),
        blocks: [
          { type: 'share' },
          { type: 'image', image: asset('/static/sync/icloud/Slice 77(6).png') },
          { type: 'paste' },
        ],
      },
    ]
  }
  if (type.value === 'teamsnap') {
    return [
      { text: uni.$t('在电脑上登录 TeamSnap 网站'), image: asset('/static/sync/teamsnap/Slice 77.png') },
      { text: uni.$t('进入团队页面'), image: asset('/static/sync/teamsnap/Slice 77(1).png') },
      { text: uni.$t('打开赛程或设置入口'), image: asset('/static/sync/teamsnap/Slice 77(2).png') },
      { text: uni.$t('选择同步日历或导出'), image: asset('/static/sync/teamsnap/Slice 77(3).png') },
      { text: uni.$t('复制完整日历或仅赛事链接'), image: asset('/static/sync/teamsnap/Slice 77(4).png') },
    ]
  }
  if (type.value === 'cozi') {
    return [
      { text: uni.$t('打开 Cozi 应用程序'), image: asset('/static/sync/cozi/Slice 77.png') },
      { text: uni.$t('点击家庭图标'), image: asset('/static/sync/cozi/Slice 77(1).png') },
      { text: uni.$t('选择设置'), image: asset('/static/sync/cozi/Slice 77(2).png') },
      { text: uni.$t('点击共享 Cozi 日历'), image: asset('/static/sync/cozi/Slice 77(3).png') },
      { text: uni.$t('共享所有事件或特定日历并点击按钮'), image: asset('/static/sync/cozi/Slice 77(4).png') },
      { text: uni.$t('点击 Cozi 网址'), image: asset('/static/sync/cozi/Slice 77(5).png') },
      { text: uni.$t('将 URL 粘贴到应用程序或邮件中'), image: asset('/static/sync/cozi/Slice 77(6).png') },
    ]
  }
  if (type.value === 'subscribed') {
    return [
      { text: uni.$t('打开订阅日历来源页面'), image: asset('/static/sync/subscribed/Slice 77.png') },
      { text: uni.$t('找到对应订阅日历'), image: asset('/static/sync/subscribed/Slice 77(1).png') },
      { text: uni.$t('打开订阅详情'), image: asset('/static/sync/subscribed/Slice 77(2).png') },
      { text: uni.$t('复制订阅网址'), image: asset('/static/sync/subscribed/Slice 77(3).png') },
      { text: uni.$t('发送或保存订阅链接'), image: asset('/static/sync/subscribed/Slice 77(4).png') },
      { text: uni.$t('将链接粘贴到下方输入框'), image: asset('/static/sync/subscribed/Slice 77(5).png') },
    ]
  }
  return [
    { text: uni.$t('打开日历应用'), image: asset('/static/sync/icloud/Slice 77.png') },
    { text: uni.$t('选择日历/订阅详情'), image: asset('/static/sync/icloud/Slice 77(1).png') },
    { text: uni.$t('复制订阅网址'), image: asset('/static/sync/icloud/Slice 77(2).png') },
    { text: uni.$t('将链接粘贴到邮件或输入框中'), image: asset('/static/sync/icloud/Slice 77(3).png') },
  ]
})

function copyEmail() {
  uni.setClipboardData({
    data: myEmail.value,
    success() {
      uni.showToast({ title: uni.$t('已复制'), icon: 'none' })
    },
  })
}

function normalizeIcsUrl(raw) {
  const value = String(raw || '').trim()
  if (!value) return ''
  if (/^webcals?:\/\//i.test(value)) return value
  if (/^https?:\/\//i.test(value)) return value
  return ''
}

function backToSyncHome() {
  try {
    const pages = typeof getCurrentPages === 'function' ? getCurrentPages() : []
    if ((pages || []).length >= 3) {
      uni.navigateBack({ delta: 2 })
      return
    }
  } catch (e) {}
  uni.redirectTo({ url: '/pages/sync/sync-home' })
}

async function done() {
  if (submitting.value) return
  if (type.value !== 'icloud') {
    uni.navigateBack()
    return
  }
  if (!canSubmit.value) {
    uni.showToast({ title: uni.$t('请先粘贴日历链接'), icon: 'none' })
    return
  }

  const icsUrl = normalizeIcsUrl(pasted.value)
  if (!icsUrl) {
    uni.showToast({ title: uni.$t('请输入正确的日历链接'), icon: 'none' })
    return
  }

  submitting.value = true
  uni.showLoading({ title: uni.$t('同步日历') })
  try {
    await bindICloudCalendarUrl({ icsUrl })
    uni.showToast({ title: uni.$t('绑定成功'), icon: 'success' })
    setTimeout(() => backToSyncHome(), 350)
  } catch (e) {
    uni.showToast({ title: (e && e.message) || uni.$t('绑定失败，请重试'), icon: 'none' })
  } finally {
    submitting.value = false
    uni.hideLoading()
  }
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

.note-card {
  border-radius: 22rpx;
  background: rgba(17, 17, 17, 0.04);
  padding: 20rpx 24rpx;
}

.note-text {
  display: block;
  font-size: 24rpx;
  line-height: 1.6;
  font-weight: 700;
  color: rgba(17, 17, 17, 0.72);
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

.step-share-card,
.step-paste {
  margin-top: 0;
}

.bottom-action {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 20rpx 28rpx calc(20rpx + env(safe-area-inset-bottom));
  background: #ffffff;
}

.bl-btn-primary.is-disabled {
  opacity: 0.45;
}
</style>
