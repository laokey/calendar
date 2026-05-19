<template>
  <view class="bl-page form-page">
    <BlHeader title="添加奖励" back back-icon-src="/static/reward/icon_nav_back_small.png">
      <template #right>
        <view class="top-save" @click="save">
          <text class="top-save-text">保存</text>
        </view>
      </template>
    </BlHeader>

    <view class="block">
      <view class="field-title">
        <text class="req">*</text>
        <text>标题</text>
      </view>
      <view class="input-wrap">
        <input v-model="title" class="input" placeholder="请输入标题" placeholder-class="ph" />
      </view>
    </view>

    <view class="block row-between" @click="emojiSheetOpen = true">
      <view class="row-left">
        <image class="field-icon" src="/static/reward/icon_smiley.png" mode="aspectFit" />
        <text class="label">表情符号(可选)</text>
      </view>
      <text class="chev">˅</text>
    </view>

    <view class="block row-between">
      <view class="row-left">
        <image class="field-icon" src="/static/reward/icon_power.png" mode="aspectFit" />
        <text class="label">兑换后重置</text>
      </view>
      <switch :checked="resetAfter" color="#3d6afb" @change="resetAfter = !!$event.detail.value" />
    </view>

    <view class="block">
      <view class="field-title">
        <text class="req">*</text>
        <text>心心</text>
      </view>
      <view class="input-wrap">
        <input v-model="hearts" class="input" type="number" placeholder="请输入心心数量" placeholder-class="ph" />
      </view>
    </view>

    <view v-if="tipOpen" class="tip">
      <text class="tip-text">请输入兑换该奖励所需收集的心心数量。完成任务可赚取心心。</text>
      <view class="tip-close" @click="tipOpen = false">
        <image class="tip-close-img" src="/static/reward/icon_close_x.png" mode="aspectFit" />
      </view>
    </view>

    <view class="block">
      <view class="field-title">
        <text class="req">*</text>
        <text>选择成员</text>
      </view>
      <view class="members">
        <view v-for="m in memberItems" :key="m.id" class="mem" @click="memberId = m.id">
          <BlAvatar :glyph="m.glyph" :src="m.avatarUrl" :color="m.color" :size="72" />
          <view v-if="memberId === m.id" class="mem-check"><text class="check">✓</text></view>
          <text class="mem-name">{{ m.name }}</text>
        </view>
        <view class="mem add" @click="goAddMember">
          <view class="add-circle"><text class="add-plus">+</text></view>
          <text class="mem-name">添加</text>
        </view>
      </view>
    </view>

    <view class="block">
      <view class="field-title row-between">
        <view class="row-left">
          <text class="req">*</text>
          <text>类型</text>
        </view>
        <view class="q" @click="infoOpen = true"><text class="q-text">?</text></view>
      </view>
      <view class="type">
        <view class="type-pill" :class="{ on: type === 'reward' }" @click="type = 'reward'">
          <text class="type-text">奖励</text>
        </view>
        <view class="type-pill punish" :class="{ on: type === 'punish' }" @click="type = 'punish'">
          <text class="type-text">惩罚</text>
        </view>
      </view>
    </view>

    <view class="block">
      <view class="row-left">
        <image class="field-icon" src="/static/reward/icon_title_t.png" mode="aspectFit" />
        <text class="label">描述</text>
      </view>
      <view class="input-wrap is-textarea">
        <textarea v-model="desc" class="textarea" placeholder="请输入描述" placeholder-class="ph" />
      </view>
    </view>

    <view class="bottom-save" @click="save">
      <text class="bottom-save-text">保存</text>
    </view>

    <BlSheet v-model="emojiSheetOpen" title="选择表情" :confirm-text="''">
      <view class="emoji-grid">
        <view v-for="e in emojiOptions" :key="e" class="emoji-item" @click="selectEmoji(e)">
          <text class="emoji-text">{{ e }}</text>
        </view>
        <view class="emoji-item clear" @click="selectEmoji('')">
          <text class="emoji-text">清除</text>
        </view>
      </view>
      <view class="sheet-cancel" @click="emojiSheetOpen = false"><text class="sheet-cancel-text">取消</text></view>
    </BlSheet>

    <BlSheet v-model="infoOpen" title="" :confirm-text="''">
      <view class="info">
        <view class="info-head">
          <text class="info-title">奖励与惩罚说明</text>
            <view class="info-x" @click="infoOpen = false">
              <image class="info-x-img" src="/static/reward/icon_close.png" mode="aspectFit" />
            </view>
        </view>
        <text class="info-text">
          健康成长不仅需要掌声，也需要温柔的提醒。现在除了用心心兑换奖励，您还可以通过“行为约定”，让孩子直观地看到不当行为带来的后果与惩罚。
        </text>
        <text class="info-subtitle">奖励与惩罚</text>
        <text class="info-text">1.无论是兑换奖励还是接受惩罚，均需扣减心心。</text>
        <text class="info-text">2.区别在于：兑换奖励时，需确保心心数量充足才可兑换；而惩罚扣减不受心心数量限制，以便心力不足也会执行扣减。</text>
        <view class="info-btn" @click="infoOpen = false"><text class="info-btn-text">立即体验</text></view>
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
import { ensureCalendarState, listMembers } from '../../utils/calendarStore'
import { addRewardItem, ensureRewardState, findRewardItem, updateRewardItem } from '../../utils/rewardStore'

const calendarState = ref(ensureCalendarState())
const rewardState = ref(ensureRewardState())

const itemId = ref('')

const title = ref('')
const emoji = ref('')
const resetAfter = ref(false)
const hearts = ref('10')
const memberId = ref('me')
const type = ref('reward')
const desc = ref('')

const tipOpen = ref(true)
const emojiSheetOpen = ref(false)
const infoOpen = ref(false)

const emojiOptions = ['跑', '力', '书', '星', '笑', '家', '球', '心', '乐', '奖', '黑', '白']

function refresh() {
  calendarState.value = ensureCalendarState()
  rewardState.value = ensureRewardState()
}

onShow(() => refresh())

const memberItems = computed(() => {
  const base = [{ id: 'me', name: '我的', glyph: '我', color: '#4cc38a' }]
  return [...base, ...listMembers(calendarState.value).filter((m) => m.enabled !== false)]
})

onLoad((options) => {
  refresh()
  const id = options && options.id ? String(options.id) : ''
  const t = options && options.type ? String(options.type) : ''
  const mid = options && options.memberId ? String(options.memberId) : ''

  if (mid) memberId.value = mid
  if (t) type.value = t === 'punish' ? 'punish' : 'reward'

  if (!id) return
  itemId.value = id
  const it = findRewardItem(rewardState.value, id)
  if (!it) return
  title.value = it.title || ''
  emoji.value = it.emoji || ''
  resetAfter.value = !!it.resetAfter
  hearts.value = String(it.hearts || 0)
  memberId.value = it.memberId || memberId.value
  type.value = it.type === 'punish' ? 'punish' : 'reward'
  desc.value = it.desc || ''
})

function selectEmoji(e) {
  emoji.value = e
  emojiSheetOpen.value = false
}

function goAddMember() {
  uni.navigateTo({ url: '/pages/calendar/member-add' })
}

function validate() {
  if (!String(title.value || '').trim()) {
    uni.showToast({ title: '请输入标题', icon: 'none' })
    return false
  }
  const n = Number(hearts.value || 0) || 0
  if (n <= 0) {
    uni.showToast({ title: '请输入心心', icon: 'none' })
    return false
  }
  if (!memberId.value) {
    uni.showToast({ title: '请选择成员', icon: 'none' })
    return false
  }
  return true
}

function save() {
  if (!validate()) return
  const payload = {
    title: title.value,
    emoji: emoji.value,
    resetAfter: resetAfter.value,
    hearts: Number(hearts.value || 0) || 0,
    memberId: memberId.value,
    type: type.value,
    desc: desc.value,
  }

  if (itemId.value) {
    updateRewardItem(rewardState.value, itemId.value, payload)
  } else {
    addRewardItem(rewardState.value, payload)
  }
  uni.$emit && uni.$emit('reward:refresh')
  uni.navigateBack()
}
</script>

<style scoped lang="scss">
.form-page {
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

.block {
  background: #ffffff;
  border-radius: 28rpx;
  padding: 20rpx 22rpx;
  margin-top: 16rpx;
  box-shadow: 0 10rpx 26rpx rgba(17, 17, 17, 0.06);
}

.field-title {
  display: flex;
  align-items: center;
  gap: 6rpx;
  font-size: 26rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.8);
  margin-bottom: 12rpx;
}

.req {
  color: #ff3b30;
}

.input-wrap {
  height: 96rpx;
  border-radius: 24rpx;
  background: rgba(17, 17, 17, 0.04);
  padding: 0 18rpx;
  display: flex;
  align-items: center;
}

.input-wrap.is-textarea {
  height: 140rpx;
  align-items: flex-start;
  padding-top: 16rpx;
}

.input {
  width: 100%;
  font-size: 34rpx;
  font-weight: 900;
  color: #111111;
}

.textarea {
  width: 100%;
  height: 110rpx;
  font-size: 30rpx;
  font-weight: 700;
  color: #111111;
}

.ph {
  color: rgba(17, 17, 17, 0.35);
}

.row-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.row-left {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.label {
  font-size: 30rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.88);
}

.chev {
  font-size: 34rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.4);
}

.field-icon {
  width: 28rpx;
  height: 28rpx;
  flex-shrink: 0;
  display: block;
}

.tip {
  margin-top: 14rpx;
  background: #eaf2ff;
  border-radius: 18rpx;
  padding: 18rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
}

.tip-text {
  flex: 1;
  font-size: 26rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.75);
  line-height: 1.3;
}

.tip-close {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.tip-close-img {
  width: 28rpx;
  height: 28rpx;
  display: block;
}

.members {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
  padding-top: 10rpx;
}

.mem {
  width: 116rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.mem-check {
  position: absolute;
  top: 44rpx;
  right: 16rpx;
  width: 26rpx;
  height: 26rpx;
  border-radius: 999rpx;
  background: #2ecc71;
  display: flex;
  align-items: center;
  justify-content: center;
}

.check {
  font-size: 18rpx;
  font-weight: 900;
  color: #ffffff;
}

.mem-name {
  margin-top: 10rpx;
  font-size: 24rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.75);
}

.mem.add .mem-name {
  color: rgba(17, 17, 17, 0.55);
}

.add-circle {
  width: 72rpx;
  height: 72rpx;
  border-radius: 999rpx;
  background: rgba(17, 17, 17, 0.04);
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-plus {
  font-size: 40rpx;
  font-weight: 700;
  color: rgba(17, 17, 17, 0.6);
}

.type {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.type-pill {
  flex: 1;
  height: 74rpx;
  border-radius: 999rpx;
  background: rgba(17, 17, 17, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
}

.type-pill.on {
  background: #3d6afb;
}

.type-pill.punish.on {
  background: #ff3b30;
}

.type-text {
  font-size: 30rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.8);
}

.type-pill.on .type-text {
  color: #ffffff;
}

.q {
  width: 50rpx;
  height: 50rpx;
  border-radius: 999rpx;
  background: rgba(17, 17, 17, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
}

.q-text {
  font-size: 28rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.55);
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

.emoji-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 18rpx;
  padding: 10rpx 0 0;
}

.emoji-item {
  width: 150rpx;
  height: 80rpx;
  border-radius: 20rpx;
  background: rgba(17, 17, 17, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
}

.emoji-item.clear {
  background: rgba(61, 106, 251, 0.12);
}

.emoji-text {
  font-size: 28rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.75);
}

.sheet-cancel {
  margin-top: 18rpx;
  height: 92rpx;
  border-radius: 999rpx;
  background: rgba(17, 17, 17, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
}

.sheet-cancel-text {
  font-size: 32rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.8);
}

.info {
  padding: 10rpx 0 10rpx;
}

.info-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.info-title {
  font-size: 34rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.95);
}

.info-x {
  width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.info-x-img {
  width: 28rpx;
  height: 28rpx;
  display: block;
}

.info-subtitle {
  margin-top: 18rpx;
  display: block;
  font-size: 30rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.9);
}

.info-text {
  margin-top: 14rpx;
  display: block;
  font-size: 26rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.75);
  line-height: 1.4;
}

.info-btn {
  margin-top: 20rpx;
  height: 96rpx;
  border-radius: 999rpx;
  background: #3d6afb;
  display: flex;
  align-items: center;
  justify-content: center;
}

.info-btn-text {
  color: #ffffff;
  font-size: 34rpx;
  font-weight: 900;
}
</style>
