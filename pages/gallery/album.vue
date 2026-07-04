<template>
  <view class="page">
    <view class="head" :style="{ paddingTop: safeTop + 'px' }">
      <view class="head-left" @click="back">
        <text class="back">‹</text>
      </view>
      <text class="head-title">{{ headerTitle }}</text>
      <view class="head-right">
        <view v-if="selectMode" class="pill" @click="toggleSelectAll">
          <text class="pill-text">✓ 全选</text>
        </view>
        <text v-else class="danger" @click="confirmDeleteAlbum">删除</text>
      </view>
    </view>

    <view class="cover">
      <image v-if="coverUri" class="cover-img" :src="coverUri" mode="aspectFill" />
      <view v-else class="cover-ph">
        <image
          class="cover-ph-icon"
          src="/static/gallery/icon_image.png"
          mode="aspectFit"
        />
      </view>

      <view class="cover-info">
        <view class="cover-line">
          <text class="album-name">{{ album?.name }}</text>
          <view class="edit" @click="openRename">
            <image
              class="edit-icon"
              src="/static/gallery/icon_edit.png"
              mode="aspectFit"
            />
          </view>
        </view>
        <text class="sub">数量: {{ photos.length }}</text>
        <text class="sub">创建: {{ album?.createdAt }}</text>
      </view>
    </view>

    <view class="tools">
      <view class="tool-left" @click="openSlideshow">
        <view class="play">
          <image
            class="play-icon"
            src="/static/gallery/icon_video.png"
            mode="aspectFit"
          />
        </view>
        <text class="tool-text">幻灯片</text>
      </view>
      <text v-if="!selectMode" class="choose" @click="enterSelect">选择</text>
      <text v-else class="choose" @click="exitSelect">完成</text>
    </view>

    <view v-if="photos.length === 0" class="empty">
      <view class="empty-icon">
        <image
          class="empty-pic"
          src="/static/gallery/bg_none_galley.png"
          mode="aspectFit"
        />
      </view>
      <text class="empty-text">暂无照片</text>
      <view class="empty-btn" @click="openUpload">
        <text class="empty-btn-text">添加照片</text>
      </view>
    </view>

    <view v-else class="grid">
      <view
        v-for="p in photos"
        :key="p.id"
        class="cell"
        @click="tapPhoto(p.id)"
      >
        <image class="cell-img" :src="p.type === 'video' ? (p.thumbUri || '') : p.uri" mode="aspectFill" />
        <view v-if="p.type === 'video' && !p.thumbUri" class="cell-ph" />
        <view v-if="p.type === 'video'" class="video">
          <view class="video-icon">
            <image
              class="video-icon-img"
              src="/static/gallery/icon_play.png"
              mode="aspectFit"
            />
          </view>
        </view>

        <view v-if="selectMode" class="sel" @click.stop="togglePhoto(p.id)">
          <view class="sel-box" :class="{ checked: selectedSet.has(p.id) }">
            <image
              v-if="selectedSet.has(p.id)"
              class="sel-check"
              src="/static/common/icon_checkbox_checked.png"
              mode="aspectFit"
            />
          </view>
        </view>
      </view>
    </view>

    <view class="fab" @click="openUpload">
      <image
        class="fab-img"
        src="/static/common/btn_fab_add.png"
        mode="aspectFit"
      />
    </view>

    <view v-if="selectMode" class="bar">
      <text class="bar-left"
        >{{ selectedCount }}/{{ photos.length }}项已选择</text
      >
      <view class="bar-actions">
        <view class="bar-btn" @click="confirmDeleteSelected"
          ><image
            class="bar-icon"
            src="/static/gallery/icon_trash.png"
            mode="aspectFit"
        /></view>
      </view>
    </view>

    <view v-if="renameVisible" class="sheet-mask" @click="closeRename">
      <view class="sheet" @click.stop>
        <view class="sheet-head">
          <text class="sheet-title">编辑名称</text>
          <image
            class="sheet-x"
            src="/static/gallery/icon_close.png"
            mode="aspectFit"
            @click="closeRename"
          />
        </view>
        <view class="sheet-input">
          <input
            v-model="renameValue"
            class="sheet-field"
            placeholder="输入相册名称"
            placeholder-class="sheet-ph"
          />
        </view>
        <view
          class="sheet-btn"
          :class="{ disabled: !renameValue.trim() }"
          @click="submitRename"
        >
          <text class="sheet-btn-text">确定</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from "vue";
import { onLoad, onShow } from "@dcloudio/uni-app";
import {
  deleteAlbumInfo,
  deleteAlbumPhoto,
  getAlbumList,
  updateAlbumInfo,
} from "../../utils/api/gallery";

const albumId = ref("");
const rawAlbums = ref([]);
const deviceEmail = ref("");
const selectMode = ref(false);
const selectedIds = ref([]);
const renameVisible = ref(false);
const renameValue = ref("");

onLoad((options) => {
  albumId.value = options && options.albumId ? String(options.albumId) : "";
});

onShow(() => {
  refresh();
});

const safeTop = computed(() => {
  try {
    const info = uni.getSystemInfoSync();
    const insets = info && info.safeAreaInsets ? info.safeAreaInsets : null;
    return insets && typeof insets.top === "number" ? insets.top : 0;
  } catch (e) {
    return 0;
  }
});

const album = computed(() => {
  return rawAlbums.value.find((a) => a.albumId === albumId.value) || null;
});

const photos = computed(() => (album.value && Array.isArray(album.value.photos) ? album.value.photos : []));

const coverUri = computed(() => {
  const list = photos.value;
  if (!list[0]) return "";
  const p = list[0];
  if (p.type === "video") return p.thumbUri || "";
  return p.uri || "";
});

const headerTitle = computed(() => {
  if (selectMode.value) return "选择";
  return album.value ? album.value.name : "";
});

const selectedSet = computed(() => new Set(selectedIds.value));
const selectedCount = computed(() => selectedIds.value.length);

function back() {
  uni.navigateBack();
}

async function refresh() {
  try {
    const active = String(uni.getStorageSync("active_device_email_v1") || "").trim();
    deviceEmail.value = active;
    rawAlbums.value = active ? await getAlbumList({ deviceEmail: active }) : [];
    if (albumId.value && !album.value) {
      uni.showToast({ title: "相册不存在", icon: "none" });
      setTimeout(() => uni.navigateBack(), 300);
    }
  } catch (e) {
    rawAlbums.value = [];
    uni.showToast({ title: String((e && e.message) || "获取相册失败"), icon: "none" });
  }
}

function enterSelect() {
  if (photos.value.length === 0) return;
  selectMode.value = true;
  selectedIds.value = [];
}

function exitSelect() {
  selectMode.value = false;
  selectedIds.value = [];
}

function togglePhoto(id) {
  const next = new Set(selectedIds.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  selectedIds.value = Array.from(next);
}

function toggleSelectAll() {
  if (selectedIds.value.length === photos.value.length) {
    selectedIds.value = [];
    return;
  }
  selectedIds.value = photos.value.map((p) => p.id);
}

function tapPhoto(id) {
  if (selectMode.value) {
    togglePhoto(id);
    return;
  }
  uni.navigateTo({
    url: `/pages/gallery/photo?albumId=${encodeURIComponent(albumId.value)}&photoId=${encodeURIComponent(id)}`,
  });
}

function openSlideshow() {
  if (photos.value.length === 0) return;
  uni.navigateTo({
    url: `/pages/gallery/slideshow?albumId=${encodeURIComponent(albumId.value)}`,
  });
}

function openUpload() {
  uni.navigateTo({
    url: `/pages/gallery/upload?albumId=${encodeURIComponent(albumId.value)}`,
  });
}

function confirmDeleteAlbum() {
  if (!album.value) return;
  uni.showModal({
    title: "删除相册",
    content: "相册一旦删除将无法恢复",
    cancelText: "取消",
    confirmText: "确定",
    success: async (res) => {
      if (!res.confirm) return;
      try {
        uni.showLoading({ title: "删除中" });
        await deleteAlbumInfo({ albumId: albumId.value });
        try {
          const pages = typeof getCurrentPages === "function" ? getCurrentPages() : [];
          const prev = pages && pages.length >= 2 ? pages[pages.length - 2] : null;
          const route = prev && prev.route ? String(prev.route) : "";
          if (route === "pages/gallery/index") {
            uni.navigateBack();
          } else {
            uni.redirectTo({ url: "/pages/gallery/index" });
          }
        } catch (e) {
          uni.redirectTo({ url: "/pages/gallery/index" });
        }
      } catch (e) {
        uni.showToast({ title: String((e && e.message) || "删除相册失败"), icon: "none" });
      } finally {
        try {
          uni.hideLoading();
        } catch (e) {}
      }
    },
  });
}

function confirmDeleteSelected() {
  if (selectedIds.value.length === 0) return;
  uni.showModal({
    title: "删除图片",
    content: `将删除${selectedIds.value.length}张照片，删除后无法恢复`,
    cancelText: "取消",
    confirmText: "确定",
    success: async (res) => {
      if (!res.confirm) return;
      try {
        uni.showLoading({ title: "删除中" });
        for (const id of selectedIds.value) {
          await deleteAlbumPhoto({ photoId: id });
        }
        await refresh();
        exitSelect();
      } catch (e) {
        uni.showToast({ title: String((e && e.message) || "删除照片失败"), icon: "none" });
      } finally {
        try {
          uni.hideLoading();
        } catch (e) {}
      }
    },
  });
}

function openRename() {
  if (!album.value) return;
  renameValue.value = album.value.name;
  renameVisible.value = true;
}

function closeRename() {
  renameVisible.value = false;
}

async function submitRename() {
  const v = renameValue.value.trim();
  if (!v) return;
  try {
    uni.showLoading({ title: "保存中" });
    await updateAlbumInfo({ deviceEmail: deviceEmail.value, albumId: albumId.value, albumName: v });
    renameVisible.value = false;
    await refresh();
  } catch (e) {
    uni.showToast({ title: String((e && e.message) || "更新相册失败"), icon: "none" });
  } finally {
    try {
      uni.hideLoading();
    } catch (e) {}
  }
}
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: #ffffff;
  padding-bottom: 180rpx;
}

.head {
  position: sticky;
  top: 0;
  z-index: 999;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
  padding: 18rpx 18rpx 12rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.head-left {
  width: 120rpx;
  display: flex;
  align-items: center;
}

.back {
  font-size: 56rpx;
  font-weight: 700;
  line-height: 1;
  color: rgba(17, 17, 17, 0.85);
  padding-left: 12rpx;
}

.head-title {
  font-size: 34rpx;
  font-weight: 900;
}

.head-right {
  width: 180rpx;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 12rpx;
}

.danger {
  font-size: 28rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.35);
}

.pill {
  height: 56rpx;
  padding: 0 16rpx;
  border-radius: 9999rpx;
  background: #3d6afb;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pill-text {
  color: #ffffff;
  font-size: 26rpx;
  font-weight: 900;
}

.cover {
  margin: 0 28rpx;
  height: 320rpx;
  border-radius: 28rpx;
  overflow: hidden;
  position: relative;
  background: #eef2ff;
}

.cover-img {
  width: 100%;
  height: 100%;
}

.cover-ph {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cover-ph-icon {
  width: 100%;
  height: 100%;
  // opacity: 0.38;
}

.cover-info {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 18rpx 18rpx 16rpx;
  border-radius: 24rpx;
  background: rgba(0, 0, 0, 0.4);
}

.cover-line {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.album-name {
  color: #ffffff;
  font-size: 30rpx;
  font-weight: 900;
}

.edit {
  width: 46rpx;
  height: 46rpx;
  border-radius: 9999rpx;
  background: rgba(255, 255, 255, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
}

.edit-icon {
  width: 22rpx;
  height: 22rpx;
  opacity: 0.95;
}

.sub {
  display: block;
  margin-top: 8rpx;
  color: rgba(255, 255, 255, 0.85);
  font-size: 24rpx;
  font-weight: 650;
}

.tools {
  padding: 18rpx 28rpx 12rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.tool-left {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.play {
  width: 44rpx;
  height: 44rpx;
  border-radius: 10rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.play-icon {
  width: 44rpx;
  height: 44rpx;
}

.tool-text {
  font-size: 28rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.75);
}

.choose {
  font-size: 28rpx;
  font-weight: 900;
  color: #3d6afb;
}

.empty {
  padding: 180rpx 28rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.empty-icon {
  width: 240rpx;
  height: 240rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.empty-pic {
  width: 200rpx;
  height: 200rpx;
}

.empty-text {
  margin-top: 12rpx;
  font-size: 26rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.5);
}

.empty-btn {
  margin-top: 24rpx;
  width: 360rpx;
  height: 92rpx;
  border-radius: 9999rpx;
  background: #3d6afb;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-btn-text {
  color: #ffffff;
  font-size: 32rpx;
  font-weight: 900;
}

.grid {
  padding: 4rpx 18rpx 0;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10rpx;
}

.cell {
  height: 220rpx;
  border-radius: 14rpx;
  overflow: hidden;
  position: relative;
  background: rgba(17, 17, 17, 0.04);
}

.cell-img {
  width: 100%;
  height: 100%;
}

.cell-ph {
  position: absolute;
  inset: 0;
  background: rgba(17, 17, 17, 0.08);
}

.video {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-icon {
  width: 64rpx;
  height: 64rpx;
  border-radius: 9999rpx;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-icon-img {
  width: 30rpx;
  height: 30rpx;
  margin-left: 4rpx;
}

.sel {
  position: absolute;
  top: 10rpx;
  right: 10rpx;
}

.sel-box {
  width: 36rpx;
  height: 36rpx;
  border-radius: 10rpx;
  background: rgba(255, 255, 255, 0.92);
  border: 2rpx solid rgba(17, 17, 17, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
}

.sel-box.checked {
  background: #3d6afb;
  border-color: #3d6afb;
}

.sel-check {
  width: 28rpx;
  height: 28rpx;
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

.bar {
  position: fixed;
  left: 18rpx;
  right: 18rpx;
  bottom: calc(22rpx + constant(safe-area-inset-bottom));
  bottom: calc(22rpx + env(safe-area-inset-bottom));
  height: 96rpx;
  border-radius: 9999rpx;
  background: rgba(245, 246, 247, 0.98);
  box-shadow: 0 10rpx 26rpx rgba(17, 17, 17, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 18rpx;
  z-index: 60;
}

.bar-left {
  font-size: 24rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.6);
}

.bar-actions {
  display: flex;
  align-items: center;
  gap: 18rpx;
}

.bar-btn {
  width: 64rpx;
  height: 64rpx;
  border-radius: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(17, 17, 17, 0.7);
}

.bar-icon {
  width: 36rpx;
  height: 36rpx;
}

.sheet-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  z-index: 200;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.sheet {
  width: 100%;
  background: #ffffff;
  border-top-left-radius: 28rpx;
  border-top-right-radius: 28rpx;
  padding: 18rpx 28rpx 34rpx;
}

.sheet-head {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 10rpx 0 14rpx;
}

.sheet-title {
  font-size: 34rpx;
  font-weight: 900;
}

.sheet-x {
  position: absolute;
  right: 0;
  top: 0;
  width: 72rpx;
  height: 72rpx;
  padding: 20rpx;
  box-sizing: border-box;
  opacity: 0.55;
}

.sheet-input {
  margin-top: 12rpx;
  height: 96rpx;
  border-radius: 22rpx;
  background: rgba(17, 17, 17, 0.03);
  padding: 0 20rpx;
  border: 2rpx solid rgba(17, 17, 17, 0.06);
  display: flex;
  align-items: center;
}

.sheet-field {
  width: 100%;
  font-size: 34rpx;
  font-weight: 700;
}

.sheet-ph {
  color: rgba(17, 17, 17, 0.35);
  font-weight: 650;
}

.sheet-btn {
  margin-top: 20rpx;
  height: 100rpx;
  border-radius: 9999rpx;
  background: #3d6afb;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sheet-btn.disabled {
  background: rgba(17, 17, 17, 0.18);
}

.sheet-btn-text {
  color: #ffffff;
  font-size: 34rpx;
  font-weight: 900;
}

.sheet-btn.disabled .sheet-btn-text {
  color: rgba(17, 17, 17, 0.55);
}
</style>
