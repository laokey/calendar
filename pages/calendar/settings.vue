<template>
  <view class="bl-page">
    <BlHeader title="日历设置" back />

    <text class="hint">创建您的专属芝麻日历电子邮箱</text>

    <view class="bl-input">
      <input v-model="localPart" class="bl-input-field" placeholder="设备名称" placeholder-class="ph" />
      <view class="bl-input-suffix" @click="cycleDomain">
        <text>{{ domain }}</text>
        <text class="down">▾</text>
      </view>
    </view>

    <view class="save-wrap">
      <view class="bl-btn-primary" :class="{ 'is-disabled': !canSave }" @click="save">
        <text>保存</text>
      </view>
    </view>

    <BlToast :visible="toast.visible" :type="toast.type" :text="toast.text" />
  </view>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import BlHeader from '../../components/BlHeader.vue'
import BlToast from '../../components/BlToast.vue'

const localPart = ref('')
const domains = ['@qq.com', '@gmail.com', '@icloud.com']
const domainIndex = ref(0)
const toast = reactive({ visible: false, type: 'loading', text: '' })

const domain = computed(() => domains[domainIndex.value])
const canSave = computed(() => localPart.value.trim().length > 0)

function cycleDomain() {
  domainIndex.value = (domainIndex.value + 1) % domains.length
}

function showToast(type, text) {
  toast.type = type
  toast.text = text
  toast.visible = true
  setTimeout(() => {
    toast.visible = false
  }, 900)
}

function save() {
  if (!canSave.value) return
  toast.type = 'loading'
  toast.text = '加载中'
  toast.visible = true

  const value = localPart.value.trim()
  setTimeout(() => {
    toast.visible = false
    if (value === '23456788897') {
      showToast('error', '邮箱已存在')
      return
    }
    if (value === '000') {
      showToast('error', '平台邮箱不存在')
      return
    }
    uni.navigateTo({ url: '/pages/calendar/pending' })
  }, 800)
}
</script>

<style scoped lang="scss">
.hint {
  display: block;
  padding: 12rpx 8rpx 18rpx;
  font-size: 28rpx;
  font-weight: 700;
  color: rgba(17, 17, 17, 0.7);
}

.down {
  font-size: 28rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.65);
}

.ph {
  color: rgba(17, 17, 17, 0.35);
  font-weight: 700;
}

.save-wrap {
  margin-top: 26rpx;
}
</style>

