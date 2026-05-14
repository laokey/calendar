<template>
  <view class="bl-page add-page">
    <BlHeader title="添加" back>
      <template #right>
        <view class="top-save" @click="save">
          <text class="top-save-text">保存</text>
        </view>
      </template>
    </BlHeader>

    <view class="hero">
      <view class="avatar-wrap">
        <BlAvatar :glyph="glyphPreview" :color="color" :size="168" />
        <view class="cam">
          <text class="cam-text">相机</text>
        </view>
      </view>
    </view>

    <view class="block">
      <view class="input-wrap">
        <input v-model="name" class="input" placeholder="请输入名称" placeholder-class="ph" />
      </view>
    </view>

    <view class="block">
      <text class="label">选择颜色</text>
      <view class="colors">
        <view
          v-for="c in palette"
          :key="c"
          class="c"
          :style="{ background: c }"
          @click="color = c"
        >
          <view v-if="color === c" class="c-check"><text class="c-check-text">✓</text></view>
        </view>
      </view>
    </view>

    <view class="bottom-save" @click="save">
      <text class="bottom-save-text">保存</text>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import BlAvatar from '../../components/BlAvatar.vue'
import BlHeader from '../../components/BlHeader.vue'
import { addMember, ensureCalendarState } from '../../utils/calendarStore'

const state = ref(ensureCalendarState())
const name = ref('')
const color = ref('#ffb020')

const palette = [
  '#ffb020',
  '#ff5a5f',
  '#ff4b3f',
  '#7ddc5a',
  '#4cc38a',
  '#00b060',
  '#00a3ff',
  '#4c8dff',
  '#3d6afb',
  '#9b59ff',
  '#6b2cff',
  '#ff4bd8',
  '#a600a6',
]

const glyphPreview = computed(() => {
  const n = String(name.value || '').trim()
  if (!n) return ''
  return n.length >= 2 ? n.slice(-2, -1) : n.slice(0, 1)
})

function save() {
  const m = addMember(state.value, { name: name.value, color: color.value })
  if (!m) {
    uni.showToast({ title: '请输入名称', icon: 'none' })
    return
  }
  uni.$emit && uni.$emit('calendar:refresh')
  uni.navigateBack()
}
</script>

<style scoped lang="scss">
.add-page {
  padding-bottom: 240rpx;
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

.hero {
  margin-top: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-wrap {
  position: relative;
}

.cam {
  position: absolute;
  right: 12rpx;
  bottom: 12rpx;
  width: 66rpx;
  height: 66rpx;
  border-radius: 999rpx;
  background: #3d6afb;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cam-text {
  color: #ffffff;
  font-size: 34rpx;
  font-weight: 900;
}

.block {
  background: #ffffff;
  border-radius: 28rpx;
  padding: 20rpx 22rpx;
  margin-top: 18rpx;
  box-shadow: 0 10rpx 26rpx rgba(17, 17, 17, 0.06);
}

.input-wrap {
  height: 96rpx;
  border-radius: 24rpx;
  background: rgba(17, 17, 17, 0.04);
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

.label {
  font-size: 30rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.88);
}

.colors {
  margin-top: 16rpx;
  display: flex;
  flex-wrap: wrap;
  gap: 18rpx;
}

.c {
  width: 66rpx;
  height: 66rpx;
  border-radius: 999rpx;
  box-shadow: 0 8rpx 16rpx rgba(17, 17, 17, 0.12);
  position: relative;
}

.c-check {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.c-check-text {
  color: #ffffff;
  font-size: 30rpx;
  font-weight: 900;
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
