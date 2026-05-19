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

    <view class="block">
      <view class="input-wrap">
        <input v-model="name" class="input" placeholder="请输入名称" placeholder-class="ph" />
        <view v-if="name" class="clear-btn" @click="name = ''">
          <image class="clear-img" src="/static/calendar/icon_close.png" mode="aspectFit" />
        </view>
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
import { onLoad } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'
import BlAvatar from '../../components/BlAvatar.vue'
import BlHeader from '../../components/BlHeader.vue'
import { addMember, deleteEventsByMember, deleteMember, ensureCalendarState, findMember, updateMember } from '../../utils/calendarStore'
import { ensureTaskState } from '../../utils/taskStore'
import { deleteTasksByMember } from '../../utils/taskStore'
import { ensureRewardState } from '../../utils/rewardStore'
import { deleteRewardsByMember } from '../../utils/rewardStore'

const state = ref(ensureCalendarState())
const isEdit = ref(false)
const memberId = ref('')
const name = ref('')
const color = ref('#ffb020')
const avatarUrl = ref('')

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

function save() {
  if (isEdit.value) {
    const n = String(name.value || '').trim()
    if (!n) {
      uni.showToast({ title: '请输入名称', icon: 'none' })
      return
    }
    updateMember(state.value, memberId.value, { name: n, color: color.value, avatarUrl: avatarUrl.value })
    uni.$emit && uni.$emit('calendar:refresh')
    uni.$emit && uni.$emit('task:refresh')
    uni.$emit && uni.$emit('reward:refresh')
    uni.navigateBack()
    return
  }

  const m = addMember(state.value, { name: name.value, color: color.value, avatarUrl: avatarUrl.value })
  if (!m) {
    uni.showToast({ title: '请输入名称', icon: 'none' })
    return
  }
  uni.$emit && uni.$emit('calendar:refresh')
  uni.$emit && uni.$emit('task:refresh')
  uni.$emit && uni.$emit('reward:refresh')
  uni.navigateBack()
}

function deleteAll() {
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
  uni.showActionSheet({
    itemList: ['删除并重新分配', '删除全部'],
    success: (res) => {
      const tapIndex = res && typeof res.tapIndex === 'number' ? res.tapIndex : -1
      if (tapIndex === 0) {
        uni.navigateTo({ url: `/pages/calendar/members-select?mode=reassign&fromId=${encodeURIComponent(memberId.value)}` })
        return
      }
      if (tapIndex === 1) {
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
    },
  })
}
</script>

<style scoped lang="scss">
.add-page {
  padding-bottom: 240rpx;
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
</style>
