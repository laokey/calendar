<template>
  <view class="page">
    <BlHeader title="系统权限管理" back />

    <text class="hint">
      为了提供您更好的用户体验，我们可能需要在特定场景下从您申请以下移动系统权限。
    </text>

    <view class="list">
      <view class="item" @click="toggle('camera')">
        <view class="left">
          <view class="ico"><image class="ico-img" src="/static/my/icon_perm_camera.png" mode="aspectFit" /></view>
          <view class="meta">
            <text class="title">允许访问相机</text>
            <text class="sub">拍摄后发送照片或视频以及其他场景</text>
          </view>
        </view>
        <view class="right">
          <text class="status">{{ perms.camera ? '已启用' : '未启用' }}</text>
          <image class="chev-img" src="/static/my/icon_chevron_right.png" mode="aspectFit" />
        </view>
      </view>

      <view class="item" @click="toggle('microphone')">
        <view class="left">
          <view class="ico"><image class="ico-img" src="/static/my/icon_perm_microphone.png" mode="aspectFit" /></view>
          <view class="meta">
            <text class="title">允许访问麦克风</text>
            <text class="sub">用于发送视频等场景</text>
          </view>
        </view>
        <view class="right">
          <text class="status">{{ perms.microphone ? '已启用' : '未启用' }}</text>
          <image class="chev-img" src="/static/my/icon_chevron_right.png" mode="aspectFit" />
        </view>
      </view>

      <view class="item" @click="toggle('calendar')">
        <view class="left">
          <view class="ico"><image class="ico-img" src="/static/my/icon_calendar.png" mode="aspectFit" /></view>
          <view class="meta">
            <text class="title">允许访问日历</text>
            <text class="sub">用于访问本地日历等场景</text>
          </view>
        </view>
        <view class="right">
          <text class="status blue">{{ perms.calendar ? '已启用' : '设置' }}</text>
          <image class="chev-img" src="/static/my/icon_chevron_right.png" mode="aspectFit" />
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import BlHeader from '../../components/BlHeader.vue'
import { ensureMeState, updateSettings } from '../../utils/meStore'

const state = ref(ensureMeState())

onShow(() => {
  state.value = ensureMeState()
})

const perms = computed(() => {
  const p = state.value.settings && state.value.settings.permissions ? state.value.settings.permissions : {}
  return {
    camera: !!p.camera,
    microphone: !!p.microphone,
    calendar: !!p.calendar,
  }
})

function toggle(key) {
  const next = { ...perms.value, [key]: !perms.value[key] }
  const s = ensureMeState()
  updateSettings(s, { permissions: next })
  state.value = ensureMeState()
}
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: #ffffff;
  padding: 0 28rpx;
}

.hint {
  display: block;
  margin-top: 28rpx;
  font-size: 26rpx;
  font-weight: 700;
  line-height: 40rpx;
  color: #333333;
}

.list {
  margin-top: 18rpx;
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.item {
  border-radius: 22rpx;
  background: rgba(17, 17, 17, 0.03);
  border: 2rpx solid rgba(17, 17, 17, 0.06);
  padding: 18rpx 18rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14rpx;
}

.left {
  display: flex;
  align-items: center;
  gap: 14rpx;
  flex: 1;
}

.ico {
  width: 74rpx;
  height: 74rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ico-img {
  width: 42rpx;
  height: 42rpx;
}

.meta {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.title {
  font-size: 30rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.85);
}

.sub {
  font-size: 24rpx;
  font-weight: 700;
  color: rgba(17, 17, 17, 0.45);
}

.right {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.status {
  font-size: 26rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.45);
}

.blue {
  color: #3d6afb;
}

.chev-img {
  width: 22rpx;
  height: 22rpx;
  opacity: 0.55;
}
</style>
