<template>
  <view class="bl-page card-page">
    <BlHeader title="写消息" back>
      <template #right>
        <view class="top-right">
          <view v-if="hasDraftContent" class="top-btn" @click="openDraftActions">
            <image class="top-icon" src="/static/calendar/icon_trash.png" mode="aspectFit" />
          </view>
        </view>
      </template>
    </BlHeader>

    <view class="stage">
      <view class="card photo" @click="openPhotoActions">
        <view v-if="draft.photoPath" class="photo-wrap">
          <image class="photo-img" :src="draft.photoPath" mode="aspectFill" />
        </view>
        <view v-else class="placeholder">
          <view class="ph-icon">
            <view class="ph-img" />
            <view class="ph-dot" />
          </view>
          <text class="ph-text">添加图片</text>
        </view>
      </view>

      <view class="card content" @click="goDoodle">
        <view v-if="doodlePreviewText" class="content-preview">
          <text class="content-emoji">😀</text>
          <text class="content-text">{{ doodlePreviewText }}</text>
        </view>
        <view v-else class="placeholder">
          <view class="ph-icon is-text">
            <view class="ph-line" />
            <view class="ph-line short" />
          </view>
          <text class="ph-text">添加内容</text>
        </view>
      </view>
    </view>

    <view class="actions">
      <view class="a-btn" @click="openPhotoActions">
        <image class="a-ico" src="/static/calendar/icon_camera.png" mode="aspectFit" />
        <text class="a-text">添加照片</text>
      </view>
      <view class="a-btn" @click="goDoodleText">
        <text class="a-ico-text">A=</text>
        <text class="a-text">添加文本</text>
      </view>
    </view>

    <view class="tpl">
      <view class="tabs">
        <view v-for="t in tabList" :key="t" class="tab" :class="{ active: activeTab === t }" @click="activeTab = t">
          <text class="tab-text">{{ t }}</text>
          <view v-if="activeTab === t" class="tab-dot" />
        </view>
      </view>

      <view class="grid">
        <view
          v-for="c in currentTemplates"
          :key="c.key"
          class="tpl-card"
          :class="{ selected: draft.templateKey === c.key }"
          @click="selectTemplate(c.key)"
        >
          <view class="tpl-thumb" :style="{ background: c.bg }">
            <text class="tpl-thumb-text">{{ c.label }}</text>
          </view>
          <view v-if="draft.templateKey === c.key" class="check">
            <text class="check-text">✓</text>
          </view>
        </view>
      </view>
    </view>

    <view class="next" :class="{ disabled: !canNext }" @click="next">
      <text class="next-text">下一步</text>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import BlHeader from '../../components/BlHeader.vue'
import { clearCardDraft, draftHasContent, ensureCardDraft, saveCardDraft } from '../../utils/cardStore'

const draft = ref(ensureCardDraft())
const activeTab = ref('生日')

const tabList = ['生日', '假日', '纪念日', '宝贝', '婚礼', '爱', '恭喜']

const templates = [
  { key: 'birthday_1', tab: '生日', label: 'HBD', bg: 'linear-gradient(135deg, #ffb020 0%, #ff5a5f 100%)' },
  { key: 'birthday_2', tab: '生日', label: 'Cake', bg: 'linear-gradient(135deg, #3d6afb 0%, #5aa7ff 100%)' },
  { key: 'holiday_1', tab: '假日', label: 'Holiday', bg: 'linear-gradient(135deg, #00b060 0%, #4cc38a 100%)' },
  { key: 'anniversary_1', tab: '纪念日', label: 'Day', bg: 'linear-gradient(135deg, #9b59ff 0%, #6b2cff 100%)' },
  { key: 'kids_1', tab: '宝贝', label: 'Kid', bg: 'linear-gradient(135deg, #ffd24d 0%, #ffb020 100%)' },
  { key: 'wedding_1', tab: '婚礼', label: 'Love', bg: 'linear-gradient(135deg, #ff4bd8 0%, #9b59ff 100%)' },
  { key: 'love_1', tab: '爱', label: '❤', bg: 'linear-gradient(135deg, #ff5a5f 0%, #ff4b3f 100%)' },
  { key: 'congrats_1', tab: '恭喜', label: 'Congrats', bg: 'linear-gradient(135deg, #7cc7ff 0%, #3d6afb 100%)' },
]

onShow(() => {
  draft.value = ensureCardDraft()
})

const currentTemplates = computed(() => templates.filter((x) => x.tab === activeTab.value))

const hasDraftContent = computed(() => draftHasContent(draft.value))

const doodlePreviewText = computed(() => {
  const texts = draft.value?.doodle?.texts || []
  if (!texts.length) return ''
  const t = texts[texts.length - 1]
  const v = t && t.text ? String(t.text) : ''
  return v.length > 14 ? v.slice(0, 14) + '…' : v
})

const canNext = computed(() => {
  return !!(draft.value && draft.value.templateKey && (draftHasContent(draft.value) || String(draft.value.templateKey || '').trim()))
})

function persist(patch) {
  draft.value = saveCardDraft({ ...draft.value, ...(patch || {}) })
}

function selectTemplate(key) {
  persist({ templateKey: key })
}

function openPhotoActions() {
  uni.showActionSheet({
    itemList: ['相机', '从手机相册中选择'],
    success: (res) => {
      const idx = res && typeof res.tapIndex === 'number' ? res.tapIndex : -1
      const sourceType = idx === 0 ? ['camera'] : ['album']
      uni.chooseImage({
        count: 1,
        sourceType,
        success: (r) => {
          const path = r && r.tempFilePaths && r.tempFilePaths[0] ? String(r.tempFilePaths[0]) : ''
          if (path) persist({ photoPath: path })
        },
      })
    },
  })
}

function goDoodle() {
  uni.navigateTo({ url: '/pages/cards/doodle' })
}

function goDoodleText() {
  uni.navigateTo({ url: '/pages/cards/doodle?tool=text' })
}

function openDraftActions() {
  uni.showActionSheet({
    itemList: ['删除草稿'],
    success: (res) => {
      const idx = res && typeof res.tapIndex === 'number' ? res.tapIndex : -1
      if (idx !== 0) return
      uni.showModal({
        title: '',
        content: '确定删除草稿？',
        cancelText: '取消',
        confirmText: '删除',
        success: (r) => {
          if (!r.confirm) return
          draft.value = clearCardDraft()
        },
      })
    },
  })
}

function next() {
  if (!canNext.value) return
  uni.navigateTo({ url: '/pages/cards/preview' })
}
</script>

<style scoped lang="scss">
.card-page {
  padding-bottom: 240rpx;
}

.top-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  height: 72rpx;
}

.top-btn {
  width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.top-icon {
  width: 42rpx;
  height: 42rpx;
  display: block;
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

.placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18rpx;
}

.ph-icon {
  width: 96rpx;
  height: 96rpx;
  border-radius: 20rpx;
  background: rgba(17, 17, 17, 0.08);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ph-icon.is-text {
  background: rgba(17, 17, 17, 0.12);
}

.ph-img {
  width: 54rpx;
  height: 38rpx;
  border-radius: 12rpx;
  background: rgba(255, 255, 255, 0.75);
}

.ph-dot {
  position: absolute;
  top: 18rpx;
  right: 18rpx;
  width: 12rpx;
  height: 12rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.75);
}

.ph-line {
  width: 54rpx;
  height: 6rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.75);
}

.ph-line.short {
  width: 36rpx;
  margin-top: 12rpx;
}

.ph-text {
  font-size: 28rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.55);
}

.content-preview {
  width: 100%;
  height: 100%;
  padding: 20rpx;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 18rpx;
}

.content-emoji {
  font-size: 44rpx;
  font-weight: 900;
}

.content-text {
  font-size: 34rpx;
  font-weight: 900;
  line-height: 46rpx;
  color: rgba(17, 17, 17, 0.9);
}

.actions {
  margin-top: 18rpx;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18rpx;
}

.a-btn {
  height: 92rpx;
  border-radius: 999rpx;
  background: rgba(61, 106, 251, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14rpx;
}

.a-ico {
  width: 40rpx;
  height: 40rpx;
  display: block;
}

.a-ico-text {
  font-size: 34rpx;
  font-weight: 900;
  color: #3d6afb;
}

.a-text {
  font-size: 30rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.9);
}

.tpl {
  margin-top: 18rpx;
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 10rpx 26rpx rgba(17, 17, 17, 0.06);
  padding: 18rpx;
}

.tabs {
  display: flex;
  align-items: center;
  gap: 18rpx;
  overflow-x: auto;
  padding-bottom: 12rpx;
}

.tab {
  padding: 10rpx 6rpx;
  position: relative;
  flex-shrink: 0;
}

.tab-text {
  font-size: 30rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.65);
}

.tab.active .tab-text {
  color: rgba(17, 17, 17, 0.9);
}

.tab-dot {
  position: absolute;
  left: 10rpx;
  right: 10rpx;
  bottom: 0;
  height: 6rpx;
  border-radius: 999rpx;
  background: #3d6afb;
}

.grid {
  margin-top: 12rpx;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14rpx;
}

.tpl-card {
  position: relative;
  border-radius: 18rpx;
  overflow: hidden;
  background: rgba(17, 17, 17, 0.04);
}

.tpl-thumb {
  height: 122rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tpl-thumb-text {
  color: rgba(255, 255, 255, 0.92);
  font-size: 22rpx;
  font-weight: 900;
}

.check {
  position: absolute;
  top: 8rpx;
  left: 8rpx;
  width: 34rpx;
  height: 34rpx;
  border-radius: 999rpx;
  background: #3d6afb;
  display: flex;
  align-items: center;
  justify-content: center;
}

.check-text {
  color: #ffffff;
  font-size: 22rpx;
  font-weight: 900;
}

.next {
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

.next.disabled {
  background: rgba(61, 106, 251, 0.18);
}

.next-text {
  color: #ffffff;
  font-size: 34rpx;
  font-weight: 900;
}
</style>

