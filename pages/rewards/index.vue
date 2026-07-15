<template>
  <view class="bl-page reward-page">
    <BlHeader title="奖励" back back-icon-src="/static/reward/icon_nav_back_small.png">
      <template #right>
        <view class="right">
          <view class="icon-btn" @click="goGive">
            <image class="top-icon" src="/static/reward/icon_give_hearts.png" mode="aspectFit" />
          </view>
          <view class="icon-btn" @click="goSettings">
            <image class="top-icon" src="/static/reward/icon_settings_list.png" mode="aspectFit" />
          </view>
        </view>
      </template>
    </BlHeader>

    <scroll-view scroll-x class="member-scroll" show-scrollbar="false">
      <view class="member-row">
        <view
          v-for="m in memberItems"
          :key="m.id"
          class="member"
          :class="{ active: m.id === activeMemberId }"
          @click="selectMember(m.id)"
        >
          <view class="ring" :style="{ borderColor: m.id === 'me' ? '#4cc38a' : m.color }">
            <BlAvatar :glyph="m.glyph" :src="m.avatarUrl" :color="m.id === 'me' ? '#4cc38a' : m.color" :size="92" />
          </view>
          <view class="member-hearts">
            <image class="heart-img" src="/static/reward/icon_heart_orange_small.png" mode="aspectFit" />
            <text class="member-hearts-text">{{ balance(m.id) }}</text>
          </view>
        </view>
      </view>
    </scroll-view>

    <view class="panel" :style="{ background: panelBackground }">
      <view class="panel-head">
        <view class="head-left">
          <BlAvatar :glyph="activeMember.glyph" :src="activeMember.avatarUrl" :color="activeMemberColor" :size="72" />
          <view class="head-meta">
            <text class="head-name">{{ activeMemberLabel }}</text>
          </view>
        </view>
        <view class="pill">
          <image class="heart-img" src="/static/reward/icon_heart_orange_small.png" mode="aspectFit" />
          <text class="pill-text">{{ balance(activeMemberId) }}</text>
        </view>
      </view>

      <scroll-view v-if="filteredItems.length" scroll-y class="panel-body" show-scrollbar="false">
        <view class="items">
          <view v-for="it in filteredItems" :key="it.id" class="item" @longpress="openActions(it)" @click="tryRedeem(it)">
            <view class="item-left">
              <view class="emoji">
                <image
                  v-if="!it.emoji"
                  class="emoji-heart"
                  :src="it.type === 'punish' ? '/static/reward/icon_heart_black.png' : '/static/reward/icon_heart_orange.png'"
                  mode="aspectFit"
                />
                <text v-else class="emoji-text">{{ it.emoji }}</text>
              </view>
              <view class="item-main">
                <text class="item-title">{{ it.title }}</text>
                <text v-if="it.type === 'punish'" class="item-sub bl-muted">{{ it.desc || '惩罚' }}</text>
              </view>
            </view>
            <view class="item-right">
              <view v-if="buttonMode(it) === 'today'" class="btn disabled">
                <text class="btn-text">{{ it.type === 'punish' ? '今天惩罚' : '今天奖励' }}</text>
              </view>
              <view v-else-if="buttonMode(it) === 'progress'" class="progress" :class="{ ready: canAfford(it) }">
                <view class="progress-fill" :style="{ width: progressWidth(it) }" />
                <view class="progress-text">
                  <image class="heart-img is-small" src="/static/reward/icon_heart_orange_small.png" mode="aspectFit" />
                  <text class="progress-label">{{ balance(activeMemberId) }}/{{ it.hearts }}</text>
                </view>
              </view>
              <view v-else class="btn" :class="{ punish: it.type === 'punish', disabled: it.type !== 'punish' && !canAfford(it) }">
                <template v-if="it.type !== 'punish'">
                  <text class="btn-text">兑换</text>
                  <image class="heart-img is-small" src="/static/reward/icon_heart_orange_small.png" mode="aspectFit" />
                  <text class="btn-text">+{{ it.hearts }}</text>
                </template>
                <template v-else>
                  <image class="heart-img is-small" src="/static/reward/icon_heart_black.png" mode="aspectFit" />
                  <text class="btn-text">-{{ it.hearts }}</text>
                </template>
              </view>
            </view>
          </view>
        </view>
      </scroll-view>

      <view v-else class="panel-empty">
        <view class="empty-illus">
          <image class="empty-img" src="/static/reward/illus_empty_rewards.png" mode="aspectFit" />
        </view>
        <text class="empty-text bl-muted">今天没有待完成的任务</text>
      </view>
    </view>

    <view class="fab" @click="addItem">
      <image class="fab-img" src="/static/reward/btn_add_pill.png" mode="aspectFit" />
    </view>

    <view v-if="celebrateOpen" class="celebrate">
      <image
        class="float-heart h1"
        :src="celebrateType === 'punish' ? '/static/reward/icon_heart_black.png' : '/static/reward/icon_heart_orange.png'"
        mode="aspectFit"
      />
      <image
        class="float-heart h2"
        :src="celebrateType === 'punish' ? '/static/reward/icon_heart_black.png' : '/static/reward/icon_heart_orange.png'"
        mode="aspectFit"
      />
      <image
        class="float-heart h3"
        :src="celebrateType === 'punish' ? '/static/reward/icon_heart_black.png' : '/static/reward/icon_heart_orange.png'"
        mode="aspectFit"
      />
      <image
        class="float-heart h4"
        :src="celebrateType === 'punish' ? '/static/reward/icon_heart_black.png' : '/static/reward/icon_heart_orange.png'"
        mode="aspectFit"
      />
      <image
        class="float-heart h5"
        :src="celebrateType === 'punish' ? '/static/reward/icon_heart_black.png' : '/static/reward/icon_heart_orange.png'"
        mode="aspectFit"
      />
    </view>

    <BlSheet v-model="resultSheetOpen" title="" :confirm-text="''">
      <view class="result">
        <text class="result-title">{{ celebrateType === 'punish' ? '受到惩罚！' : '奖励已发放！' }}</text>
        <text class="result-sub">
          {{ celebrateType === 'punish' ? '今天没有完成 ' : '今天已奖励 ' }}
          <text class="result-link">{{ celebrateTitle }}</text>
        </text>
        <view class="result-btn" :class="{ punish: celebrateType === 'punish' }" @click="closeResult">
          <text class="result-btn-text">确定</text>
        </view>
        <view class="result-cancel" @click="cancelAction">
          <text class="result-cancel-text">{{ celebrateType === 'punish' ? '取消惩罚' : '取消奖励' }}</text>
        </view>
      </view>
    </BlSheet>

    <BlSheet v-model="actionSheetOpen" title="" :confirm-text="''">
      <view class="action-list">
        <view class="action-item" @click="editItem"><text class="action-text">编辑</text></view>
        <view class="action-item danger" @click="deleteItem"><text class="action-text danger-text">删除</text></view>
        <view class="action-cancel" @click="actionSheetOpen = false"><text class="action-cancel-text">取消</text></view>
      </view>
    </BlSheet>
  </view>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import BlAvatar from '../../components/BlAvatar.vue'
import BlHeader from '../../components/BlHeader.vue'
import BlSheet from '../../components/BlSheet.vue'
import { ensureCalendarState, listMembers, setMembers } from '../../utils/calendarStore'
import { ensureRewardState, setRewardActiveMember } from '../../utils/rewardStore'
import { membersApi, rewardsApi } from '../../utils/api'

const calendarState = ref(ensureCalendarState())
const rewardState = ref(ensureRewardState())
const remoteRewards = ref([])
const memberBalanceMap = ref({})
const starRecords = ref([])
const loading = ref(false)

const activeMemberId = computed(() => String(rewardState.value.activeMemberId || ''))
const todayKey = computed(() => formatDateKey(new Date()))

const actionSheetOpen = ref(false)
const activeItemId = ref('')

const celebrateOpen = ref(false)
const resultSheetOpen = ref(false)
const celebrateType = ref('reward')
const celebrateTitle = ref('')
const celebrateItemId = ref('')
const pendingAction = ref(false)

function refreshLocalState() {
  calendarState.value = ensureCalendarState()
  rewardState.value = ensureRewardState()
}

async function syncRemoteMembers() {
  const logged = !!uni.getStorageSync('auth_logged_in')
  if (!logged) return false
  try {
    const list = await membersApi.getMemberList()
    setMembers(calendarState.value, membersApi.mapRemoteMembersToLocalMembers(list))
    return true
  } catch (e) {
    return false
  }
}

const memberItems = computed(() => listMembers(calendarState.value).filter((m) => m.enabled !== false))

const activeMember = computed(() => memberItems.value.find((m) => m.id === activeMemberId.value) || memberItems.value[0] || {
  id: '',
  name: '',
  glyph: '',
  color: '#4cc38a',
  avatarUrl: '',
})

const activeMemberLabel = computed(() => activeMember.value.name || '成员')
const activeMemberColor = computed(() => activeMember.value.color || '#4cc38a')

const allRemoteItems = computed(() => rewardsApi.mapRemoteRewardsToLocalItems(remoteRewards.value))

const todayDoneMap = computed(() => {
  const map = {}
  for (const record of starRecords.value) {
    const rewardId = String(record && record.rewardId ? record.rewardId : '')
    if (!rewardId) continue
    const key = formatDateKey(record && record.updateTime ? record.updateTime : '')
    if (key === todayKey.value) map[rewardId] = true
  }
  return map
})

watch(
  activeMemberId,
  () => {
    syncStarRecords()
  },
  { immediate: true },
)

onShow(() => {
  ;(async () => {
    refreshLocalState()
    await syncRemoteMembers()
    await refreshRemoteRewards()
  })()
})

function ensureValidActiveMember() {
  const list = memberItems.value
  if (!list.length) return
  if (list.some((m) => m.id === activeMemberId.value)) return
  rewardState.value = setRewardActiveMember(rewardState.value, list[0].id)
}

function dedupeRemoteRewards(list) {
  const source = Array.isArray(list) ? list : []
  const seen = new Set()
  const out = []
  for (const item of source) {
    if (!item || !item.rewardId) continue
    const members = Array.isArray(item.members) ? item.members.map((member) => String(member && member.memberId ? member.memberId : '')).filter(Boolean).sort() : []
    const key = [String(item.rewardId), String(item.rewardType), members.join(','), String(item.rewardTitle || '')].join('|')
    if (seen.has(key)) continue
    seen.add(key)
    out.push(item)
  }
  return out
}

async function refreshRemoteRewards() {
  const logged = !!uni.getStorageSync('auth_logged_in')
  if (!logged) {
    remoteRewards.value = []
    memberBalanceMap.value = {}
    starRecords.value = []
    return
  }
  loading.value = true
  try {
    const [rewardList, punishList] = await Promise.all([
      rewardsApi.getMemberRewardList({ rewardType: 0 }),
      rewardsApi.getMemberRewardList({ rewardType: 1 }),
    ])
    remoteRewards.value = dedupeRemoteRewards([...rewardList, ...punishList])
    memberBalanceMap.value = rewardsApi.collectMemberBalancesFromRewards(remoteRewards.value)
    ensureValidActiveMember()
    await syncStarRecords()
  } catch (e) {
    remoteRewards.value = []
    memberBalanceMap.value = {}
    starRecords.value = []
    uni.showToast({ title: String((e && e.message) || '获取奖励列表失败'), icon: 'none' })
  } finally {
    loading.value = false
  }
}

async function syncStarRecords() {
  const memberId = activeMemberId.value
  const logged = !!uni.getStorageSync('auth_logged_in')
  if (!logged || !memberId) {
    starRecords.value = []
    return
  }
  try {
    starRecords.value = await rewardsApi.getStarNumberList({ memberId })
  } catch (e) {
    starRecords.value = []
  }
}

function formatDateKey(input) {
  const d = input instanceof Date ? input : new Date(input || Date.now())
  if (Number.isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function hexToRgba(hex, alpha) {
  const a = Math.max(0, Math.min(1, Number(alpha)))
  const raw = String(hex || '').trim()
  if (!raw) return ''
  if (raw.startsWith('rgba(') || raw.startsWith('rgb(')) return raw
  if (!raw.startsWith('#')) return ''
  const h = raw.slice(1)
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  if (full.length !== 6) return ''
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return ''
  return `rgba(${r}, ${g}, ${b}, ${a})`
}

const panelBackground = computed(() => {
  const c = activeMemberColor.value || '#4cc38a'
  const rgba = hexToRgba(c, 0.12)
  if (rgba) return rgba
  return '#eaf7f1'
})

function balance(memberId) {
  return Number(memberBalanceMap.value[String(memberId || '')] || 0) || 0
}

function selectMember(id) {
  rewardState.value = setRewardActiveMember(rewardState.value, id)
}

const filteredItems = computed(() => {
  const settings = rewardState.value.settings || { sort: 'asc', showDone: true }
  const items = allRemoteItems.value
    .filter((x) => x.memberId === activeMemberId.value)
    .filter((x) => (settings.showDone ? true : !isDoneToday(x)))

  const asc = settings.sort === 'asc'
  return items
    .slice()
    .sort((a, b) => {
      const ta = a.type === 'punish' ? 1 : 0
      const tb = b.type === 'punish' ? 1 : 0
      if (ta !== tb) return ta - tb
      const ha = Number(a.hearts || 0) || 0
      const hb = Number(b.hearts || 0) || 0
      if (ha !== hb) return asc ? ha - hb : hb - ha
      const aa = String(a.title || '')
      const bb = String(b.title || '')
      return aa.localeCompare(bb, 'zh-Hans-CN')
    })
})

function isDoneToday(it) {
  if (!it || !it.rewardId) return false
  return !!todayDoneMap.value[String(it.rewardId)]
}

function canAfford() {
  return true
}

function buttonMode(it) {
  if (isDoneToday(it)) return 'today'
  return 'button'
}

function progressWidth(it) {
  const cur = balance(activeMemberId.value)
  const need = Number(it && it.hearts ? it.hearts : 0) || 0
  if (!need) return '0%'
  const ratio = Math.max(0, Math.min(1, cur / need))
  return `${Math.floor(ratio * 100)}%`
}

async function tryRedeem(it) {
  if (!it || pendingAction.value) return
  if (buttonMode(it) === 'today') return
  pendingAction.value = true
  const delta = Number(it.hearts || 0) || 0
  try {
    await rewardsApi.addStarNumberInfo({
      memberId: it.memberId,
      rewardId: it.rewardId || it.id,
      updateReason: it.type === 'punish' ? `惩罚:${it.title}` : `奖励:${it.title}`,
      starNumber: it.type === 'punish' ? -delta : delta,
    })
    celebrateType.value = it.type
    celebrateTitle.value = it.title
    celebrateItemId.value = it.rewardId || it.id
    celebrateOpen.value = true
    setTimeout(() => {
      celebrateOpen.value = false
      resultSheetOpen.value = true
    }, 220)
  } catch (e) {
    uni.showToast({ title: String((e && e.message) || '调整星星失败'), icon: 'none' })
  } finally {
    pendingAction.value = false
  }
}

async function closeResult() {
  resultSheetOpen.value = false
  await refreshRemoteRewards()
}

async function cancelAction() {
  const id = celebrateItemId.value
  const it = allRemoteItems.value.find((x) => x.rewardId === id && x.memberId === activeMemberId.value)
  if (!it || pendingAction.value) return
  pendingAction.value = true
  const delta = Number(it.hearts || 0) || 0
  try {
    await rewardsApi.addStarNumberInfo({
      memberId: it.memberId,
      rewardId: it.rewardId,
      updateReason: celebrateType.value === 'punish' ? `取消惩罚:${it.title}` : `取消奖励:${it.title}`,
      starNumber: celebrateType.value === 'punish' ? delta : -delta,
    })
    resultSheetOpen.value = false
    await refreshRemoteRewards()
  } catch (e) {
    uni.showToast({ title: String((e && e.message) || '取消操作失败'), icon: 'none' })
  } finally {
    pendingAction.value = false
  }
}

function addItem() {
  const memberId = activeMemberId.value ? `&memberId=${encodeURIComponent(activeMemberId.value)}` : ''
  uni.navigateTo({ url: `/pages/rewards/reward-form?type=reward${memberId}` })
}

function openActions(it) {
  activeItemId.value = it.rewardId || it.id
  actionSheetOpen.value = true
}

function editItem() {
  const id = activeItemId.value
  actionSheetOpen.value = false
  if (!id) return
  uni.navigateTo({ url: `/pages/rewards/reward-form?id=${encodeURIComponent(id)}` })
}

async function deleteItem() {
  const id = activeItemId.value
  actionSheetOpen.value = false
  if (!id) return
  const item = allRemoteItems.value.find((x) => (x.rewardId || x.id) === id)
  if (!item) return
  try {
    await rewardsApi.deleteRewardInfo({ rewardId: id })
    await refreshRemoteRewards()
  } catch (e) {
    uni.showToast({ title: String((e && e.message) || '删除奖励失败'), icon: 'none' })
  }
}

function goGive() {
  uni.navigateTo({ url: '/pages/rewards/give-hearts' })
}

function goSettings() {
  uni.navigateTo({ url: '/pages/rewards/settings' })
}
</script>

<style scoped lang="scss">
.bl-page {
  height: 100vh;
  background: #ffffff;
}
.reward-page {
  height: 100vh;
  padding-bottom: 222rpx;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.right {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.icon-btn {
  height: 64rpx;
  padding: 0 18rpx;
  border-radius: 999rpx;
  background: #ffffff;
  box-shadow: 0 10rpx 26rpx rgba(17, 17, 17, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
}

.top-icon {
  width: 34rpx;
  height: 34rpx;
  display: block;
}

.member-scroll {
  margin-top: 10rpx;
  width: 100%;
  flex-shrink: 0;
}

.member-row {
  display: flex;
  align-items: flex-start;
  gap: 20rpx;
  padding: 10rpx 0 6rpx;
}

.member {
  width: 150rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10rpx;
}

.ring {
  width: 106rpx;
  height: 106rpx;
  border-radius: 999rpx;
  border: 5rpx solid rgba(17, 17, 17, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
}

.member.active .ring {
  border-width: 6rpx;
}

.member-hearts {
  height: 40rpx;
  padding: 0 14rpx;
  border-radius: 999rpx;
  background: rgba(255, 165, 0, 0.12);
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.member-hearts-text {
  font-size: 22rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.75);
}

.heart-img {
  width: 18rpx;
  height: 18rpx;
  display: block;
}

.heart-img.is-small {
  width: 16rpx;
  height: 16rpx;
}

.panel {
  margin-top: 16rpx;
  background: #eaf7f1;
  border-radius: 28rpx;
  padding: 22rpx;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.panel-body {
  margin-top: 18rpx;
  flex: 1;
  min-height: 0;
}

.panel-empty {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 22rpx;
}

.head-left {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.head-name {
  font-size: 30rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.9);
}

.pill {
  height: 44rpx;
  padding: 0 14rpx;
  border-radius: 999rpx;
  background: rgba(255, 165, 0, 0.18);
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.pill-text {
  font-size: 24rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.75);
}

.items {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.item {
  background: #ffffff;
  border-radius: 22rpx;
  padding: 18rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.item-left {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.emoji {
  width: 82rpx;
  height: 82rpx;
  border-radius: 20rpx;
  background: rgba(17, 17, 17, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
}

.emoji-text {
  font-size: 36rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.7);
}

.emoji-heart {
  width: 44rpx;
  height: 44rpx;
  display: block;
}

.item-main {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.item-title {
  font-size: 30rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.9);
}

.item-sub {
  font-size: 24rpx;
  font-weight: 800;
}

.btn {
  height: 74rpx;
  padding: 0 20rpx;
  border-radius: 999rpx;
  background: #4cc38a;
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.btn.punish {
  background: #ff4b3f;
}

.btn.disabled {
  background: rgba(17, 17, 17, 0.12);
}

.btn.disabled .btn-text {
  color: rgba(17, 17, 17, 0.55);
}

.btn-text {
  font-size: 28rpx;
  font-weight: 900;
  color: #ffffff;
}

.progress {
  width: 240rpx;
  height: 74rpx;
  border-radius: 999rpx;
  background: rgba(76, 195, 138, 0.22);
  position: relative;
  overflow: hidden;
}

.progress-fill {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  background: rgba(76, 195, 138, 0.65);
}

.progress-text {
  position: relative;
  z-index: 1;
  height: 74rpx;
  padding: 0 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
}

.progress-label {
  font-size: 26rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.75);
}

.progress.ready .progress-label {
  color: rgba(17, 17, 17, 0.85);
}

.empty-illus {
  width: 260rpx;
  height: 260rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-img {
  width: 260rpx;
  height: 260rpx;
  display: block;
}

.empty-text {
  font-size: 26rpx;
  font-weight: 800;
}

.fab {
  position: fixed;
  right: 28rpx;
  bottom: 120rpx;
  width: 160rpx;
  height: 92rpx;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.fab-img {
  width: 160rpx;
  height: 92rpx;
  display: block;
  transform: translateX(18rpx);
}

.celebrate {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  z-index: 998;
}

.float-heart {
  position: absolute;
  width: 120rpx;
  height: 120rpx;
  display: block;
  filter: drop-shadow(0 18rpx 36rpx rgba(0, 0, 0, 0.18));
}

.h1 {
  left: 10%;
  top: 20%;
}
.h2 {
  left: 62%;
  top: 16%;
}
.h3 {
  left: 38%;
  top: 36%;
}
.h4 {
  left: 18%;
  top: 54%;
}
.h5 {
  left: 72%;
  top: 56%;
}

.result {
  padding: 12rpx 0 10rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.result-illus {
  width: 520rpx;
  height: 260rpx;
  display: block;
  margin-bottom: 6rpx;
}

.result-title {
  font-size: 44rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.95);
}

.result-sub {
  margin-top: 14rpx;
  font-size: 28rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.75);
}

.result-link {
  color: #3d6afb;
}

.result-btn {
  margin-top: 20rpx;
  width: 520rpx;
  height: 96rpx;
  border-radius: 999rpx;
  background: #3d6afb;
  display: flex;
  align-items: center;
  justify-content: center;
}

.result-btn.punish {
  background: #ff3b30;
}

.result-btn-text {
  color: #ffffff;
  font-size: 34rpx;
  font-weight: 900;
}

.result-cancel {
  margin-top: 16rpx;
  height: 66rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.result-cancel-text {
  font-size: 26rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.5);
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
