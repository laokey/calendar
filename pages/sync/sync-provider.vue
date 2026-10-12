<template>
  <view class="bl-page page">
    <BlHeader :title="headerTitle" back back-icon-src="/static/sync/icon_nav_back_small.png" />

    <view class="account-card">
      <image class="account-logo" :src="providerLogo" mode="aspectFit" />
      <view class="account-body">
        <text v-if="boundEmail" class="account-email">{{ boundEmail }}</text>
        <text v-else class="account-empty bl-muted">{{ $t('尚未绑定账号') }}</text>
        <text class="account-status">
          {{ statusLabel }}
        </text>
      </view>
      <view v-if="boundEmail" class="unbind" @click="confirmUnbind">
        <text class="unbind-text">{{ $t('解绑') }}</text>
      </view>
    </view>

    <view class="section-title">{{ $t('选择同步方式') }}</view>
    <view class="card-list">
      <view class="opt" :class="{ on: mode === 'twoWay' }" @click="mode = 'twoWay'">
        <view class="opt-meta">
          <text class="opt-title">{{ $t('双向同步') }}</text>
          <text class="opt-desc bl-muted">{{ twoWayDesc }}</text>
        </view>
        <image v-if="mode === 'twoWay'" class="opt-check" src="/static/sync/icon_radio_on_check_blue.png" mode="aspectFit" />
        <view v-else class="opt-off" />
      </view>

      <view class="opt" :class="{ on: mode === 'oneWay' }" @click="mode = 'oneWay'">
        <view class="opt-meta">
          <text class="opt-title">{{ $t('单向同步') }}</text>
          <text class="opt-desc bl-muted">{{ oneWayDesc }}</text>
        </view>
        <image v-if="mode === 'oneWay'" class="opt-check" src="/static/sync/icon_radio_on_check_blue.png" mode="aspectFit" />
        <view v-else class="opt-off" />
      </view>
    </view>

    <view class="bottom-action">
      <view class="bl-btn-primary" :class="{ 'is-disabled': submitting }" @click="next">
        <text>{{ buttonLabel }}</text>
      </view>
    </view>

    <view v-if="unbindDialogOpen" class="mask" @click="unbindDialogOpen = false">
      <view class="dialog" @click.stop>
        <text class="dialog-title">{{ $t('确认解绑') }}</text>
        <text class="dialog-desc">{{ unbindDesc }}</text>
        <view class="dialog-actions">
          <view class="btn btn-cancel" @click="unbindDialogOpen = false">
            <text class="btn-text">{{ $t('取消') }}</text>
          </view>
          <view class="btn btn-ok" @click="doUnbind">
            <text class="btn-text ok-text">{{ $t('解绑') }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import BlHeader from '../../components/BlHeader.vue'
import { addAccountSync, ensureSyncState, findSynced, removeSynced, saveSyncState } from '../../utils/syncStore'
import { getCalendarAccountList, normalizeAccountList, unbindCalendarAccount } from '../../utils/api/sync'

const provider = ref('google')
const mode = ref('twoWay')
const submitting = ref(false)
const boundEmail = ref('')
const boundAccountId = ref('')
const unbindDialogOpen = ref(false)

let oauthResultHandler = null

onLoad((options) => {
  const p = String(options && options.provider ? options.provider : 'google')
  provider.value = p === 'outlook' ? 'outlook' : 'google'
})

onShow(() => {
  loadBoundStatus()
})

onBeforeUnmount(() => {
  if (oauthResultHandler) {
    try {
      uni.$off('oauth:result', oauthResultHandler)
    } catch (e) {}
    oauthResultHandler = null
  }
})

const headerTitle = computed(() => (provider.value === 'outlook' ? uni.$t('同步微软账号') : uni.$t('同步Google账号')))

const providerLogo = computed(() =>
  provider.value === 'outlook' ? '/static/sync/logo_outlook.png' : '/static/sync/logo_google_calendar.png',
)

const twoWayDesc = computed(() => {
  if (provider.value === 'outlook') return uni.$t('在芝麻日历上的更改将会同步发送Outlook日历')
  return uni.$t('电子日历上的更改将发回Google日历')
})

const oneWayDesc = computed(() => {
  if (provider.value === 'outlook') return uni.$t('在芝麻日历上的更改将不会同步Outlook日历')
  return uni.$t('在芝麻日历上的更改不会发送回GoogleCalendar')
})

const unbindDesc = computed(() => {
  if (provider.value === 'outlook') return uni.$t('解绑后将不再同步此 Outlook 账号的日历数据，确定继续吗？')
  return uni.$t('解绑后将不再同步此 Google 账号的日历数据，确定继续吗？')
})

const statusLabel = computed(() => {
  if (submitting.value) return uni.$t('绑定中...')
  if (boundEmail.value) return uni.$t('已绑定')
  return uni.$t('未绑定')
})

const buttonLabel = computed(() => {
  if (submitting.value) return uni.$t('绑定中...')
  if (boundEmail.value) return uni.$t('继续同步日历')
  return uni.$t('授权并绑定账号')
})

async function loadBoundStatus() {
  try {
    const state = ensureSyncState()
    const localHit = (state.synced || []).find(
      (x) => x && x.type === 'account' && x.provider === provider.value,
    )
    if (localHit) {
      boundEmail.value = localHit.email || ''
      boundAccountId.value = localHit.id || ''
      mode.value = localHit.syncMode || 'twoWay'
    }
    const remote = await getCalendarAccountList()
    const list = normalizeAccountList(remote)
    const remoteHit = list.find((x) => x.provider === provider.value)
    if (remoteHit) {
      if (!boundEmail.value || boundEmail.value !== remoteHit.email) {
        const account = upsertAccountFromRemote(remoteHit)
        boundEmail.value = remoteHit.email
        boundAccountId.value = account ? account.id : ''
      }
    } else if (localHit) {
      const s = ensureSyncState()
      removeSynced(s, localHit.id)
      boundEmail.value = ''
      boundAccountId.value = ''
    }
  } catch (e) {}
}

function upsertAccountFromRemote(remoteAccount) {
  const state = ensureSyncState()
  const email = String(remoteAccount && remoteAccount.email ? remoteAccount.email : '')
  if (!email) return null
  const hit = (state.synced || []).find(
    (x) => x && x.type === 'account' && x.provider === provider.value && x.email === email,
  )
  if (hit) {
    hit.syncMode = mode.value
    hit.name = remoteAccount.name || hit.name
    if (remoteAccount.id) hit.remoteId = String(remoteAccount.id)
    state.activeId = hit.id
    saveSyncState(state)
    return hit
  }
  return addAccountSync(state, provider.value, {
    email,
    name: remoteAccount.name || email,
    syncMode: mode.value,
    remoteId: remoteAccount.id,
  })
}

function next() {
  if (submitting.value) return
  if (boundEmail.value) {
    goCalendars()
    return
  }
  startOAuth()
}

function goCalendars() {
  const accountId = ensureAccountId()
  if (!accountId) {
    uni.showToast({ title: uni.$t('账号信息错误'), icon: 'none' })
    return
  }
  uni.navigateTo({
    url: `/pages/sync/sync-calendars?provider=${provider.value}&accountId=${encodeURIComponent(accountId)}`,
  })
}

function ensureAccountId() {
  if (boundAccountId.value) {
    const state = ensureSyncState()
    const hit = findSynced(state, boundAccountId.value)
    if (hit) {
      hit.syncMode = mode.value
      saveSyncState(state)
      return hit.id
    }
  }
  if (!boundEmail.value) return ''
  const state = ensureSyncState()
  const hit = (state.synced || []).find(
    (x) => x && x.type === 'account' && x.provider === provider.value && x.email === boundEmail.value,
  )
  if (hit) {
    hit.syncMode = mode.value
    saveSyncState(state)
    return hit.id
  }
  const item = addAccountSync(state, provider.value, { email: boundEmail.value, name: boundEmail.value, syncMode: mode.value })
  return item ? item.id : ''
}

function startOAuth() {
  submitting.value = true
  if (oauthResultHandler) {
    try {
      uni.$off('oauth:result', oauthResultHandler)
    } catch (e) {}
  }
  oauthResultHandler = (evt) => handleOAuthResult(evt)
  try {
    uni.$on('oauth:result', oauthResultHandler)
  } catch (e) {}

  uni.navigateTo({
    url: `/pages/sync/oauth-webview?provider=${provider.value}&mode=${mode.value}`,
    success: (res) => {
      try {
        if (res && res.eventChannel && typeof res.eventChannel.on === 'function') {
          res.eventChannel.on('oauth-result', (data) => handleOAuthResult(data))
        }
      } catch (e) {}
    },
    fail: () => {
      submitting.value = false
    },
  })
}

function handleOAuthResult(evt) {
  if (oauthResultHandler) {
    try {
      uni.$off('oauth:result', oauthResultHandler)
    } catch (e) {}
    oauthResultHandler = null
  }
  const payload = evt && typeof evt === 'object' ? evt : {}
  const p = String(payload.provider || '').toLowerCase()
  if (p && p !== provider.value) return
  if (payload.success) {
    const email = String(payload.email || '').trim()
    if (email) {
      boundEmail.value = email
      const remoteId = payload.account && payload.account.id ? String(payload.account.id) : ''
      const item = upsertAccountFromRemote({ email, name: email, id: remoteId })
      boundAccountId.value = item ? item.id : ''
      uni.showToast({ title: uni.$t('绑定成功'), icon: 'success' })
      setTimeout(() => goCalendars(), 400)
    } else {
      loadBoundStatus().then(() => {
        if (boundEmail.value) {
          uni.showToast({ title: uni.$t('绑定成功'), icon: 'success' })
          setTimeout(() => goCalendars(), 400)
        } else {
          uni.showToast({ title: uni.$t('绑定失败，请重试'), icon: 'none' })
        }
      })
    }
  } else if (payload.error === 'cancelled') {
  } else if (payload.error) {
    uni.showToast({ title: payload.error || uni.$t('绑定失败'), icon: 'none' })
  }
  submitting.value = false
}

function confirmUnbind() {
  if (!boundEmail.value) return
  unbindDialogOpen.value = true
}

async function doUnbind() {
  unbindDialogOpen.value = false
  submitting.value = true
  try {
    const state = ensureSyncState()
    const local = (state.synced || []).find(
      (x) => x && x.type === 'account' && x.provider === provider.value && x.email === boundEmail.value,
    )
    const remoteId = (local && (local.remoteId || local.id)) || boundAccountId.value || ''
    try {
      if (remoteId) {
        await unbindCalendarAccount({ accountId: remoteId, provider: provider.value })
      }
    } catch (e) {}
    if (local) removeSynced(state, local.id)
    boundEmail.value = ''
    boundAccountId.value = ''
    uni.showToast({ title: uni.$t('已解绑'), icon: 'success' })
  } catch (e) {
    uni.showToast({ title: (e && e.message) || uni.$t('解绑失败'), icon: 'none' })
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: #ffffff;
  padding-bottom: 200rpx;
}

.account-card {
  margin-top: 12rpx;
  background: #ffffff;
  border-radius: 22rpx;
  padding: 22rpx 22rpx;
  display: flex;
  align-items: center;
  gap: 18rpx;
  box-shadow: 0 10rpx 26rpx rgba(17, 17, 17, 0.06);
}

.account-logo {
  width: 62rpx;
  height: 62rpx;
  flex-shrink: 0;
}

.account-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.account-email {
  font-size: 30rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.92);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.account-empty {
  font-size: 30rpx;
  font-weight: 800;
}

.account-status {
  font-size: 24rpx;
  font-weight: 700;
  color: rgba(17, 17, 17, 0.55);
}

.unbind {
  padding: 0 20rpx;
  height: 58rpx;
  border-radius: 9999rpx;
  background: rgba(255, 90, 95, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.unbind-text {
  font-size: 24rpx;
  font-weight: 900;
  color: #ff5a5f;
}

.section-title {
  display: block;
  margin-top: 28rpx;
  margin-bottom: 12rpx;
  font-size: 34rpx;
  font-weight: 900;
}

.card-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.opt {
  background: rgba(17, 17, 17, 0.04);
  border-radius: 22rpx;
  padding: 26rpx 22rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 2rpx solid transparent;
}

.opt.on {
  background: rgba(61, 106, 251, 0.12);
  border-color: #3d6afb;
}

.opt-meta {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  flex: 1;
  min-width: 0;
}

.opt-title {
  font-size: 34rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.92);
}

.opt-desc {
  font-size: 26rpx;
  font-weight: 700;
  line-height: 36rpx;
}

.opt-check {
  width: 52rpx;
  height: 52rpx;
  display: block;
  flex-shrink: 0;
  margin-left: 18rpx;
}

.opt-off {
  width: 52rpx;
  height: 52rpx;
  border-radius: 999rpx;
  background: rgba(17, 17, 17, 0.12);
  flex-shrink: 0;
  margin-left: 18rpx;
}

.bottom-action {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 20rpx 28rpx calc(20rpx + env(safe-area-inset-bottom));
  background: #ffffff;
}

.mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.dialog {
  width: 640rpx;
  border-radius: 28rpx;
  background: #ffffff;
  padding: 36rpx 28rpx 26rpx;
}

.dialog-title {
  display: block;
  font-size: 34rpx;
  font-weight: 900;
  text-align: center;
  margin-bottom: 18rpx;
}

.dialog-desc {
  display: block;
  font-size: 28rpx;
  font-weight: 800;
  text-align: center;
  color: rgba(17, 17, 17, 0.78);
  line-height: 42rpx;
}

.dialog-actions {
  margin-top: 28rpx;
  display: flex;
  gap: 18rpx;
}

.btn {
  flex: 1;
  height: 88rpx;
  border-radius: 9999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-cancel {
  background: rgba(61, 106, 251, 0.12);
}

.btn-ok {
  background: #ff5a5f;
}

.btn-text {
  font-size: 30rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.78);
}

.ok-text {
  color: #ffffff;
}
</style>
