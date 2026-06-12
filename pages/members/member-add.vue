<template>
  <view class="bl-page add-page">
    <BlHeader :title="isEdit ? '编辑' : '添加'" back>
      <template #right>
        <view v-if="isEdit" class="top-trash" @click="onDelete">
          <image class="top-trash-img" src="/static/calendar/icon_trash.png" mode="aspectFit" />
        </view>
        <view v-else class="top-save" @click="save">
          <text class="top-save-text">保存</text>
        </view>
      </template>
    </BlHeader>

    <view class="hero">
      <view class="avatar-wrap">
        <BlAvatar :glyph="glyphPreview" :src="avatarUrl" :color="color" :size="168" />
        <image class="cam-img" src="/static/calendar/icon_camera.png" mode="aspectFit" @click.stop="pickAvatar" />
      </view>
    </view>

    <view class="block input-block">
      <view class="input-wrap">
        <input v-model="name" class="input" placeholder="请输入名称" placeholder-class="ph" />
        <view v-if="name" class="clear-btn" @click="name = ''">
          <image class="clear-img" src="/static/calendar/icon_close.png" mode="aspectFit" />
        </view>
      </view>
    </view>

    <view class="block color-block">
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

    <BlSheet v-model="deleteSheetOpen" :headless="true" title="" :confirm-text="''">
      <view class="action-list">
        <view class="action-item" @click="reassignAndDelete">
          <text class="action-text">删除并重新分配</text>
        </view>
        <view class="action-item danger" @click="confirmDeleteAll">
          <text class="action-text">删除全部</text>
        </view>
        <view class="action-cancel" @click="deleteSheetOpen = false">
          <text class="action-cancel-text">取消</text>
        </view>
      </view>
    </BlSheet>
  </view>
</template>

<script setup>
import { onLoad } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'
import BlAvatar from '../../components/BlAvatar.vue'
import BlHeader from '../../components/BlHeader.vue'
import BlSheet from '../../components/BlSheet.vue'
import { addMember, deleteEventsByMember, deleteMember, ensureCalendarState, findMember, setMembers, updateMember } from '../../utils/calendarStore'
import { ensureTaskState } from '../../utils/taskStore'
import { deleteTasksByMember } from '../../utils/taskStore'
import { ensureRewardState } from '../../utils/rewardStore'
import { deleteRewardsByMember } from '../../utils/rewardStore'
import { membersApi } from '../../utils/api'

const state = ref(ensureCalendarState())
const isEdit = ref(false)
const memberId = ref('')
const name = ref('')
const color = ref('#ffb020')
const avatarUrl = ref('')
const deleteSheetOpen = ref(false)
const memberGroup = ref('member')

const palette = membersApi.MEMBER_COLOR_PALETTE

const glyphPreview = computed(() => {
  const n = String(name.value || '').trim()
  if (!n) return ''
  return n.length >= 2 ? n.slice(-2, -1) : n.slice(0, 1)
})

function glyphFromName(n) {
  const s = String(n || '').trim()
  if (!s) return ''
  return s.length >= 2 ? s.slice(-2, -1) : s.slice(0, 1)
}

async function syncRemoteMembers() {
  const logged = !!uni.getStorageSync('auth_logged_in')
  if (!logged) return false
  const list = await membersApi.getMemberList()
  const mapped = (list || []).map((m) => {
    const type = Number(m && m.memberType)
    return {
      id: String(m && m.memberId ? m.memberId : ''),
      name: m && m.memberName ? String(m.memberName) : '',
      glyph: glyphFromName(m && m.memberName),
      color: membersApi.memberHexFromColorIndex(m && m.memberColor),
      enabled: true,
      group: type === 1 ? 'calendarColor' : 'member',
      avatarUrl: m && m.avatarUrl ? String(m.avatarUrl) : '',
    }
  })
  setMembers(state.value, mapped.filter((x) => x && x.id))
  state.value = ensureCalendarState()
  return true
}

onLoad((options) => {
  const id = options && options.id ? String(options.id) : ''
  if (!id) return
  state.value = ensureCalendarState()
  const m = findMember(state.value, id)
  if (!m) {
    uni.showToast({ title: '成员不存在', icon: 'none' })
    uni.navigateBack()
    return
  }
  isEdit.value = true
  memberId.value = id
  name.value = m.name || ''
  color.value = m.color || color.value
  avatarUrl.value = m.avatarUrl || ''
  memberGroup.value = m.group === 'calendarColor' ? 'calendarColor' : 'member'
})

function chooseAvatar() {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      const p = res && res.tempFilePaths && res.tempFilePaths[0] ? String(res.tempFilePaths[0]) : ''
      if (!p) return
      if (typeof uni?.saveFile !== 'function') {
        avatarUrl.value = p
        return
      }
      uni.saveFile({
        tempFilePath: p,
        success: (r) => {
          avatarUrl.value = r && r.savedFilePath ? String(r.savedFilePath) : p
        },
        fail: () => {
          avatarUrl.value = p
        },
      })
    },
  })
}

function pickAvatar() {
  if (!avatarUrl.value) {
    chooseAvatar()
    return
  }
  uni.showActionSheet({
    itemList: ['选择照片', '移除照片'],
    success: (res) => {
      const tapIndex = res && typeof res.tapIndex === 'number' ? res.tapIndex : -1
      if (tapIndex === 0) {
        chooseAvatar()
        return
      }
      if (tapIndex === 1) {
        avatarUrl.value = ''
      }
    },
  })
}

async function save() {
  const n = String(name.value || '').trim()
  if (!n) {
    uni.showToast({ title: '请输入名称', icon: 'none' })
    return
  }
  const logged = !!uni.getStorageSync('auth_logged_in')
  const memberType = memberGroup.value === 'calendarColor' ? 1 : 0
  const memberColor = membersApi.memberColorIndexOf(color.value)

  if (isEdit.value) {
    if (logged) {
      uni.showLoading({ title: '保存中' })
      try {
        const res = await membersApi.updateMemberInfo({
          memberId: memberId.value,
          memberName: n,
          memberType,
          memberColor,
        })
        if (res && typeof res === 'object' && res.code !== undefined && res.code !== 200 && res.code !== '200') {
          uni.showToast({ title: '保存失败', icon: 'none' })
          return
        }
        try {
          await syncRemoteMembers()
        } catch (e) {}
      } catch (e) {
        uni.showToast({ title: String((e && e.message) || '保存失败'), icon: 'none' })
        return
      } finally {
        try {
          uni.hideLoading()
        } catch (e) {}
      }
    } else {
      updateMember(state.value, memberId.value, { name: n, color: color.value, avatarUrl: avatarUrl.value })
    }
    uni.$emit && uni.$emit('calendar:refresh')
    uni.$emit && uni.$emit('task:refresh')
    uni.$emit && uni.$emit('reward:refresh')
    uni.navigateBack()
    return
  }

  if (logged) {
    uni.showLoading({ title: '保存中' })
    try {
      const res = await membersApi.addMemberInfo({
        memberName: n,
        memberType,
        memberColor,
      })
      if (res && typeof res === 'object' && res.code !== undefined && res.code !== 200 && res.code !== '200') {
        uni.showToast({ title: '保存失败', icon: 'none' })
        return
      }
      try {
        await syncRemoteMembers()
      } catch (e) {}
    } catch (e) {
      uni.showToast({ title: String((e && e.message) || '保存失败'), icon: 'none' })
      return
    } finally {
      try {
        uni.hideLoading()
      } catch (e) {}
    }
  } else {
    const m = addMember(state.value, { name: n, color: color.value, avatarUrl: avatarUrl.value })
    if (!m) {
      uni.showToast({ title: '请输入名称', icon: 'none' })
      return
    }
  }
  uni.$emit && uni.$emit('calendar:refresh')
  uni.$emit && uni.$emit('task:refresh')
  uni.$emit && uni.$emit('reward:refresh')
  uni.navigateBack()
}

async function deleteAll() {
  const logged = !!uni.getStorageSync('auth_logged_in')
  if (logged) {
    uni.showLoading({ title: '删除中' })
    try {
      const res = await membersApi.deleteMemberInfo({ memberId: memberId.value })
      if (res && typeof res === 'object' && res.code !== undefined && res.code !== 200 && res.code !== '200') {
        uni.showToast({ title: '删除失败', icon: 'none' })
        return
      }
      try {
        await syncRemoteMembers()
      } catch (e) {}
    } catch (e) {
      uni.showToast({ title: String((e && e.message) || '删除失败'), icon: 'none' })
      return
    } finally {
      try {
        uni.hideLoading()
      } catch (e) {}
    }
  }

  deleteEventsByMember(state.value, memberId.value)
  deleteMember(state.value, memberId.value)

  const taskState = ensureTaskState()
  deleteTasksByMember(taskState, memberId.value)

  const rewardState = ensureRewardState()
  deleteRewardsByMember(rewardState, memberId.value)

  uni.$emit && uni.$emit('calendar:refresh')
  uni.$emit && uni.$emit('task:refresh')
  uni.$emit && uni.$emit('reward:refresh')
  uni.navigateBack()
}

function onDelete() {
  if (!isEdit.value) return
  deleteSheetOpen.value = true
}

function reassignAndDelete() {
  deleteSheetOpen.value = false
  uni.navigateTo({ url: `/pages/members/members-select?mode=reassign&fromId=${encodeURIComponent(memberId.value)}` })
}

function confirmDeleteAll() {
  deleteSheetOpen.value = false
  uni.showModal({
    title: '你确定吗？',
    content: '该成员相关的事件、任务和奖惩将被删除，删除后不可撤销。',
    confirmText: '是的，我确定',
    cancelText: '取消',
    success: (r) => {
      if (r && r.confirm) deleteAll()
    },
  })
}
</script>

<style scoped lang="scss">
.add-page {
  padding-bottom: 240rpx;
  background: #ffffff;
  min-height: 100vh;
}

.top-trash {
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 12rpx;
}

.top-trash-img {
  width: 42rpx;
  height: 42rpx;
  display: block;
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

.cam-img {
  position: absolute;
  right: 10rpx;
  bottom: 10rpx;
  width: 72rpx;
  height: 72rpx;
  display: block;
}

.block {
  background: #fafafa;
  border-radius: 28rpx;
  padding: 20rpx 22rpx;
  margin-top: 18rpx;
  border: 2rpx solid rgba(17, 17, 17, 0.04);
}

.input-block {
  background: transparent;
  border: 0;
  padding: 0;
}

.input-wrap {
  height: 96rpx;
  border-radius: 24rpx;
  background: #fafafa;
  border: 2rpx solid rgba(17, 17, 17, 0.06);
  padding: 0 18rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.input {
  width: 100%;
  font-size: 34rpx;
  font-weight: 900;
  color: #111111;
}

.clear-btn {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.clear-img {
  width: 34rpx;
  height: 34rpx;
  display: block;
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

.action-list {
  padding: 6rpx 0 10rpx;
}

.action-item {
  height: 92rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-text {
  font-size: 32rpx;
  font-weight: 900;
  color: #111111;
}

.action-item.danger .action-text {
  color: #ff3b30;
}

.action-cancel {
  margin-top: 18rpx;
  height: 92rpx;
  border-radius: 999rpx;
  background: rgba(17, 17, 17, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-cancel-text {
  font-size: 32rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.8);
}
</style>
