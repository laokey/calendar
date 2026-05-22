<template>
  <view class="bl-page cats-page">
    <BlHeader title="分类" back />

    <view class="list">
      <view v-for="c in categories" :key="c.id" class="row">
        <view class="left">
          <view class="badge" :style="{ background: c.color }"><text class="glyph">{{ c.glyph }}</text></view>
          <text class="name">{{ c.name }}</text>
        </view>
        <view class="right">
          <switch class="sw" :checked="c.enabled !== false" color="#3d6afb" @change="toggle(c.id, $event.detail.value)" />
          <view class="edit" @click="goEdit(c.id)">
            <image class="edit-icon" src="/static/common/icon_edit_pencil.png" mode="aspectFit" />
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import BlHeader from '../../components/BlHeader.vue'
import { ensureMealState, listCategories, setCategoryEnabled } from '../../utils/mealStore'

const mealState = ref(ensureMealState())

function refresh() {
  mealState.value = ensureMealState()
}

onShow(() => refresh())

const categories = computed(() => listCategories(mealState.value))

function toggle(id, v) {
  setCategoryEnabled(mealState.value, id, !!v)
  refresh()
}

function goEdit(id) {
  uni.navigateTo({ url: `/pages/meals/category-form?id=${id}` })
}
</script>

<style scoped lang="scss">
.cats-page {
  padding-bottom: 80rpx;
  background: #ffffff;
  min-height: 100vh;
  box-sizing: border-box;
}

.list {
  margin-top: 10rpx;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.row {
  height: 104rpx;
  border-radius: 24rpx;
  background: #f5f6f7;
  padding: 0 18rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.left {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.badge {
  width: 54rpx;
  height: 54rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.glyph {
  color: #ffffff;
  font-size: 26rpx;
  font-weight: 900;
}

.name {
  font-size: 32rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.9);
}

.right {
  display: flex;
  align-items: center;
  gap: 18rpx;
}

.sw {
  transform: scale(0.86);
  transform-origin: right center;
}

.edit {
  width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.edit-icon {
  width: 32rpx;
  height: 32rpx;
  display: block;
  opacity: 0.8;
}
</style>
