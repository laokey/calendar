<template>
  <view class="bl-page">
    <BlHeader title="查找现有日历" back />

    <text class="hint">通过输入他们唯一的芝麻日历邮箱，搜索亲人的日历。</text>

    <view class="bl-input">
      <input v-model="localPart" class="bl-input-field" placeholder="23456788897" placeholder-class="ph" />
      <view class="clear" v-if="localPart" @click="localPart = ''"><text class="x">×</text></view>
      <view class="bl-input-suffix">
        <text>@qq.com</text>
        <text class="down">▾</text>
      </view>
    </view>

    <view class="search-wrap">
      <view class="bl-btn-primary" :class="{ 'is-disabled': !canSearch }" @click="search">
        <text>搜索</text>
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
const toast = reactive({ visible: false, type: 'loading', text: '' })
const canSearch = computed(() => localPart.value.trim().length > 0)

function search() {
  if (!canSearch.value) return
  toast.type = 'loading'
  toast.text = '加载中'
  toast.visible = true
  const value = localPart.value.trim()
  setTimeout(() => {
    toast.visible = false
    if (value === '23456788897') {
      uni.navigateTo({ url: '/pages/calendar/yyo?active=1' })
      return
    }
    toast.type = 'error'
    toast.text = '未找到'
    toast.visible = true
    setTimeout(() => {
      toast.visible = false
    }, 900)
  }, 700)
}
</script>

<style scoped lang="scss">
.hint {
  display: block;
  padding: 12rpx 8rpx 18rpx;
  font-size: 28rpx;
  font-weight: 700;
  color: rgba(17, 17, 17, 0.7);
  line-height: 40rpx;
}

.ph {
  color: rgba(17, 17, 17, 0.35);
  font-weight: 700;
}

.down {
  font-size: 28rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.65);
}

.clear {
  width: 48rpx;
  height: 48rpx;
  border-radius: 9999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(17, 17, 17, 0.55);
}

.x {
  font-size: 34rpx;
  font-weight: 900;
  line-height: 1;
}

.search-wrap {
  margin-top: 26rpx;
}
</style>

