<template>
  <view class="bl-page">
    <BlHeader title="添加设备" back />

    <view class="panel">
      <text class="label">设备邮箱</text>
      <view class="input-wrap">
        <input
          v-model="deviceEmail"
          type="email"
          class="input"
          placeholder="请输入设备邮箱"
          placeholder-class="ph"
          confirm-type="done"
          @confirm="submit"
          @blur="onEmailBlur"
        />
        <view v-if="deviceEmail" class="icon-btn" @click="deviceEmail = ''">
          <text class="icon-text">×</text>
        </view>
      </view>
      <text class="tip bl-muted">示例：565656556@zmkh.com</text>
    </view>

    <view class="bl-btn-primary" :class="{ disabled: !canSubmit }" @click="submit">
      <text>{{ mode === 'create' ? '创建并获取激活码' : '申请绑定' }}</text>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import BlHeader from '../../components/BlHeader.vue'
import { deviceApi } from '../../utils/api'

const mode = ref('bind')
const deviceEmail = ref('')

onLoad((options) => {
  const m = options && options.mode ? String(options.mode) : ''
  mode.value = m === 'create' ? 'create' : 'bind'
})

const canSubmit = computed(() => deviceEmail.value.trim().length > 0)

function isEmail(value) {
  const v = String(value || '').trim()
  if (!v) return false
  return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(v)
}

function validateEmail() {
  const v = deviceEmail.value.trim()
  if (!v) return false
  if (isEmail(v)) return true
  uni.showToast({ title: '设备邮箱格式不正确', icon: 'none' })
  return false
}

function onEmailBlur() {
  if (!deviceEmail.value.trim()) return
  validateEmail()
}

async function submit() {
  if (!canSubmit.value) return
  if (!validateEmail()) return
  const email = deviceEmail.value.trim()
  uni.showLoading({ title: mode.value === 'create' ? '创建中' : '申请中' })
  try {
    if (mode.value === 'create') {
      const res = await deviceApi.createCalendarDevice(email)
      if (res && typeof res === 'object' && res.code !== undefined && res.code !== 200 && res.code !== '200') {
        if (res.code === 201 || res.code === '201') {
          uni.showToast({ title: '用户不存在', icon: 'none' })
          return
        }
        if (res.code === 202 || res.code === '202') {
          uni.showToast({ title: '日历设备已创建', icon: 'none' })
          return
        }
        uni.showToast({ title: '创建设备失败', icon: 'none' })
        return
      }
      const code = res && typeof res === 'object' ? String(res.activationCode || res.codeValue || res.activation_code || '') : ''
      if (code) {
        uni.redirectTo({ url: `/pages/device/activate?code=${encodeURIComponent(code)}` })
        return
      }
      uni.showToast({ title: '创建成功', icon: 'none' })
      uni.redirectTo({ url: '/pages/device/index' })
      return
    }

    const res = await deviceApi.bindCalendarDevice(email)
    if (res && typeof res === 'object' && res.code !== undefined && res.code !== 200 && res.code !== '200') {
      if (res.code === 201 || res.code === '201') {
        uni.showToast({ title: '用户不存在', icon: 'none' })
        return
      }
      if (res.code === 202 || res.code === '202') {
        uni.showToast({ title: '日历设备不存在', icon: 'none' })
        return
      }
      if (res.code === 203 || res.code === '203') {
        uni.showToast({ title: '申请绑定失败', icon: 'none' })
        return
      }
      uni.showToast({ title: '申请绑定失败', icon: 'none' })
      return
    }
    uni.showToast({ title: '申请绑定成功，等待审核', icon: 'none' })
    uni.redirectTo({ url: '/pages/device/index' })
  } catch (e) {
    uni.showToast({ title: String((e && e.message) || '操作失败'), icon: 'none' })
  } finally {
    try {
      uni.hideLoading()
    } catch (e) {}
  }
}
</script>

<style scoped lang="scss">
.panel {
  margin-top: 12rpx;
  background: #ffffff;
  border-radius: 28rpx;
  padding: 24rpx 22rpx;
  box-shadow: 0 10rpx 26rpx rgba(17, 17, 17, 0.06);
}

.label {
  display: block;
  font-size: 30rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.78);
  padding: 0 6rpx 14rpx;
}

.input-wrap {
  height: 98rpx;
  border-radius: 22rpx;
  background: #fafafa;
  padding: 0 18rpx;
  display: flex;
  align-items: center;
  gap: 10rpx;
  border: 2rpx solid rgba(17, 17, 17, 0.06);
}

.input {
  flex: 1;
  font-size: 34rpx;
  font-weight: 700;
  color: #111111;
}

.bl-btn-primary {
  margin-top: 26rpx;
}

.bl-btn-primary.disabled {
  background: rgba(17, 17, 17, 0.18);
}

.ph {
  color: rgba(17, 17, 17, 0.35);
  font-weight: 650;
}

.icon-btn {
  width: 56rpx;
  height: 56rpx;
  border-radius: 9999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-text {
  font-size: 40rpx;
  line-height: 1;
  color: rgba(17, 17, 17, 0.45);
}

.tip {
  display: block;
  margin-top: 14rpx;
  padding: 0 6rpx;
  font-size: 24rpx;
  font-weight: 600;
}
</style>
