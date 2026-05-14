<template>
  <view class="bl-page lists-page">
    <BlHeader title="清单" back>
      <template #right>
        <view class="add-btn" @click="goAdd">
          <text class="add-plus">+</text>
          <text class="add-text">添加清单</text>
        </view>
      </template>
    </BlHeader>

    <view class="grid">
      <view v-for="l in lists" :key="l.id" class="tile" :style="{ background: tileBg(l.color) }" @click="openList(l.id)">
        <view class="tile-icon" :style="{ background: l.color }">
          <view class="glyph" />
        </view>
        <text class="tile-title">{{ l.title }}</text>
        <text class="tile-sub bl-muted">{{ stats(l.id).undone }}项目</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import BlHeader from '../../components/BlHeader.vue'
import { ensureListState, listLists, listStats } from '../../utils/listStore'

const listState = ref(ensureListState())

function refresh() {
  listState.value = ensureListState()
}

onShow(() => refresh())

const lists = computed(() => listLists(listState.value))

function stats(listId) {
  return listStats(listState.value, listId)
}

function openList(id) {
  uni.navigateTo({ url: `/pages/lists/list-detail?id=${id}` })
}

function goAdd() {
  uni.navigateTo({ url: '/pages/lists/list-form' })
}

function tileBg(hex) {
  const rgb = hexToRgb(hex)
  if (!rgb) return 'rgba(17, 17, 17, 0.04)'
  const mix = (a, b, t) => Math.round(a + (b - a) * t)
  const r = mix(rgb.r, 255, 0.9)
  const g = mix(rgb.g, 255, 0.9)
  const b = mix(rgb.b, 255, 0.9)
  return `rgb(${r}, ${g}, ${b})`
}

function hexToRgb(hex) {
  const h = String(hex || '').replace('#', '').trim()
  if (h.length !== 6) return null
  const n = Number.parseInt(h, 16)
  if (Number.isNaN(n)) return null
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}
</script>

<style scoped lang="scss">
.lists-page {
  padding-bottom: 80rpx;
}

.add-btn {
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8rpx;
}

.add-plus {
  color: #3d6afb;
  font-size: 34rpx;
  font-weight: 900;
  line-height: 1;
}

.add-text {
  color: #3d6afb;
  font-size: 28rpx;
  font-weight: 900;
}

.grid {
  margin-top: 8rpx;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18rpx;
}

.tile {
  border-radius: 24rpx;
  padding: 24rpx;
  min-height: 190rpx;
}

.tile-icon {
  width: 64rpx;
  height: 64rpx;
  border-radius: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.glyph {
  width: 34rpx;
  height: 34rpx;
  border-radius: 10rpx;
  border: 3rpx solid rgba(255, 255, 255, 0.95);
  position: relative;
}

.glyph::before,
.glyph::after {
  content: '';
  position: absolute;
  left: 6rpx;
  right: 6rpx;
  height: 3rpx;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 999rpx;
}

.glyph::before {
  top: 10rpx;
}

.glyph::after {
  bottom: 10rpx;
}

.tile-title {
  margin-top: 16rpx;
  display: block;
  font-size: 34rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.9);
}

.tile-sub {
  margin-top: 10rpx;
  display: block;
  font-size: 26rpx;
  font-weight: 800;
}
</style>

