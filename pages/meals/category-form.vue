<template>
  <view class="bl-page cat-form-page">
    <BlHeader :title="$t('编辑类别')" back>
      <template #right>
        <view class="top-save" @click="save">
          <text class="top-save-text">{{ $t('保存') }}</text>
        </view>
      </template>
    </BlHeader>

    <view class="bl-card">
      <view class="row-title">
        <image class="row-icon" src="/static/meals/icon_tag.png" mode="aspectFit" />
        <text class="row-title-text">{{ $t('名称') }}</text>
      </view>
      <view class="input-wrap">
        <input v-model="name" class="input" :placeholder="$t('请输入')" placeholder-class="ph" />
      </view>
    </view>

    <view class="bl-card colors-card">
      <view class="row-title">
        <image class="row-icon" src="/static/meals/icon_palette.png" mode="aspectFit" />
        <text class="row-title-text">{{ $t('选择颜色') }}</text>
      </view>
      <view class="colors">
        <view v-for="c in colors" :key="c" class="dot" :style="{ background: c }" @click="color = c">
          <view v-if="color === c" class="dot-check"><text class="dot-check-text">✓</text></view>
        </view>
      </view>
    </view>

    <view class="bottom-save" @click="save">
      <text class="bottom-save-text">{{ $t('保存') }}</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import BlHeader from '../../components/BlHeader.vue'
import { ensureMealState, findCategory, updateCategory } from '../../utils/mealStore'
import { mealsApi } from '../../utils/api'

const mealState = ref(ensureMealState())
const catId = ref('')
const typeIndex = ref(0)

const name = ref('')
const color = ref('#f0ad4e')

const colors = [
  '#f7c84f',
  '#f0ad4e',
  '#ff7a7f',
  '#ff4b3f',
  '#8ae36b',
  '#4cc38a',
  '#0ebf5c',
  '#25c6da',
  '#7cc7ff',
  '#4c8dff',
  '#b08cff',
  '#9b59ff',
  '#ff76e8',
  '#c218d4',
]

function refresh() {
  mealState.value = ensureMealState()
}

onLoad((options) => {
  refresh()
  catId.value = options && options.id ? String(options.id) : ''
  typeIndex.value = options && options.typeIndex !== undefined ? Number(options.typeIndex) : 0
  if (!catId.value) {
    uni.navigateBack()
    return
  }
  const c = findCategory(mealState.value, catId.value)
  if (!c) {
    uni.navigateBack()
    return
  }
  name.value = c.name || ''
  color.value = c.color || color.value
})

function colorIndexOf(hex) {
  const idx = colors.findIndex((x) => String(x).toLowerCase() === String(hex || '').toLowerCase())
  return idx >= 0 ? idx : 0
}

async function save() {
  if (!String(name.value || '').trim()) {
    uni.showToast({ title: uni.$t('请输入名称'), icon: 'none' })
    return
  }
  const typeColor = colorIndexOf(color.value)
  uni.showLoading({ title: uni.$t('保存中') })
  try {
    const res = await mealsApi.updateRecipeTypeInfo({ typeIndex: typeIndex.value, typeName: name.value, typeColor })
    if (res && typeof res === 'object' && res.code !== undefined && res.code !== 200 && res.code !== '200') {
      uni.showToast({ title: uni.$t('保存失败'), icon: 'none' })
      return
    }
    updateCategory(mealState.value, catId.value, { name: name.value, color: color.value })
    uni.navigateBack()
  } catch (e) {
    uni.showToast({ title: String((e && e.message) || uni.$t('保存失败')), icon: 'none' })
  } finally {
    try {
      uni.hideLoading()
    } catch (e) {}
  }
}
</script>

<style scoped lang="scss">
.cat-form-page {
  padding-bottom: 240rpx;
  background: #ffffff;
  min-height: 100vh;
  box-sizing: border-box;
}

.bl-card {
  background: #fafafa;
  box-shadow: none;
}

.top-save {
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 12rpx;
}

.top-save-text {
  color: #3d6afb;
  font-size: 30rpx;
  font-weight: 900;
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
  font-size: 30rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.9);
}

.input-wrap {
  margin-top: 14rpx;
  height: 96rpx;
  border-radius: 24rpx;
  background: #fafafa;
  padding: 0 18rpx;
  display: flex;
  align-items: center;
}

.input {
  width: 100%;
  font-size: 34rpx;
  font-weight: 900;
  color: #111111;
}

.ph {
  color: rgba(17, 17, 17, 0.35);
}

.colors-card {
  margin-top: 18rpx;
}

.colors {
  margin-top: 18rpx;
  display: flex;
  flex-wrap: wrap;
  gap: 18rpx;
}

.dot {
  width: 76rpx;
  height: 76rpx;
  border-radius: 999rpx;
  box-shadow: 0 10rpx 26rpx rgba(17, 17, 17, 0.12);
  position: relative;
}

.dot-check {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dot-check-text {
  font-size: 32rpx;
  font-weight: 900;
  color: #ffffff;
}

.bottom-save {
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

.bottom-save-text {
  color: #ffffff;
  font-size: 34rpx;
  font-weight: 900;
}
</style>
