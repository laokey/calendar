<template>
  <view class="bl-page recipe-form-page">
    <BlHeader :title="pageTitle" back />

    <view class="photo" @click="pickPhoto">
      <image v-if="photoPath" class="photo-img" :src="photoPath" mode="aspectFill" />
      <view v-else class="photo-ph">
        <image class="ph-icon" src="/static/calendar/icon_plus.png" mode="aspectFit" />
        <text class="ph-text">添加照片</text>
      </view>
      <view v-if="photoPath" class="photo-x" @click.stop="photoPath = ''"><text class="photo-x-text">×</text></view>
    </view>

    <view class="block">
      <view class="row col">
        <view class="row-title">
          <image class="row-icon" src="/static/meals/icon_fork.png" mode="aspectFit" />
          <text class="row-title-text">我们吃什么</text>
        </view>
        <view class="input-wrap">
          <input v-model="title" class="input" placeholder="请输入" placeholder-class="ph" />
        </view>
      </view>
    </view>

    <view class="block" @click="catOpen = true">
      <view class="row">
        <view class="row-title">
          <image class="row-icon" src="/static/meals/icon_grid.png" mode="aspectFit" />
          <text class="row-title-text">分类</text>
        </view>
        <image class="chev-icon" src="/static/common/icon_down.png" mode="aspectFit" />
      </view>
      <text class="sub">{{ categoryName }}</text>
    </view>

    <view class="block">
      <view class="row col">
        <view class="row-title">
          <image class="row-icon" src="/static/meals/icon_note.png" mode="aspectFit" />
          <text class="row-title-text">说明或配料</text>
        </view>
        <view class="input-wrap is-textarea">
          <textarea v-model="note" class="textarea" placeholder="请输入" placeholder-class="ph" />
        </view>
      </view>
    </view>

    <view class="bottom" :class="{ disabled: !canSave }" @click="save">
      <text class="bottom-text">保存</text>
    </view>

    <BlSheet v-model="catOpen" title="分类" :confirm-text="''">
      <view class="cat-list">
        <view v-for="c in categories" :key="c.id" class="cat-item" @click="selectCat(c.id)">
          <view class="cat-left">
            <view class="cat-badge" :style="{ background: c.color }"><text class="cat-glyph">{{ c.glyph }}</text></view>
            <text class="cat-name">{{ c.name }}</text>
          </view>
          <view class="cat-right">
            <view v-if="categoryId === c.id" class="cat-check"><text class="cat-check-text">✓</text></view>
            <view v-else class="cat-dot" />
          </view>
        </view>
      </view>
    </BlSheet>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import BlHeader from '../../components/BlHeader.vue'
import BlSheet from '../../components/BlSheet.vue'
import { addRecipe, ensureMealState, findRecipe, listCategories, updateRecipe } from '../../utils/mealStore'

const mealState = ref(ensureMealState())

const recipeId = ref('')
const photoPath = ref('')
const title = ref('')
const note = ref('')
const categoryId = ref('')

const catOpen = ref(false)

function refresh() {
  mealState.value = ensureMealState()
  if (!categoryId.value) {
    const list = listCategories(mealState.value, { enabledOnly: true })
    categoryId.value = list[0] ? list[0].id : ''
  }
}

onLoad((options) => {
  refresh()
  const id = options && options.id ? String(options.id) : ''
  if (!id) return
  recipeId.value = id
  const r = findRecipe(mealState.value, id)
  if (!r) return
  photoPath.value = r.photoPath || ''
  title.value = r.title || ''
  note.value = r.note || ''
  categoryId.value = r.categoryId || categoryId.value
})

const categories = computed(() => listCategories(mealState.value, { enabledOnly: true }))
const categoryName = computed(() => {
  const c = categories.value.find((x) => x.id === categoryId.value)
  return c ? c.name : ''
})

const pageTitle = computed(() => (recipeId.value ? '编辑食谱' : '添加食谱'))
const canSave = computed(() => !!String(title.value || '').trim())

function selectCat(id) {
  categoryId.value = id
  catOpen.value = false
}

function pickPhoto() {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success(res) {
      const p = res && res.tempFilePaths && res.tempFilePaths[0] ? String(res.tempFilePaths[0]) : ''
      if (!p) return
      photoPath.value = p
    },
  })
}

function save() {
  if (!canSave.value) return
  const payload = { title: title.value, categoryId: categoryId.value, photoPath: photoPath.value, note: note.value }
  if (recipeId.value) updateRecipe(mealState.value, recipeId.value, payload)
  else addRecipe(mealState.value, payload)
  uni.navigateBack()
}
</script>

<style scoped lang="scss">
.recipe-form-page {
  padding-bottom: 220rpx;
  background: #ffffff;
  min-height: 100vh;
  box-sizing: border-box;
}

.photo {
  margin: 24rpx auto 18rpx;
  width: 260rpx;
  height: 260rpx;
  border-radius: 28rpx;
  overflow: hidden;
  background: #fafafa;
  position: relative;
}

.photo-img {
  width: 260rpx;
  height: 260rpx;
}

.photo-ph {
  width: 260rpx;
  height: 260rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
}

.ph-icon {
  width: 54rpx;
  height: 54rpx;
  display: block;
  opacity: 0.6;
}

.ph-text {
  font-size: 26rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.55);
}

.photo-x {
  position: absolute;
  right: 10rpx;
  top: 10rpx;
  width: 52rpx;
  height: 52rpx;
  border-radius: 999rpx;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
}

.photo-x-text {
  font-size: 34rpx;
  font-weight: 900;
  color: #ffffff;
}

.block {
  margin-top: 16rpx;
  background: #fafafa;
  border-radius: 24rpx;
  padding: 18rpx 22rpx 20rpx;
  box-shadow: none;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.row.col {
  flex-direction: column;
  align-items: flex-start;
  gap: 10rpx;
}

.row-title {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.row-icon {
  width: 28rpx;
  height: 28rpx;
  display: block;
  opacity: 0.8;
}

.row-title-text {
  font-size: 28rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.9);
}

.input-wrap {
  width: 100%;
  margin-top: 6rpx;
  background: transparent;
  padding: 0;
  display: flex;
  align-items: center;
}

.input-wrap.is-textarea {
  height: auto;
  padding-top: 0;
  align-items: flex-start;
}

.input {
  width: 100%;
  font-size: 28rpx;
  font-weight: 800;
  color: #111111;
}

.textarea {
  width: 100%;
  height: 110rpx;
  font-size: 28rpx;
  font-weight: 800;
  color: #111111;
}

.ph {
  color: rgba(17, 17, 17, 0.35);
}

.chev-icon {
  width: 28rpx;
  height: 28rpx;
  display: block;
  opacity: 0.65;
}

.sub {
  display: block;
  margin-top: 8rpx;
  font-size: 28rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.9);
}

.bottom {
  position: fixed;
  left: 28rpx;
  right: 28rpx;
  bottom: 34rpx;
  height: 104rpx;
  background: #3d6afb;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bottom.disabled {
  background: #d7d7d7;
}

.bottom-text {
  color: #ffffff;
  font-size: 34rpx;
  font-weight: 900;
}

.bottom.disabled .bottom-text {
  color: rgba(17, 17, 17, 0.45);
}

.cat-list {
  padding: 6rpx 0 10rpx;
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.cat-item {
  height: 92rpx;
  border-radius: 20rpx;
  background: #fafafa;
  padding: 0 18rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.cat-left {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.cat-badge {
  width: 46rpx;
  height: 46rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cat-glyph {
  color: #ffffff;
  font-size: 24rpx;
  font-weight: 900;
}

.cat-name {
  font-size: 30rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.88);
}

.cat-right {
  width: 54rpx;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.cat-check {
  width: 38rpx;
  height: 38rpx;
  border-radius: 999rpx;
  background: #3d6afb;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cat-check-text {
  font-size: 22rpx;
  font-weight: 900;
  color: #ffffff;
}

.cat-dot {
  width: 28rpx;
  height: 28rpx;
  border-radius: 999rpx;
  background: rgba(17, 17, 17, 0.18);
}
</style>
