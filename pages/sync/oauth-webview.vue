<template>
  <view class="bl-page page">
    <!-- #ifdef H5 -->
    <view class="nav-bar">
      <view class="nav-left" @click="goBack">
        <image class="nav-back" src="/static/sync/icon_nav_back_small.png" mode="aspectFit" />
      </view>
      <text class="nav-title">{{ title }}</text>
      <view class="nav-right" />
    </view>
    <!-- #endif -->

    <view class="status-bar" v-if="phase !== 'idle'">
      <text class="status-text">{{ statusText }}</text>
    </view>

    <web-view
      v-if="authUrl"
      :src="authUrl"
      @load="onWebViewLoad"
      @error="onWebViewError"
      @message="onWebViewMessage"
      class="wv"
    />

    <view v-if="!authUrl" class="empty">
      <text class="empty-text">{{ $t('加载中...') }}</text>
    </view>

    <view v-if="phase === 'awaitingOob'" class="oob-mask">
      <view class="oob-card">
        <text class="oob-title">{{ oobTitle }}</text>
        <text class="oob-desc">{{ oobDesc }}</text>
        <view class="oob-input-wrap">
          <textarea
            v-model="manualCode"
            class="oob-input"
            :placeholder="$t('请在此处粘贴授权码')"
            placeholder-class="oob-ph"
          />
        </view>
        <view class="oob-actions">
          <view class="oob-btn oob-btn-outline" @click="backToEdit">
            <text class="oob-btn-outline-text">{{ $t('返回上一步') }}</text>
          </view>
          <view class="oob-btn oob-btn-primary" :class="{ 'is-disabled': !canSubmitManual }" @click="submitManual">
            <text class="oob-btn-primary-text">{{ $t('提交授权码') }}</text>
          </view>
        </view>
        <text class="oob-hint bl-muted">{{ oobHint }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import {
  buildAuthUrl,
  extractCodeFromRedirectUrl,
  extractCodeFromHtmlOrText,
  getCalendarAccountList,
  normalizeAccountList,
  submitOAuthCode,
  GOOGLE_REDIRECT_URI,
  OUTLOOK_REDIRECT_URI,
} from '../../utils/api/sync'

const provider = ref('google')
const mode = ref('twoWay')
const phase = ref('idle')
const statusText = ref('')
const authUrl = ref('')
const stateToken = ref('')
const beforeEmails = ref([])
const eventChannel = ref(null)
const manualCode = ref('')
const lastDetectedCode = ref('')
let pollTimer = null
let pollCount = 0
const POLL_MAX = 180
const POLL_INTERVAL = 2000

onLoad((options) => {
  const p = String(options && options.provider ? options.provider : 'google')
  provider.value = p === 'outlook' ? 'outlook' : 'google'
  mode.value = options && options.mode === 'oneWay' ? 'oneWay' : 'twoWay'

  try {
    const pages = getCurrentPages()
    const cur = pages && pages.length ? pages[pages.length - 1] : null
    if (cur && cur.getOpenerEventChannel) {
      eventChannel.value = cur.getOpenerEventChannel()
    }
  } catch (e) {}

  // #ifndef H5
  try {
    uni.setNavigationBarTitle({ title: unref(title) })
  } catch (e) {}
  // #endif

  init()
})

onBeforeUnmount(() => {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
})

import { unref } from 'vue'

const title = computed(() =>
  provider.value === 'outlook' ? uni.$t('Outlook 授权登录') : uni.$t('Google 授权登录'),
)

const redirectUri = computed(() =>
  provider.value === 'outlook' ? OUTLOOK_REDIRECT_URI : GOOGLE_REDIRECT_URI,
)

const canSubmitManual = computed(() => !!String(manualCode.value || '').trim())

const oobTitle = computed(() =>
  provider.value === 'outlook' ? uni.$t('已完成 Outlook 授权') : uni.$t('已完成 Google 授权'),
)

const oobDesc = computed(() =>
  provider.value === 'outlook'
    ? uni.$t('请将授权页面显示的授权码复制到下方输入框，我们将自动为您绑定账号')
    : uni.$t('请将 Google 授权页显示的授权码复制到下方输入框，即可完成账号绑定'),
)

const oobHint = computed(() =>
  provider.value === 'outlook'
    ? uni.$t('如您已经完成网页授权，也可直接等待自动同步（约需数秒）')
    : uni.$t('已自动等待后端绑定完成；仍未跳转请等待或粘贴授权码手动提交'),
)

function genState() {
  return `${provider.value}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

function currentUserEmail() {
  return String(uni.getStorageSync('auth_email') || '').trim()
}

async function init() {
  phase.value = 'authorizing'
  statusText.value = provider.value === 'outlook'
    ? uni.$t('正在打开 Outlook 授权页...')
    : uni.$t('正在打开 Google 授权页...')

  try {
    beforeEmails.value = await fetchEmails()
  } catch (e) {
    beforeEmails.value = []
  }

  stateToken.value = currentUserEmail() || genState()
  authUrl.value = buildAuthUrl(provider.value, { state: stateToken.value })

  startPoll()
}

async function fetchEmails() {
  try {
    const raw = await getCalendarAccountList()
    const list = normalizeAccountList(raw)
    return list.map((x) => String(x.email || '').toLowerCase()).filter(Boolean)
  } catch (e) {
    return []
  }
}

function startPoll() {
  pollCount = 0
  if (pollTimer) clearInterval(pollTimer)
  pollTimer = setInterval(() => {
    pollCount += 1
    if (pollCount > POLL_MAX) {
      if (pollTimer) {
        clearInterval(pollTimer)
        pollTimer = null
      }
      if (phase.value === 'authorizing' || phase.value === 'exchanging') {
        phase.value = 'awaitingOob'
        statusText.value = uni.$t('请粘贴授权码或稍后再试')
      }
      return
    }
    pollOnce()
  }, POLL_INTERVAL)
}

async function pollOnce() {
  if (phase.value === 'success' || phase.value === 'failed' || phase.value === 'done') return
  try {
    const raw = await getCalendarAccountList()
    const list = normalizeAccountList(raw)
    const currentEmails = list.map((x) => String(x.email || '').toLowerCase()).filter(Boolean)
    const diff = currentEmails.filter((e) => !beforeEmails.value.includes(e))
    if (diff.length) {
      const newAccount = list.find((x) => diff.includes(String(x.email || '').toLowerCase()))
      handleBound(newAccount || { email: diff[0] })
    }
  } catch (e) {}
}

function handleBound(account) {
  if (phase.value === 'done' || phase.value === 'success') return
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
  phase.value = 'success'
  statusText.value = uni.$t('授权成功')
  const email = String(account && account.email ? account.email : '')
  emitResult({
    success: true,
    email,
    account: account || null,
    provider: provider.value,
    syncMode: mode.value,
  })
  setTimeout(() => {
    uni.navigateBack()
  }, 800)
}

function handleCode(code) {
  if (!code) return
  const normalized = String(code).trim()
  if (!normalized) return
  if (lastDetectedCode.value === normalized && phase.value === 'exchanging') return
  lastDetectedCode.value = normalized
  if (phase.value !== 'authorizing' && phase.value !== 'awaitingOob') return
  phase.value = 'exchanging'
  statusText.value = uni.$t('正在提交授权码...')
  submitOAuthCode({
    provider: provider.value,
    code: normalized,
    redirectUri: redirectUri.value,
  })
    .then(async (res) => {
      phase.value = 'success'
      statusText.value = uni.$t('授权成功')
      let email = ''
      try {
        const list = normalizeAccountList(await getCalendarAccountList())
        const currentEmails = list.map((x) => String(x.email || '').toLowerCase())
        const diff = currentEmails.filter((e) => !beforeEmails.value.includes(e))
        email = diff[0] || (list[0] && list[0].email) || ''
      } catch (e) {}
      emitResult({
        success: true,
        email,
        code: normalized,
        provider: provider.value,
        syncMode: mode.value,
        raw: res,
      })
      setTimeout(() => uni.navigateBack(), 800)
    })
    .catch((err) => {
      phase.value = 'awaitingOob'
      statusText.value = (err && err.message) || uni.$t('请手动粘贴授权码重试')
      emitResult({ success: false, error: err && err.message ? err.message : 'exchange_failed', code: normalized })
    })
}

function emitResult(payload) {
  try {
    if (eventChannel.value && typeof eventChannel.value.emit === 'function') {
      eventChannel.value.emit('oauth-result', payload)
    }
  } catch (e) {}
  try {
    uni.$emit('oauth:result', {
      provider: provider.value,
      syncMode: mode.value,
      ...(payload || {}),
    })
  } catch (e) {}
}

function extractCodeFromText(text) {
  const parsed = extractCodeFromHtmlOrText(text)
  if (parsed && parsed.code) return parsed
  const raw = String(text || '')
  if (!raw) return { code: '', error: '' }
  const m = raw.match(/(authorization[_\s-]*code|授权码|code)[^\w]{0,8}([A-Za-z0-9_\-\/.]{6,})/i)
  if (m && m[2]) return { code: m[2], error: '' }
  const strict = raw.match(/\b[4\/][A-Za-z0-9_\-]{8,}\b|\b\d\/[A-Za-z0-9_\-]{8,}\b/)
  if (strict) return { code: strict[0], error: '' }
  return extractedCodeFallback(raw)
}

function extractedCodeFallback(raw) {
  try {
    const parsed = extractCodeFromRedirectUrl(raw)
    if (parsed.code) return parsed
  } catch (e) {}
  return { code: '', error: '' }
}

function isRedirectCandidate(src) {
  if (!src) return false
  const base = String(redirectUri.value || '')
  if (!base) return false
  try {
    if (src.indexOf(base) === 0) return true
    const baseNorm = base.replace(/^:\/\//, '://').replace(/:\//, ':/').toLowerCase()
    const srcNorm = String(src).toLowerCase()
    if (srcNorm.indexOf(baseNorm) === 0) return true
    if (/googleusercontent\.apps\.[^:]+:[\/]/.test(src) && /[?&#]code=/.test(src)) return true
    if (/oauthredirect[?&#]/.test(src) && /code=/.test(src)) return true
    if (/oauth\/(google|outlook)\/callback/i.test(src)) return true
  } catch (e) {}
  return false
}

function onWebViewLoad(e) {
  const src = String(e && e.detail && e.detail.src ? e.detail.src : '')
  if (!src) return
  try {
    const parsed = extractCodeFromRedirectUrl(src)
    const baseHit = isRedirectCandidate(src)
    if (parsed.error) {
      if (pollTimer) {
        clearInterval(pollTimer)
        pollTimer = null
      }
      phase.value = 'failed'
      statusText.value = `${uni.$t('授权被拒绝')}: ${parsed.error}`
      emitResult({ success: false, error: parsed.error })
      setTimeout(() => uni.navigateBack(), 1500)
      return
    }
    if (parsed.code) {
      handleCode(parsed.code)
      return
    }
    if (baseHit) {
      phase.value = phase.value === 'exchanging' ? phase.value : 'awaitingOob'
    }
  } catch (e) {}
}

function onWebViewError(e) {
  try {
    const url =
      (e && e.detail && (e.detail.url || e.detail.src || e.detail.message)) ||
      ''
    const src = String(url)
    if (src) {
      onWebViewLoad({ detail: { src } })
    }
  } catch (err) {}
  const current = String(statusText.value || '')
  if (/授权|绑定|code|code|粘贴/i.test(current)) return
  statusText.value = uni.$t('网页加载错误，如无法完成授权请检查网络')
}

function onWebViewMessage(evt) {
  try {
    const data = (evt && evt.detail && (evt.detail.data || evt.detail)) || null
    if (!data) return
    const candidates = Array.isArray(data) ? data : [data]
    for (const item of candidates) {
      const text =
        typeof item === 'string'
          ? item
          : item && typeof item === 'object'
            ? String(item.html || item.text || item.code || item.body || item.title || JSON.stringify(item))
            : ''
      const parsed = extractCodeFromText(text)
      if (parsed.code) {
        handleCode(parsed.code)
        return
      }
    }
  } catch (e) {}
}

function backToEdit() {
  phase.value = 'authorizing'
  statusText.value = uni.$t('请在授权页完成授权后返回')
}

function submitManual() {
  const code = String(manualCode.value || '').trim()
  if (!code) return
  handleCode(code)
}

function goBack() {
  emitResult({ success: false, error: 'cancelled' })
  uni.navigateBack()
}
</script>

<style scoped lang="scss">
.page {
  width: 100%;
  /* #ifdef H5 */
  position: fixed;
  inset: 0;
  height: 100%;
  padding-top: constant(safe-area-inset-top);
  padding-top: env(safe-area-inset-top);
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
  /* #endif */
  /* #ifndef H5 */
  min-height: 100vh;
  height: 100vh;
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
  /* #endif */
  background: #ffffff;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

/* #ifdef H5 */
.nav-bar {
  padding-top: 44rpx;
  height: 88rpx;
  padding-left: 24rpx;
  padding-right: 24rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #ffffff;
  border-bottom: 2rpx solid rgba(17, 17, 17, 0.06);
  flex-shrink: 0;
}
/* #endif */

.nav-left,
.nav-right {
  width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-back {
  width: 44rpx;
  height: 44rpx;
  display: block;
}

.nav-title {
  font-size: 32rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.92);
}

.status-bar {
  padding: 18rpx 28rpx;
  background: rgba(61, 106, 251, 0.08);
}

.status-text {
  font-size: 26rpx;
  font-weight: 800;
  color: #3d6afb;
}

.wv {
  flex: 1;
  width: 100%;
  min-height: 0;
}

.empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
}

.empty-text {
  font-size: 28rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.45);
}

.oob-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  padding-top: constant(safe-area-inset-top);
  padding-top: env(safe-area-inset-top);
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
  background: rgba(17, 17, 17, 0.48);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  box-sizing: border-box;
}

.oob-card {
  width: 680rpx;
  max-width: calc(100% - 48rpx);
  border-radius: 28rpx;
  background: #ffffff;
  padding: 34rpx 28rpx 26rpx;
}

.oob-title {
  display: block;
  text-align: center;
  font-size: 34rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.92);
}

.oob-desc {
  display: block;
  margin-top: 14rpx;
  text-align: center;
  font-size: 26rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.72);
  line-height: 38rpx;
}

.oob-input-wrap {
  margin-top: 22rpx;
  background: rgba(17, 17, 17, 0.04);
  border-radius: 20rpx;
  padding: 18rpx 20rpx;
  min-height: 160rpx;
}

.oob-input {
  width: 100%;
  min-height: 124rpx;
  font-size: 28rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.92);
}

.oob-ph {
  color: rgba(17, 17, 17, 0.4);
  font-size: 26rpx;
  font-weight: 800;
}

.oob-actions {
  margin-top: 22rpx;
  display: flex;
  gap: 18rpx;
}

.oob-btn {
  flex: 1;
  height: 88rpx;
  border-radius: 9999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.oob-btn-outline {
  background: rgba(61, 106, 251, 0.12);
}

.oob-btn-primary {
  background: #3d6afb;
}

.oob-btn-primary.is-disabled {
  background: rgba(61, 106, 251, 0.45);
}

.oob-btn-outline-text {
  font-size: 30rpx;
  font-weight: 900;
  color: #3d6afb;
}

.oob-btn-primary-text {
  font-size: 30rpx;
  font-weight: 900;
  color: #ffffff;
}

.oob-hint {
  display: block;
  margin-top: 18rpx;
  text-align: center;
  font-size: 24rpx;
  font-weight: 800;
}
</style>
