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
      <view v-for="l in lists" :key="l.id" class="tile" :style="{ background: tileBg(l.color) }" @click="openList(l)">
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
import { getItemListByType, getItemTypeList } from '../../utils/api/tasks'

const listItems = ref([])
const statsMap = ref({})

const lists = computed(() =>
  listItems.value.slice().sort((a, b) => (b.createdAtTs || 0) - (a.createdAtTs || 0)),
)

async function refresh() {
  try {
    const nextLists = await getItemTypeList()
    listItems.value = nextLists
    const entries = await Promise.all(
      nextLists.map(async (list) => {
        const items = await getItemListByType({ typeId: list.id })
        const total = items.length
        const done = items.filter((x) => x.done).length
        return [list.id, { total, done, undone: total - done }]
      }),
    )
    statsMap.value = entries.reduce((acc, entry) => {
      acc[entry[0]] = entry[1]
      return acc
    }, {})
  } catch (e) {
    listItems.value = []
    statsMap.value = {}
  }
}

onShow(() => {
  refresh()
})

function stats(listId) {
  return statsMap.value[listId] || { total: 0, done: 0, undone: 0 }
}

function openList(list) {
  const id = list && list.id ? String(list.id) : ''
  if (!id) return
  const title = encodeURIComponent(String((list && list.title) || ''))
  uni.navigateTo({ url: `/pages/lists/list-detail?id=${id}&title=${title}` })
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
  background: #ffffff;
  min-height: 100vh;
  box-sizing: border-box;
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
  white-space: nowrap;
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
