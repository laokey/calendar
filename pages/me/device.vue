<template>
  <view class="page">
    <view class="head" :style="{ paddingTop: safeTop + 'px' }">
      <view class="head-left" @click="back">
        <image
          class="back-img"
          src="/static/my/icon_back.png"
          mode="aspectFit"
        />
      </view>
      <text class="head-title">关联设备</text>
      <view class="head-right" @click="goActivate">
        <view class="bl-icon-btn" @click="goAdd">
        <text class="plus">+</text>
        </view>
      </view>
    </view>

    <view class="hero">
      <image
        class="hero-img"
        src="/static/device/bg_device_link.png"
        mode="widthFix"
      />
    </view>

    <view class="intro">
      <text class="intro-text"
        >链接多个日历以在设备间共享相同信息。当您在一台设备上进行更改时，其他关联设备将自动更新。</text
      >
      <text class="intro-text"
        >点击下方的+号来链接全新的日历或您已激活的日历。</text
      >
    </view>

    <view class="list">
      <view v-for="d in devices" :key="d.id" class="item">
        <view class="item-left">
          <text class="status">{{ d.active ? "已激活" : "未激活" }}</text>
          <text class="name">{{ d.name }}</text>
        </view>
        <view class="item-right">
          <view class="mini-btn ghost" @click.stop="goManage(d)">
            <text class="mini-btn-text ghost-text">编辑</text>
          </view>
          <view class="mini-btn primary" @click.stop="getCode(d)">
            <text class="mini-btn-text primary-text">获取激活码</text>
          </view>
        </view>
      </view>
    </view>

    <view
      class="fab"
      @click="goActivate"
    >
      <image class="fab-img" src="/static/common/btn_fab_add.png" mode="aspectFit" />
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from "vue";

const devices = ref([
  { id: "cal_1", name: "日历", active: false },
  { id: "cal_2", name: "日历", active: false },
]);

const safeTop = computed(() => {
  try {
    const info = uni.getSystemInfoSync();
    const insets = info && info.safeAreaInsets ? info.safeAreaInsets : null;
    return insets && typeof insets.top === "number" ? insets.top : 0;
  } catch (e) {
    return 0;
  }
});

const safeBottom = computed(() => {
  try {
    const info = uni.getSystemInfoSync();
    const insets = info && info.safeAreaInsets ? info.safeAreaInsets : null;
    return insets && typeof insets.bottom === "number" ? insets.bottom : 0;
  } catch (e) {
    return 0;
  }
});

function back() {
  uni.navigateBack();
}

function goActivate() {
  uni.navigateTo({ url: "/pages/me/device-activate" });
}

function goManage(d) {
  const path =
    d && d.active
      ? "/pages/me/device-linked-manage"
      : "/pages/me/device-unlinked-manage";
  uni.navigateTo({
    url: `${path}?id=${encodeURIComponent(String(d && d.id ? d.id : ""))}`,
  });
}

function getCode(d) {
  uni.navigateTo({
    url: `/pages/me/device-activate?id=${encodeURIComponent(String(d && d.id ? d.id : ""))}`,
  });
}
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background-color: #ffffff;
  background-image: url("/static/my/bg_my.png");
  background-repeat: no-repeat;
  background-position: top center;
  background-size: 100% auto;
  padding: 0 28rpx 40rpx;
}

.head {
  position: sticky;
  top: 0;
  z-index: 999;
  padding: 18rpx 0 12rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: transparent;
}

.head-left,
.head-right {
  width: 96rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
}

.head-right {
  justify-content: flex-end;
}

.back-img {
  width: 44rpx;
  height: 44rpx;
  display: block;
  opacity: 0.92;
}

.plus-img {
  width: 44rpx;
  height: 44rpx;
  display: block;
  opacity: 0.92;
}

.bl-icon-btn {
  background: #fafafa;
}

.head-title {
  font-size: 34rpx;
  font-weight: 900;
  color: #111111;
}

.plus {
  font-size: 50rpx;
  font-weight: 700;
  line-height: 1;
}

.hero {
  margin-top: 20rpx;
  display: flex;
  justify-content: center;
}

.hero-img {
  width: 100%;
}

.intro {
  margin-top: 14rpx;
  background: linear-gradient(180deg, #ebf2ff 0%, #ffffff 100%);
  border-radius: 24rpx 24rpx 24rpx 24rpx;
  padding: 40rpx;
}

.intro-text {
  display: block;
  font-size: 28rpx;
  font-weight: 500;
  color: #333333;
  line-height: 1.25;
}

.intro-text + .intro-text {
  margin-top: 10rpx;
}

.list {
  margin-top: 18rpx;
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.item {
  background: #ffffff;
  border-radius: 24rpx;
  border: 2rpx solid #EFEFEF;
  padding: 22rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
}

.item-left {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.status {
  font-size: 24rpx;
  font-weight: 700;
  color: rgba(17, 17, 17, 0.4);
}

.name {
  font-size: 30rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.9);
}

.item-right {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.mini-btn {
  height: 72rpx;
  border-radius: 999rpx;
  padding: 0 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mini-btn.ghost {
  background: rgba(64, 109, 255, 0.12);
}

.mini-btn.primary {
  background: #406dff;
}

.mini-btn-text {
  font-size: 26rpx;
  font-weight: 900;
}

.ghost-text {
  color: #406dff;
}

.primary-text {
  color: #ffffff;
}


.fab {
  position: fixed;
  right: 34rpx;
  bottom: 120rpx;
  width: 152rpx;
  height: 96rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fab-img {
  width: 152rpx;
  height: 96rpx;
  display: block;
}
</style>
