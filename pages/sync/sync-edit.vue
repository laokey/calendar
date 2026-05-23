<template>
  <view class="bl-page page">
    <BlHeader title="编辑日历" back back-icon-src="/static/sync/icon_nav_back_small.png">
      <template #right>
        <text class="save" @click="save">保存</text>
      </template>
    </BlHeader>

    <view class="card top-card">
      <image class="icon" :src="iconSrc" mode="aspectFit" />
      <view class="meta">
        <text class="label">{{ topLabel }}</text>
        <text class="value bl-muted">{{ topValue }}</text>
      </view>
    </view>

    <view class="card form-card">
      <view class="row">
        <text class="req">*</text>
        <text class="label">姓名</text>
      </view>
      <input v-model="name" class="input" :placeholder="placeholder" placeholder-class="ph" />
    </view>

    <view class="bottom-action">
      <view class="btn-danger" @click="cancelSync"><text class="btn-danger-text">取消同步</text></view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import BlHeader from '../../components/BlHeader.vue'
import { ensureSyncState, findSynced, removeSynced, updateSyncedName } from '../../utils/syncStore'

const id = ref('')
const item = ref(null)
const name = ref('')

onLoad((options) => {
  id.value = String(options && options.id ? options.id : '')
  const state = ensureSyncState()
  item.value = findSynced(state, id.value)
  name.value = item.value && item.value.name ? String(item.value.name) : ''
})

const iconSrc = computed(() => {
  const p = item.value && item.value.provider ? item.value.provider : ''
  if (p === 'outlook') return '/static/sync/logo_outlook.png'
  if (p === 'url') return '/static/sync/icon_calendar_url.png'
  return '/static/sync/logo_google_calendar.png'
})

const topLabel = computed(() => {
  const t = item.value && item.value.type ? item.value.type : ''
  if (t === 'url') return '日历链接'
  return '邮箱地址'
})

const topValue = computed(() => {
  if (!item.value) return ''
  if (item.value.type === 'url') return String(item.value.url || '')
  return String(item.value.email || '')
})

const placeholder = computed(() => (name.value ? '' : topValue.value))

function save() {
  if (!item.value) return
  const v = String(name.value || '').trim()
  if (!v) {
    uni.showToast({ title: '请输入姓名', icon: 'none' })
    return
  }
  const state = ensureSyncState()
  updateSyncedName(state, id.value, v)
  uni.navigateBack()
}

function cancelSync() {
  if (!item.value) return
  const state = ensureSyncState()
  removeSynced(state, id.value)
  uni.navigateBack()
}
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: #ffffff;
  padding-bottom: 220rpx;
}

.save {
  font-size: 28rpx;
  font-weight: 900;
  color: #3d6afb;
}

.card {
  background: rgba(17, 17, 17, 0.04);
  border-radius: 22rpx;
  padding: 22rpx;
}

.top-card {
  display: flex;
  align-items: center;
  gap: 18rpx;
  margin-top: 10rpx;
}

.icon {
  width: 66rpx;
  height: 66rpx;
  display: block;
  flex-shrink: 0;
}

.meta {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  min-width: 0;
}

.label {
  font-size: 30rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.92);
}

.value {
  font-size: 24rpx;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.form-card {
  margin-top: 18rpx;
}

.row {
  display: flex;
  align-items: center;
  gap: 6rpx;
  margin-bottom: 16rpx;
}

.req {
  font-size: 26rpx;
  font-weight: 900;
  color: #ff3b30;
}

.input {
  width: 100%;
  font-size: 30rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.92);
}

.ph {
  color: rgba(17, 17, 17, 0.35);
  font-weight: 700;
}

.bottom-action {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 20rpx 28rpx calc(20rpx + env(safe-area-inset-bottom));
  background: #ffffff;
}

.btn-danger {
  width: 100%;
  height: 96rpx;
  border-radius: 9999rpx;
  background: #ff3b30;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-danger-text {
  font-size: 34rpx;
  font-weight: 900;
  color: #ffffff;
}
</style>

