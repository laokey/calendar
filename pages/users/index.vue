<template>
  <view class="bl-page page">
    <BlHeader :title="$t('用户管理')" back backIconSrc="/static/my/icon_back.png" />

    <text class="desc">{{ $t('您可以在此页面管理您的朋友和家人。') }}</text>

    <text class="section-title">{{ $t('邀请新朋友') }}</text>

    <text class="method">{{ $t('方法1') }}</text>
    <view class="invite-row">
      <input v-model="email" class="invite-input" :placeholder="$t('您朋友的电子邮件')" placeholder-class="ph" />
      <view class="invite-btn" :class="{ disabled: !canAdd || submitting }" @click="add">
        <text class="invite-btn-text">{{ $t('+添加') }}</text>
      </view>
    </view>

    <text class="method">{{ $t('方法2') }}</text>
    <view class="share-row" @click="share">
      <image class="share-icon" src="/static/common/icon_link.png" mode="aspectFit" />
      <text class="share-text">{{ $t('分享链接') }}</text>
    </view>

    <text class="section-title">{{ $t('管理朋友和家人') }}</text>
    <view class="tabs">
      <view class="tab" @click="active = 'approved'">
        <text class="tab-text" :class="{ active: active === 'approved' }">{{ $t('已通过') }}</text>
        <view v-if="active === 'approved'" class="underline" />
      </view>
      <view class="tab" @click="active = 'pending'">
        <text class="tab-text" :class="{ active: active === 'pending' }">{{ $t('待处理') }}</text>
        <view v-if="active === 'pending'" class="underline" />
      </view>
      <view class="tab" @click="active = 'rejected'">
        <text class="tab-text" :class="{ active: active === 'rejected' }">{{ $t('已拒绝') }}</text>
        <view v-if="active === 'rejected'" class="underline" />
      </view>
    </view>

    <view v-if="items.length === 0" class="empty">
      <image class="empty-img" src="/static/common/bg_none_user.png" mode="widthFix" />
      <text class="empty-text">{{ $t('暂无内容') }}</text>
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
          <template v-if="u.canReview">
            <view class="btn approve" @click="approve(u)"><text class="btn-text">{{ $t('批准') }}</text></view>
            <view class="btn reject" @click="reject(u)"><text class="btn-text">{{ $t('拒绝') }}</text></view>
          </template>
          <text v-else class="status-text">{{ $t('等待对方处理') }}</text>
        </view>

        <view v-else-if="active === 'approved'" class="actions">
          <view class="btn ghost" @click="openPermission(u)"><text class="ghost-text">{{ $t('权限管理') }}</text></view>
        </view>

        <view v-else class="actions">
          <text class="status-text is-muted">{{ u.statusText }}</text>
        </view>
      </view>
    </view>

    <BlSheet v-model="permissionOpen" :title="$t('权限')">
      <view class="perm-list">
        <view class="perm-item" @click="permissionDraft = 'self'">
          <text class="perm-text">{{ $t('只看自己的照片') }}</text>
          <view class="radio" :class="{ on: permissionDraft === 'self' }"><text v-if="permissionDraft === 'self'" class="radio-check">✓</text></view>
        </view>
        <view class="perm-item" @click="permissionDraft = 'view'">
          <text class="perm-text">{{ $t('允许查看照片') }}</text>
          <view class="radio" :class="{ on: permissionDraft === 'view' }"><text v-if="permissionDraft === 'view'" class="radio-check">✓</text></view>
        </view>
        <view class="perm-item" @click="permissionDraft = 'edit'">
          <text class="perm-text">{{ $t('允许查看/编辑照片') }}</text>
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
import { usersApi } from '../../utils/api'

const active = ref('pending')
const email = ref('')
const submitting = ref(false)
const pendingUsers = ref([])
const approvedUsers = ref([])
const rejectedUsers = ref([])
const inviteCodeFromRoute = ref('')

onLoad((options) => {
  const t = options && options.tab ? String(options.tab) : ''
  if (t === 'approved' || t === 'pending' || t === 'rejected') active.value = t
  inviteCodeFromRoute.value = normalizeRouteText(options && (options.code || options.inviteCode || options.invitecode))
  if (inviteCodeFromRoute.value) {
    handleInviteCode(inviteCodeFromRoute.value)
  }
})

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase()
}

function normalizeRouteText(value) {
  const raw = value === undefined || value === null ? '' : String(value).trim()
  if (!raw || raw === 'null' || raw === 'undefined') return ''
  try {
    return decodeURIComponent(raw)
  } catch (e) {
    return raw
  }
}

function currentUserEmail() {
  return normalizeEmail(uni.getStorageSync('auth_email') || '')
}

function palette() {
  return ['#34c38f', '#ff5a5f', '#ffb020', '#3d6afb', '#9b59ff', '#7cc7ff', '#ff8a3d']
}

function glyphFromEmail(value) {
  const v = String(value || '').trim()
  if (!v) return uni.$t('友')
  const ch = v[0]
  return ch && ch.toUpperCase ? ch.toUpperCase() : ch || uni.$t('友')
}

function colorForEmail(value) {
  const v = String(value || '').trim()
  const list = palette()
  if (!v) return list[0]
  let sum = 0
  for (let i = 0; i < v.length; i += 1) sum += v.charCodeAt(i)
  return list[sum % list.length]
}

function friendWho(emailText) {
  return {
    glyph: glyphFromEmail(emailText),
    color: colorForEmail(emailText),
  }
}

function mapInviteItem(item, tab) {
  const selfEmail = currentUserEmail()
  const inviter = normalizeEmail(item && item.inviterEmail)
  const invitee = normalizeEmail(item && item.inviteeEmail)
  const targetEmail = inviter && inviter === selfEmail ? invitee : inviter || invitee
  const canReview = !!inviter && inviter !== selfEmail
  return {
    id: item && item.id ? String(item.id) : `${inviter}|${invitee}|${tab}`,
    email: targetEmail || invitee || inviter,
    createdAt: String(item && item.inviteTime ? item.inviteTime : ''),
    who: friendWho(targetEmail || invitee || inviter),
    inviterEmail: item && item.inviterEmail ? String(item.inviterEmail) : '',
    inviteeEmail: item && item.inviteeEmail ? String(item.inviteeEmail) : '',
    canReview,
    statusText: canReview ? uni.$t('你已拒绝') : uni.$t('对方已拒绝'),
  }
}

function mapFriendItem(item) {
  const emailText = item && item.friendEmail ? String(item.friendEmail) : ''
  return {
    id: emailText,
    email: emailText,
    createdAt: String(item && item.addTime ? item.addTime : ''),
    who: friendWho(emailText),
    permission: item && item.permission ? item.permission : 'self',
    authority: item && item.authority !== undefined ? Number(item.authority) : 0,
  }
}

function showError(error, fallback, map = {}) {
  const code = Number(error && error.code)
  const msg = map[code] || String((error && error.message) || fallback || uni.$t('操作失败'))
  uni.showToast({ title: msg, icon: 'none' })
}

async function refresh() {
  const [pendingRes, rejectedRes, approvedRes] = await Promise.allSettled([
    usersApi.getInviteFriendList({ status: 0 }),
    usersApi.getInviteFriendList({ status: 2 }),
    usersApi.getFriendList(),
  ])
  pendingUsers.value = pendingRes.status === 'fulfilled' ? pendingRes.value.map((item) => mapInviteItem(item, 'pending')) : []
  rejectedUsers.value = rejectedRes.status === 'fulfilled' ? rejectedRes.value.map((item) => mapInviteItem(item, 'rejected')) : []
  approvedUsers.value = approvedRes.status === 'fulfilled' ? approvedRes.value.map(mapFriendItem) : []
  const firstError = [pendingRes, rejectedRes, approvedRes].find((item) => item.status === 'rejected')
  if (firstError && firstError.status === 'rejected') {
    showError(firstError.reason, uni.$t('加载失败'), { 201: uni.$t('用户不存在') })
  }
}

onShow(() => {
  refresh()
})

const canAdd = computed(() => !!String(email.value || '').trim())

const items = computed(() => {
  if (active.value === 'approved') return approvedUsers.value
  if (active.value === 'rejected') return rejectedUsers.value
  return pendingUsers.value
})

async function add() {
  if (!canAdd.value || submitting.value) return
  submitting.value = true
  try {
    await usersApi.inviteNewFriend({ inviteeEmail: String(email.value || '').trim() })
    email.value = ''
    active.value = 'pending'
    uni.showToast({ title: uni.$t('邀请已发送'), icon: 'none' })
    await refresh()
  } catch (e) {
    showError(e, uni.$t('邀请失败'), {
      201: uni.$t('用户不存在'),
      202: uni.$t('被邀请用户不存在'),
      203: uni.$t('邀请提交失败'),
    })
  } finally {
    submitting.value = false
  }
}

async function share() {
  if (submitting.value) return
  submitting.value = true
  try {
    const payload = await usersApi.getInviteNewFriendsLink()
    const code = String(payload && payload.code ? payload.code : '').trim()
    const link = String(payload && payload.link ? payload.link : '').trim()
    const shareText = link || code
    if (!shareText) {
      uni.showToast({ title: '未获取到邀请码', icon: 'none' })
      return
    }
    uni.setClipboardData({ data: shareText })
  } catch (e) {
    showError(e, '获取邀请码失败', {
      201: uni.$t('用户不存在'),
      202: '获取邀请码失败',
    })
  } finally {
    submitting.value = false
  }
}

async function handleInviteCode(code) {
  const inviteCode = String(code || '').trim()
  if (!inviteCode || submitting.value) return
  submitting.value = true
  try {
    await usersApi.addNewFriendsByLink({ code: inviteCode })
    active.value = 'pending'
    uni.showToast({ title: '已通过邀请链接提交好友申请', icon: 'none' })
    await refresh()
    inviteCodeFromRoute.value = ''
  } catch (e) {
    showError(e, '通过邀请链接添加失败', {
      201: uni.$t('用户不存在'),
      202: '邀请码无效',
      203: '好友申请提交失败',
    })
  } finally {
    submitting.value = false
  }
}

async function approve(item) {
  if (!item || !item.inviterEmail || submitting.value) return
  submitting.value = true
  try {
    await usersApi.agreeAddFriend({ inviterEmail: item.inviterEmail })
    uni.showToast({ title: uni.$t('已通过'), icon: 'none' })
    await refresh()
  } catch (e) {
    showError(e, uni.$t('添加失败'), {
      201: uni.$t('用户不存在'),
      202: uni.$t('添加失败'),
    })
  } finally {
    submitting.value = false
  }
}

async function reject(item) {
  if (!item || !item.inviterEmail || submitting.value) return
  submitting.value = true
  try {
    await usersApi.refuseAddFriend({ inviterEmail: item.inviterEmail })
    uni.showToast({ title: uni.$t('已拒绝'), icon: 'none' })
    await refresh()
  } catch (e) {
    showError(e, uni.$t('拒绝失败'), {
      201: uni.$t('用户不存在'),
      202: uni.$t('拒绝失败'),
    })
  } finally {
    submitting.value = false
  }
}

const permissionOpen = ref(false)
const permissionUserId = ref('')
const permissionDraft = ref('self')

function openPermission(u) {
  permissionUserId.value = String(u.id || '')
  permissionDraft.value = u.permission || 'self'
  permissionOpen.value = true
}

async function confirmPermission() {
  if (!permissionUserId.value || submitting.value) return
  submitting.value = true
  try {
    await usersApi.setFriendAuthority({
      friendEmail: permissionUserId.value,
      authority: usersApi.authorityFromPermission(permissionDraft.value),
    })
    permissionOpen.value = false
    uni.showToast({ title: uni.$t('已更新'), icon: 'none' })
    await refresh()
  } catch (e) {
    showError(e, uni.$t('设置失败'), {
      201: uni.$t('用户不存在'),
      202: uni.$t('设置失败'),
    })
  } finally {
    submitting.value = false
  }
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
  font-size: 32rpx;
  font-weight: 600;
  color: #333333;
}

.method {
  display: block;
  margin-top: 16rpx;
  font-size: 30rpx;
  font-weight: 600;
  color: #666666;
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
  height: 96rpx;
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

.status-text {
  font-size: 24rpx;
  font-weight: 800;
  color: #3d6afb;
}

.status-text.is-muted {
  color: rgba(17, 17, 17, 0.42);
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
