<template>
  <view class="bl-page select-page">
    <BlHeader :title="isReassign ? '重新分配事件' : '选择成员'" back>
      <template v-if="!isReassign" #right>
        <view class="add-btn" @click="goAdd">
          <image class="add-img" src="/static/calendar/icon_plus_circle.png" mode="aspectFit" />
        </view>
      </template>
    </BlHeader>

    <view v-if="isReassign" class="reassign-top" @click="goAddEvent">
      <text class="reassign-top-plus">+</text>
      <text class="reassign-top-text">添加事项</text>
    </view>

    <view v-if="isReassign" class="reassign-hint">
      <text class="reassign-hint-text">将 {{ fromName }} 的事件重新分配到</text>
    </view>

    <view v-else class="hint">
      <text class="hint-title">成员</text>
      <text class="hint-sub bl-muted">为家庭中的每位成员分配各自的颜色</text>
    </view>

    <view class="list">
      <view v-for="m in members" :key="m.id" class="item" @click="onPick(m.id)">
        <view class="left">
          <BlAvatar :glyph="m.glyph" :src="m.avatarUrl" :color="m.color" :size="48" />
          <text class="name">{{ m.name }}</text>
        </view>
        <view class="right">
          <image
            class="sel-img"
            :src="
              isReassign
                ? pickedId === m.id
                  ? '/static/common/icon_checkbox_checked.png'
                  : '/static/common/icon_radio_off.png'
                : selectedIds.includes(m.id)
                  ? '/static/common/icon_checkbox_checked.png'
                  : '/static/common/icon_radio_off.png'
            "
            mode="aspectFit"
          />
        </view>
      </view>
    </view>

    <view v-if="isReassign" class="bottom-danger" @click="confirmReassignDelete">
      <text class="bottom-danger-text">删除并重新分配</text>
    </view>
    <view v-else class="bottom-save" @click="save">
      <image class="bottom-save-bg" src="/static/calendar/btn_primary_gradient.png" mode="scaleToFill" />
      <text class="bottom-save-text">保存</text>
    </view>
  </view>
</template>

<script setup>
import { onLoad, onShow } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'
import BlAvatar from '../../components/BlAvatar.vue'
import BlHeader from '../../components/BlHeader.vue'
import { deleteMember, ensureCalendarState, findMember, listMembers, reassignEventsByMember, setMembers, updateEvent } from '../../utils/calendarStore'
import { ensureTaskState, reassignTasksByMember } from '../../utils/taskStore'
import { ensureRewardState, reassignRewardsByMember } from '../../utils/rewardStore'
import { membersApi } from '../../utils/api'

const state = ref(ensureCalendarState())
const members = ref([])
const selectedIds = ref([])
const eventId = ref('')
const mode = ref('')
const fromId = ref('')
const pickedId = ref('')

const isReassign = computed(() => mode.value === 'reassign')
const fromName = computed(() => {
  const m = fromId.value ? findMember(state.value, fromId.value) : null
  return m && m.name ? m.name : '该成员'
})

function glyphFromName(name) {
  const n = String(name || '').trim()
  if (!n) return ''
  return n.length >= 2 ? n.slice(-2, -1) : n.slice(0, 1)
}

async function syncRemoteMembers() {
  const logged = !!uni.getStorageSync('auth_logged_in')
  if (!logged) return false
  uni.showLoading({ title: '加载中' })
  try {
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
    return true
  } catch (e) {
    return false
  } finally {
    try {
      uni.hideLoading()
    } catch (e) {}
  }
}

function refresh() {
  state.value = ensureCalendarState()
  const list = listMembers(state.value)
  if (isReassign.value) {
    members.value = list.filter((m) => m && m.id !== fromId.value)
    if (!pickedId.value && members.value.length) pickedId.value = String(members.value[0].id)
    return
  }
  members.value = list.filter((m) => m.enabled !== false)
}

onLoad((options) => {
  mode.value = options && options.mode ? String(options.mode) : ''
  fromId.value = options && options.fromId ? String(options.fromId) : ''
  eventId.value = options && options.eventId ? String(options.eventId) : ''
  const idsRaw = options && options.ids ? String(options.ids) : '[]'
  try {
    selectedIds.value = JSON.parse(decodeURIComponent(idsRaw))
  } catch (e) {
    selectedIds.value = []
  }
  ;(async () => {
    await syncRemoteMembers()
    refresh()
  })()
})

onShow(() => {
  ;(async () => {
    await syncRemoteMembers()
    refresh()
  })()
})

function onPick(id) {
  if (isReassign.value) {
    pickedId.value = String(id)
    return
  }
  const idx = selectedIds.value.indexOf(id)
  if (idx >= 0) {
    selectedIds.value.splice(idx, 1)
  } else {
    selectedIds.value.push(id)
  }
}

function save() {
  const ids = selectedIds.value.slice()
  if (eventId.value) {
    updateEvent(state.value, eventId.value, { memberIds: ids })
    uni.$emit && uni.$emit('calendar:refresh')
    uni.navigateBack()
    return
  }
  uni.setStorageSync('calendar_member_select_tmp', JSON.stringify(ids))
  uni.navigateBack()
}

function goAdd() {
  uni.navigateTo({ url: '/pages/members/member-add' })
}

function goAddEvent() {
  uni.navigateTo({ url: '/pages/calendar/event-form' })
}

async function doReassignDelete() {
  const toId = pickedId.value
  if (!fromId.value || !toId) return

  const logged = !!uni.getStorageSync('auth_logged_in')
  if (logged) {
    uni.showLoading({ title: '删除中' })
    try {
      const res = await membersApi.deleteMemberInfo({ memberId: fromId.value })
      if (res && typeof res === 'object' && res.code !== undefined && res.code !== 200 && res.code !== '200') {
        uni.showToast({ title: '删除失败', icon: 'none' })
        return
      }
    } catch (e) {
      uni.showToast({ title: String((e && e.message) || '删除失败'), icon: 'none' })
      return
    } finally {
      try {
        uni.hideLoading()
      } catch (e) {}
    }
  }

  state.value = ensureCalendarState()
  reassignEventsByMember(state.value, fromId.value, toId)
  deleteMember(state.value, fromId.value)

  const taskState = ensureTaskState()
  reassignTasksByMember(taskState, fromId.value, toId)

  const rewardState = ensureRewardState()
  reassignRewardsByMember(rewardState, fromId.value, toId)

  uni.$emit && uni.$emit('calendar:refresh')
  uni.$emit && uni.$emit('task:refresh')
  uni.$emit && uni.$emit('reward:refresh')
  uni.navigateBack({ delta: 2 })
}

function confirmReassignDelete() {
  if (!pickedId.value) {
    uni.showToast({ title: '请选择成员', icon: 'none' })
    return
  }
  const to = findMember(state.value, pickedId.value)
  const toName = to && to.name ? to.name : '该成员'
  uni.showModal({
    title: '你确定吗？',
    content: `事件、任务和奖惩将重新分配给${toName}，并删除${fromName.value}。关联的日历不会被删除。删除后不可撤销！`,
    confirmText: '是的，我确定',
    cancelText: '取消',
    success: (r) => {
      if (r && r.confirm) doReassignDelete()
    },
  })
}
</script>

<style scoped lang="scss">
.select-page {
  padding-bottom: 240rpx;
  background: #ffffff;
  min-height: 100vh;
}

.reassign-top {
  margin-top: 18rpx;
  height: 98rpx;
  border-radius: 26rpx;
  background: #EDF3FF;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14rpx;
}

.reassign-top-plus {
  font-size: 40rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.9);
}

.reassign-top-text {
  font-size: 32rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.9);
}

.reassign-hint {
  margin-top: 16rpx;
}

.reassign-hint-text {
  font-size: 26rpx;
  font-weight: 700;
  color: rgba(17, 17, 17, 0.55);
}

.add-btn {
  width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-img {
  width: 54rpx;
  height: 54rpx;
  display: block;
}

.hint {
  margin-top: 8rpx;
}

.hint-title {
  font-size: 40rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.95);
}

.hint-sub {
  margin-top: 10rpx;
  display: block;
  font-size: 26rpx;
  font-weight: 700;
}

.list {
  margin-top: 16rpx;
}

.item {
  height: 108rpx;
  background: #fafafa;
  border-radius: 24rpx;
  padding: 0 22rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.item + .item {
  margin-top: 16rpx;
}

.left {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.name {
  font-size: 28rpx;
  font-weight: 500;
  color: #333333;
}

.right {
  width: 64rpx;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.sel-img {
  width: 36rpx;
  height: 36rpx;
  display: block;
}

.bottom-danger {
  position: fixed;
  left: 28rpx;
  right: 28rpx;
  bottom: 34rpx;
  height: 104rpx;
  background: #ff3b30;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bottom-danger-text {
  color: #ffffff;
  font-size: 34rpx;
  font-weight: 900;
}

.bottom-save {
  position: fixed;
  left: 28rpx;
  right: 28rpx;
  bottom: 34rpx;
  height: 104rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.bottom-save-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.bottom-save-text {
  position: relative;
  color: #ffffff;
  font-size: 34rpx;
  font-weight: 900;
}
</style>
