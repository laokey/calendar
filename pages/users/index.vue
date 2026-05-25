<template>
  <view class="bl-page page">
    <BlHeader title="用户管理" back backIconSrc="/static/my/icon_back.png" />

    <text class="desc">您可以在此页面管理您的朋友和家人。</text>

    <text class="section-title">邀请新朋友</text>

    <text class="method">方法1</text>
    <view class="invite-row">
      <input v-model="email" class="invite-input" placeholder="您朋友的电子邮件" placeholder-class="ph" />
      <view class="invite-btn" :class="{ disabled: !canAdd }" @click="add">
        <text class="invite-btn-text">+添加</text>
      </view>
    </view>

    <text class="method">方法2</text>
    <view class="share-row" @click="share">
      <image class="share-icon" src="/static/common/icon_link.png" mode="aspectFit" />
      <text class="share-text">分享链接</text>
    </view>

    <text class="section-title">管理朋友和家人</text>
    <view class="tabs">
      <view class="tab" @click="active = 'approved'">
        <text class="tab-text" :class="{ active: active === 'approved' }">已通过</text>
        <view v-if="active === 'approved'" class="underline" />
      </view>
      <view class="tab" @click="active = 'pending'">
        <text class="tab-text" :class="{ active: active === 'pending' }">待处理</text>
        <view v-if="active === 'pending'" class="underline" />
      </view>
      <view class="tab" @click="active = 'rejected'">
        <text class="tab-text" :class="{ active: active === 'rejected' }">已拒绝</text>
        <view v-if="active === 'rejected'" class="underline" />
      </view>
    </view>

    <view v-if="items.length === 0" class="empty">
      <image class="empty-img" src="/static/common/bg_none_user.png" mode="widthFix" />
      <text class="empty-text">暂无内容</text>
    </view>

    <view v-else class="list">
      <view v-for="u in items" :key="u.id" class="card">
        <view class="card-left">
          <BlAvatar :glyph="u.who.glyph" :color="u.who.color" :size="72" />
          <view class="meta">
            <text class="email">{{ u.email }}</text>
            <text class="time">{{ u.createdAt }}</text>
          </view>
        </view>

        <view v-if="active === 'pending'" class="actions">
          <view class="btn approve" @click="approve(u.id)"><text class="btn-text">批准</text></view>
          <view class="btn reject" @click="reject(u.id)"><text class="btn-text">拒绝</text></view>
        </view>

        <view v-else-if="active === 'approved'" class="actions">
          <view class="btn ghost" @click="openPermission(u)"><text class="ghost-text">权限管理</text></view>
          <view class="trash" @click="del(u.id)">
            <image class="trash-img" src="/static/my/icon_trash.png" mode="aspectFit" />
          </view>
        </view>
      </view>
    </view>

    <BlSheet v-model="permissionOpen" title="权限">
      <view class="perm-list">
        <view class="perm-item" @click="permissionDraft = 'self'">
          <text class="perm-text">只看自己的照片</text>
          <view class="radio" :class="{ on: permissionDraft === 'self' }"><text v-if="permissionDraft === 'self'" class="radio-check">✓</text></view>
        </view>
        <view class="perm-item" @click="permissionDraft = 'view'">
          <text class="perm-text">允许查看照片</text>
          <view class="radio" :class="{ on: permissionDraft === 'view' }"><text v-if="permissionDraft === 'view'" class="radio-check">✓</text></view>
        </view>
        <view class="perm-item" @click="permissionDraft = 'edit'">
          <text class="perm-text">允许查看/编辑照片</text>
          <view class="radio" :class="{ on: permissionDraft === 'edit' }"><text v-if="permissionDraft === 'edit'" class="radio-check">✓</text></view>
        </view>
      </view>

      <view class="perm-actions">
        <view class="perm-ok" @click="confirmPermission"><text class="perm-ok-text">确定</text></view>
        <view class="perm-cancel" @click="permissionOpen = false"><text class="perm-cancel-text">取消</text></view>
      </view>
    </BlSheet>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import BlAvatar from '../../components/BlAvatar.vue'
import BlHeader from '../../components/BlHeader.vue'
import BlSheet from '../../components/BlSheet.vue'
import { addInvite, approveInvite, ensureUserManageState, listUsersByStatus, rejectInvite, removeUser, updatePermission } from '../../utils/userManageStore'

const state = ref(ensureUserManageState())
const active = ref('pending')
const email = ref('')

onLoad((options) => {
  const t = options && options.tab ? String(options.tab) : ''
  if (t === 'approved' || t === 'pending' || t === 'rejected') active.value = t
})

function refresh() {
  state.value = ensureUserManageState()
}

onShow(() => {
  refresh()
})

const canAdd = computed(() => !!String(email.value || '').trim())

const items = computed(() => {
  return listUsersByStatus(state.value, active.value)
})

function add() {
  if (!canAdd.value) return
  const v = String(email.value || '').trim()
  const s = ensureUserManageState()
  addInvite(s, v)
  email.value = ''
  state.value = ensureUserManageState()
  active.value = 'pending'
  uni.showToast({ title: '已添加', icon: 'none' })
}

function share() {
  const link = `https://example.com/invite?ts=${Date.now()}`
  uni.setClipboardData({
    data: link,
    success: () => {
      uni.showToast({ title: '链接已复制', icon: 'none' })
    },
  })
}

function approve(id) {
  const s = ensureUserManageState()
  approveInvite(s, id)
  state.value = ensureUserManageState()
  uni.showToast({ title: '已通过', icon: 'none' })
}

function reject(id) {
  const s = ensureUserManageState()
  rejectInvite(s, id)
  state.value = ensureUserManageState()
  uni.showToast({ title: '已拒绝', icon: 'none' })
}

function del(id) {
  uni.showModal({
    title: '',
    content: '删除该用户？',
    cancelText: '取消',
    confirmText: '删除',
    confirmColor: '#ff3b30',
    success: (res) => {
      if (!res.confirm) return
      const s = ensureUserManageState()
      removeUser(s, id)
      state.value = ensureUserManageState()
    },
  })
}

const permissionOpen = ref(false)
const permissionUserId = ref('')
const permissionDraft = ref('self')

function openPermission(u) {
  permissionUserId.value = String(u.id || '')
  permissionDraft.value = u.permission || 'self'
  permissionOpen.value = true
}

function confirmPermission() {
  if (!permissionUserId.value) return
  const s = ensureUserManageState()
  updatePermission(s, permissionUserId.value, permissionDraft.value)
  state.value = ensureUserManageState()
  permissionOpen.value = false
  uni.showToast({ title: '已更新', icon: 'none' })
}
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: #ffffff;
}

.desc {
  display: block;
  margin-top: 8rpx;
  font-size: 26rpx;
  font-weight: 700;
  color: rgba(17, 17, 17, 0.55);
}

.section-title {
  display: block;
  margin-top: 26rpx;
  font-size: 34rpx;
  font-weight: 600;
  color: rgba(17, 17, 17, 0.92);
}

.method {
  display: block;
  margin-top: 16rpx;
  font-size: 28rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.6);
}

.invite-row {
  margin-top: 10rpx;
  height: 98rpx;
  border-radius: 22rpx;
  background: rgba(17, 17, 17, 0.03);
  border: 2rpx solid rgba(17, 17, 17, 0.06);
  padding: 0 14rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.invite-input {
  flex: 1;
  font-size: 30rpx;
  font-weight: 700;
  color: rgba(17, 17, 17, 0.85);
}

.ph {
  color: rgba(17, 17, 17, 0.28);
  font-weight: 650;
}

.invite-btn {
  width: 196rpx;
  height: 78rpx;
  border-radius: 18rpx;
  background: #3d6afb;
  display: flex;
  align-items: center;
  justify-content: center;
}

.invite-btn.disabled {
  background: rgba(17, 17, 17, 0.18);
}

.invite-btn-text {
  color: #ffffff;
  font-size: 30rpx;
  font-weight: 900;
}

.share-row {
  margin-top: 10rpx;
  height: 98rpx;
  border-radius: 22rpx;
  background: rgba(17, 17, 17, 0.03);
  border: 2rpx solid rgba(17, 17, 17, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
}

.share-icon {
  width: 34rpx;
  height: 34rpx;
}

.share-text {
  font-size: 30rpx;
  font-weight: bold;
  color: rgba(17, 17, 17, 0.85);
}

.tabs {
  margin-top: 18rpx;
  display: flex;
  align-items: center;
  gap: 52rpx;
}

.tab {
  position: relative;
  padding-bottom: 18rpx;
}

.tab-text {
  font-size: 28rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.55);
}

.tab-text.active {
  font-weight: 900;
  color: rgba(17, 17, 17, 0.92);
}

.underline {
  position: absolute;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  width: 36rpx;
  height: 8rpx;
  border-radius: 9999rpx;
  background: #3d6afb;
}

.list {
  margin-top: 18rpx;
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.card {
  height: 128rpx;
  border-radius: 28rpx;
  background: #f5f6f7;
  padding: 0 18rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14rpx;
}

.card-left {
  display: flex;
  align-items: center;
  gap: 14rpx;
  min-width: 0;
}

.meta {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  min-width: 0;
}

.email {
  font-size: 30rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.92);
  max-width: 380rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.time {
  font-size: 24rpx;
  font-weight: 700;
  color: rgba(17, 17, 17, 0.45);
}

.actions {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.btn {
  height: 64rpx;
  padding: 0 22rpx;
  border-radius: 9999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-text {
  color: #ffffff;
  font-size: 28rpx;
  font-weight: 900;
}

.approve {
  background: #3d6afb;
}

.reject {
  background: #ff3b30;
}

.ghost {
  background: rgba(255, 255, 255, 0.8);
  border: 2rpx solid rgba(17, 17, 17, 0.08);
}

.ghost-text {
  font-size: 26rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.85);
}

.trash {
  width: 56rpx;
  height: 56rpx;
  border-radius: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.trash-img {
  width: 34rpx;
  height: 34rpx;
}

.empty {
  margin-top: 88rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.empty-img {
  width: 280rpx;
}

.empty-text {
  margin-top: 18rpx;
  font-size: 26rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.35);
}

.perm-list {
  margin-top: 14rpx;
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.perm-item {
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.perm-text {
  font-size: 30rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.88);
}

.radio {
  width: 38rpx;
  height: 38rpx;
  border-radius: 9999rpx;
  border: 2rpx solid rgba(17, 17, 17, 0.18);
  background: rgba(17, 17, 17, 0.03);
  display: flex;
  align-items: center;
  justify-content: center;
}

.radio.on {
  border-color: #3d6afb;
  background: #3d6afb;
}

.radio-check {
  color: #ffffff;
  font-size: 24rpx;
  font-weight: 900;
}

.perm-actions {
  margin-top: 26rpx;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.perm-ok {
  height: 96rpx;
  border-radius: 9999rpx;
  background: #3d6afb;
  display: flex;
  align-items: center;
  justify-content: center;
}

.perm-ok-text {
  color: #ffffff;
  font-size: 34rpx;
  font-weight: 900;
}

.perm-cancel {
  height: 96rpx;
  border-radius: 9999rpx;
  background: rgba(61, 106, 251, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
}

.perm-cancel-text {
  font-size: 34rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.7);
}
</style>
