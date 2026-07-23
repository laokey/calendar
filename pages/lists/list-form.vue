<template>
  <view class="bl-page form-page">
    <BlHeader :title="pageTitle" back />

    <view class="bl-card title-card">
      <view class="bl-input">
        <input v-model="title" class="bl-input-field" :placeholder="$t('清单名称')" placeholder-class="ph" />
        <view v-if="title" class="clear" @click="title = ''"><text class="clear-text">×</text></view>
      </view>
    </view>

    <view class="bl-card colors-card">
      <text class="sec-title">{{ $t('选择颜色') }}</text>
      <view class="colors">
        <view v-for="c in colors" :key="c" class="dot" :style="{ background: c }" @click="color = c">
          <view v-if="color === c" class="dot-check"><text class="dot-check-text">✓</text></view>
        </view>
      </view>
    </view>

    <view class="bottom-save" @click="save">
      <text class="bottom-save-text">{{ $t('保存') }}</text>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import BlHeader from '../../components/BlHeader.vue'
import { addItemTypeInfo, getItemTypeList, updateItemTypeInfo } from '../../utils/api/tasks'

const listId = ref('')
const title = ref('')
const color = ref('#f0ad4e')
const saving = ref(false)

const colors = [
  '#f7c84f',
  '#f0ad4e',
  '#ff7a7f',
  '#ff4b3f',
  '#8ae36b',
  '#4cc38a',
  '#0ebf5c',
  '#25c6da',
  '#7cc7ff',
  '#4c8dff',
  '#b08cff',
  '#9b59ff',
  '#ff76e8',
  '#c218d4',
]

const pageTitle = computed(() => (listId.value ? uni.$t('修改清单') : uni.$t('添加清单')))

async function initEditData(id) {
  try {
    const list = await getItemTypeList()
    const current = list.find((x) => x.id === id)
    if (current) {
      title.value = current.title || ''
      color.value = current.color || color.value
    }
  } catch (e) {}
}

onLoad((options) => {
  const id = options && options.id ? String(options.id) : ''
  if (!id) return
  listId.value = id
  title.value = options && options.title ? decodeURIComponent(String(options.title)) : ''
  color.value = options && options.color ? decodeURIComponent(String(options.color)) : color.value
  initEditData(id)
})

function validate() {
  if (!String(title.value || '').trim()) {
    uni.showToast({ title: uni.$t('请输入清单名称'), icon: 'none' })
    return false
  }
  return true
}

async function save() {
  if (!validate()) return
  if (saving.value) return
  saving.value = true
  try {
    if (listId.value) {
      await updateItemTypeInfo({ typeId: listId.value, typeName: title.value, typeColor: color.value })
    } else {
      await addItemTypeInfo({ typeName: title.value, typeColor: color.value })
    }
    uni.navigateBack()
  } catch (e) {
  } finally {
    saving.value = false
  }
}
</script>

<style scoped lang="scss">
.form-page {
  padding-bottom: 240rpx;
  background: #ffffff;
  min-height: 100vh;
  box-sizing: border-box;
}

.title-card {
  // padding: 28rpx;
  background: #fafafa;
  box-shadow: none;
}

.bl-input-field {
  min-width: 0;
}

.ph {
  color: rgba(17, 17, 17, 0.35);
}

.clear {
  width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.clear-text {
  font-size: 44rpx;
  font-weight: 700;
  color: rgba(17, 17, 17, 0.45);
}

.colors-card {
  margin-top: 18rpx;
  background: #fafafa;
  box-shadow: none;
}

.sec-title {
  display: block;
  font-size: 30rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.9);
}

.colors {
  margin-top: 18rpx;
  display: flex;
  flex-wrap: wrap;
  gap: 18rpx;
}

.dot {
  width: 76rpx;
  height: 76rpx;
  border-radius: 999rpx;
  box-shadow: 0 10rpx 26rpx rgba(17, 17, 17, 0.12);
  position: relative;
}

.dot-check {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dot-check-text {
  font-size: 32rpx;
  font-weight: 900;
  color: #ffffff;
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
