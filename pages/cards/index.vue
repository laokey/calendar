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
      <view class="book">
        <view class="book-page left-page">
          <view class="card photo" @click="openPhotoActions">
            <view v-if="draft.photoPath" class="photo-wrap">
              <image class="photo-img" :src="draft.photoPath" mode="aspectFill" />
            </view>
            <view v-else class="placeholder">
              <image class="ph-icon-img" src="/static/card/icon-card-photo-placeholder.png" mode="aspectFit" />
              <text class="ph-text">添加图片</text>
            </view>
          </view>
        </view>
        <view class="book-page right-page">
          <view class="card content" @click="goDoodle">
            <view v-if="hasDoodleContent" class="content-preview">
              <CardDoodlePreview canvas-id="cardIndexPreview" :doodle="draft.doodle" background="transparent" />
            </view>
            <view v-else class="placeholders">
              <image class="ph-icon-img text" src="/static/card/icon-card-text-placeholder.png" mode="aspectFit" />
              <text class="ph-text">添加内容</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <view class="actions">
      <view class="a-btn" @click="openPhotoActions">
        <image class="a-ico" src="/static/card/icon-card-photo-action.png" mode="aspectFit" />
        <text class="a-text">添加照片</text>
      </view>
      <view class="a-btn" @click="goDoodleText">
        <image class="a-ico text" src="/static/card/icon-card-text-action.png" mode="aspectFit" />
        <text class="a-text">添加文本</text>
      </view>
    </view>

    <view class="tpl">
      <view class="tabs">
        <view
          v-for="t in tabList"
          :key="t"
          class="tab"
          :class="{ active: activeTab === t }"
          @click="
            activeTab = t;
            ensureResources();
          "
        >
          <text class="tab-text">{{ t }}</text>
          <view v-if="activeTab === t" class="tab-dot" />
        </view>
      </view>

      <view class="grid">
        <view v-if="currentResourceUrls.length" class="tpl-card"
          v-for="url in currentResourceUrls"
          :key="url"
          :class="{ selected: String(draft.imageUrl || '') === String(url) }"
          @click="selectResource(url)"
        >
          <view class="tpl-thumb">
            <image class="tpl-thumb-img" :src="url" mode="aspectFill" />
          </view>
          <view v-if="String(draft.imageUrl || '') === String(url)" class="check">
            <image class="check-img" src="/static/card/icon-card-template-selected.png" mode="aspectFit" />
          </view>
        </view>

        <view v-else class="tpl-card"
          v-for="c in currentTemplates"
          :key="c.key"
          :class="{ selected: draft.templateKey === c.key }"
          @click="selectTemplate(c.key)"
        >
          <view class="tpl-thumb" :style="{ background: c.bg }">
            <text class="tpl-thumb-text">{{ c.label }}</text>
          </view>
          <view v-if="draft.templateKey === c.key" class="check">
            <image class="check-img" src="/static/card/icon-card-template-selected.png" mode="aspectFit" />
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
import CardDoodlePreview from '../../components/CardDoodlePreview.vue'
import { clearCardDraft, draftHasContent, ensureCardDraft, saveCardDraft } from '../../utils/cardStore'
import { cardsApi } from '../../utils/api'

const draft = ref(ensureCardDraft())
const activeTab = ref('生日')
const loadingRes = ref(false)
const resMap = ref({})

const tabList = ['生日', '假日', '纪念日', '宝贝', '婚礼', '爱', '恭喜']
const TAB_RESOURCE_TYPE = {
  生日: 1,
  假日: 2,
  纪念日: 3,
  宝贝: 4,
  婚礼: 5,
  爱: 6,
  恭喜: 7,
}

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
  ensureResources()
})

const currentTemplates = computed(() => templates.filter((x) => x.tab === activeTab.value))
const currentResourceUrls = computed(() => {
  const type = TAB_RESOURCE_TYPE[activeTab.value] || 1
  const list = resMap.value && resMap.value[type] ? resMap.value[type] : []
  return Array.isArray(list) ? list : []
})

const hasDraftContent = computed(() => draftHasContent(draft.value))
const hasDoodleContent = computed(() => {
  const doodle = draft.value?.doodle || {}
  return !!(
    (Array.isArray(doodle.strokes) && doodle.strokes.length) ||
    (Array.isArray(doodle.stickers) && doodle.stickers.length) ||
    (Array.isArray(doodle.texts) && doodle.texts.length)
  )
})

const canNext = computed(() => {
  const hasImage = !!String(draft.value && draft.value.imageUrl ? draft.value.imageUrl : '').trim()
  return hasImage && !!String(draft.value && draft.value.templateKey ? draft.value.templateKey : '').trim()
})

function persist(patch) {
  draft.value = saveCardDraft({ ...draft.value, ...(patch || {}) })
}

function selectTemplate(key) {
  persist({ templateKey: key })
}

async function ensureResources() {
  const logged = !!uni.getStorageSync('auth_logged_in')
  if (!logged) return false
  const type = TAB_RESOURCE_TYPE[activeTab.value] || 1
  const existed = resMap.value && Array.isArray(resMap.value[type]) && resMap.value[type].length
  if (existed || loadingRes.value) return true
  loadingRes.value = true
  try {
    const urls = await cardsApi.getCardResourceList({ resourceType: type })
    resMap.value = { ...(resMap.value || {}), [type]: urls }
    if (!String(draft.value.imageUrl || '').trim() && urls && urls[0]) {
      persist({ imageUrl: String(urls[0]), resourceType: type })
    }
    return true
  } catch (e) {
    uni.showToast({ title: String((e && e.message) || '加载贺卡资源失败'), icon: 'none' })
    return false
  } finally {
    loadingRes.value = false
  }
}

function selectResource(url) {
  const type = TAB_RESOURCE_TYPE[activeTab.value] || 1
  persist({ imageUrl: String(url || '').trim(), resourceType: type, templateKey: `${activeTab.value}_${type}` })
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
  min-height: 100vh;
  background: #eef4ff;
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
  height: 94%;
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
  width: 96%;
  height: 96%;
  transform: rotate(-6deg);
  transform-origin: center center;
  z-index: 2;
  box-shadow: 0 8rpx 20rpx rgba(17, 17, 17, 0.12);
  background: #ffffff;
  // padding: 8rpx;
  box-sizing: border-box;
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

.placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  width: 100%;
  height: 100%;
}


.ph-icon-img {
  width: 116rpx;
  height: 116rpx;
  display: block;
}

.ph-icon-img.text {
  width: 102rpx;
  height: 102rpx;
}

.ph-text {
  font-size: 28rpx;
  font-weight: 700;
  color: rgba(17, 17, 17, 0.5);
}

.content-preview {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.actions {
  margin-top: 50rpx;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18rpx;
}

.a-btn {
  height: 86rpx;
  border-radius: 999rpx;
  background: rgba(61, 106, 251, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
}

.a-ico {
  width: 48rpx;
  height: 48rpx;
  display: block;
}

.a-ico.text {
  width: 48rpx;
  height: 48rpx;
}

.a-text {
  font-size: 28rpx;
  font-weight: 800;
  color: #4b5d8b;
}

.tpl {
  margin-top: 38rpx;
  border-radius: 26rpx;
  background: #ffffff;
  box-shadow: 0 14rpx 28rpx rgba(90, 112, 154, 0.08);
  padding: 18rpx 18rpx 24rpx;
}

.tabs {
  display: flex;
  align-items: center;
  gap: 32rpx;
  overflow-x: auto;
  padding: 4rpx 4rpx 20rpx;
  white-space: nowrap;
}

.tab {
  padding: 6rpx 0;
  position: relative;
  flex-shrink: 0;
}

.tab-text {
  font-size: 26rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.62);
}

.tab.active .tab-text {
  color: rgba(17, 17, 17, 0.9);
}

.tab-dot {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  bottom: -10rpx;
  width: 24rpx;
  height: 6rpx;
  border-radius: 999rpx;
  background: #3d6afb;
}

.grid {
  margin-top: 4rpx;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16rpx 14rpx;
}

.tpl-card {
  position: relative;
  border-radius: 20rpx;
  overflow: hidden;
  background: rgba(240, 244, 255, 0.95);
  border: 2rpx solid transparent;
}

.tpl-card.selected {
  border-color: rgba(61, 106, 251, 0.28);
}

.tpl-thumb {
  height: 116rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.tpl-thumb-img {
  width: 100%;
  height: 100%;
  display: block;
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
  width: 40rpx;
  height: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.check-img {
  width: 40rpx;
  height: 40rpx;
  display: block;
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
  box-shadow: 0 18rpx 30rpx rgba(61, 106, 251, 0.22);
}

.next.disabled {
  background: rgba(61, 106, 251, 0.12);
  box-shadow: none;
}

.next-text {
  color: #ffffff;
  font-size: 34rpx;
  font-weight: 900;
}

.next.disabled .next-text {
  color: rgba(17, 17, 17, 0.32);
}
</style>
