<template>
  <view class="bl-page form-page">
    <BlHeader title="添加清单" back />

    <view class="bl-card title-card">
      <view class="bl-input">
        <input v-model="title" class="bl-input-field" placeholder="清单名称" placeholder-class="ph" />
        <view v-if="title" class="clear" @click="title = ''"><text class="clear-text">×</text></view>
      </view>
    </view>

    <view class="bl-card colors-card">
      <text class="sec-title">选择颜色</text>
      <view class="colors">
        <view v-for="c in colors" :key="c" class="dot" :style="{ background: c }" @click="color = c">
          <view v-if="color === c" class="dot-check"><text class="dot-check-text">✓</text></view>
        </view>
      </view>
    </view>

    <view class="bottom-save" @click="save">
      <text class="bottom-save-text">保存</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import BlHeader from '../../components/BlHeader.vue'
import { addList, ensureListState, findList, updateList } from '../../utils/listStore'

const listState = ref(ensureListState())

const listId = ref('')
const title = ref('')
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
  listState.value = ensureListState()
}

onLoad((options) => {
  refresh()
  const id = options && options.id ? String(options.id) : ''
  if (!id) return
  listId.value = id
  const l = findList(listState.value, id)
  if (!l) return
  title.value = l.title || ''
  color.value = l.color || color.value
})

function validate() {
  if (!String(title.value || '').trim()) {
    uni.showToast({ title: '请输入清单名称', icon: 'none' })
    return false
  }
  return true
}

function save() {
  if (!validate()) return
  if (listId.value) {
    updateList(listState.value, listId.value, { title: title.value, color: color.value })
  } else {
    addList(listState.value, { title: title.value, color: color.value })
  }
  uni.navigateBack()
}
</script>

<style scoped lang="scss">
.form-page {
  padding-bottom: 240rpx;
  background: #ffffff;
  min-height: 100vh;
  box-sizing: border-box;
}

.title-card {
  padding: 28rpx;
  background: #fafafa;
  box-shadow: none;
}

.bl-input-field {
  min-width: 0;
}

.ph {
  color: rgba(17, 17, 17, 0.35);
}

.clear {
  width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.clear-text {
  font-size: 44rpx;
  font-weight: 700;
  color: rgba(17, 17, 17, 0.45);
}

.colors-card {
  margin-top: 18rpx;
  background: #fafafa;
  box-shadow: none;
}

.sec-title {
  display: block;
  font-size: 30rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.9);
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
