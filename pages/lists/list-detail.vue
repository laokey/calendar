<template>
  <view class="bl-page detail-page">
    <BlHeader :title="listTitle" back>
      <template #right>
        <view class="hdr-actions">
          <view class="hdr-btn" @click="goEdit">
            <image
              class="hdr-icon"
              src="/static/common/icon_edit.png"
              mode="aspectFit"
            />
          </view>
          <view class="hdr-btn" @click="confirmDeleteOpen = true">
            <image
              class="hdr-icon"
              src="/static/task/icon_trash_red.png"
              mode="aspectFit"
            />
          </view>
        </view>
      </template>
    </BlHeader>

    <view v-if="allItems.length > 0" class="add-row" @click="openAdd">
      <text class="add-plus">＋</text>
      <text class="add-text">添加事项</text>
    </view>

    <view v-if="undoneItems.length" class="items">
      <view v-for="it in undoneItems" :key="it.id" class="item">
        <view class="left" @click="toggleDone(it.id)">
          <image
            class="op-icon"
            src="/static/common/icon_radio_off.png"
            mode="aspectFit"
          />
          <text class="text">{{ it.text }}</text>
        </view>
        <view class="ops">
          <view class="op edit" @click.stop="openEdit(it)">
            <image
              class="op-icon"
              src="/static/common/icon_edit_blue.png"
              mode="aspectFit"
            />
          </view>
          <view class="op del" @click.stop="delItem(it.id)">
            <image
              class="op-icon"
              src="/static/task/icon_close.png"
              mode="aspectFit"
            />
          </view>
        </view>
      </view>
    </view>

    <view v-else-if="allItems.length === 0" class="empty">
      <view class="empty-illus">
        <image class="empty-img" src="/static/list/bg_none_item.png" mode="aspectFit" />
      </view>
      <text class="empty-text bl-muted">没有清单事项，快去添加事项！</text>
      <view class="empty-action" @click="openAdd">
        <text class="empty-action-text">添加事项</text>
        <image class="empty-action-icon" src="/static/task/icon_plus_circle.png" mode="aspectFit" />
      </view>
    </view>

    <view v-if="doneItems.length" class="done">
      <text class="done-title">已完成</text>
      <view v-if="showCompleted" class="done-items">
        <view
          v-for="it in doneItems"
          :key="it.id"
          class="done-item"
          @click="toggleDone(it.id)"
        >
          <image
            class="done-check-img"
            src="/static/task/icon_check_circle_blue.png"
            mode="aspectFit"
          />
          <text class="done-text">{{ it.text }}</text>
        </view>
      </view>
    </view>

    <view
      class="bottom"
      :class="{ disabled: doneItems.length === 0, on: showCompleted }"
      @click="toggleShowCompleted"
    >
      <text class="bottom-text">{{ bottomLabel }}</text>
    </view>

    <view v-if="itemSheetOpen" class="sheet-mask" @click.self="closeItemSheet">
      <view class="sheet">
        <text class="sheet-title">{{ sheetTitle }}</text>
        <view class="sheet-input">
          <input
            v-model="itemText"
            class="sheet-field"
            placeholder="输入事项"
            placeholder-class="ph"
          />
          <view v-if="itemText" class="sheet-clear" @click="itemText = ''"
            ><text class="sheet-clear-text">×</text></view
          >
        </view>
        <view class="sheet-actions">
          <view class="sheet-btn cancel" @click="closeItemSheet"
            ><text class="sheet-btn-text">取消</text></view
          >
          <view
            class="sheet-btn ok"
            :class="{ disabled: !canConfirmItem }"
            @click="confirmItem"
          >
            <text class="sheet-btn-text ok-text">确认</text>
          </view>
        </view>
      </view>
    </view>

    <view
      v-if="confirmDeleteOpen"
      class="dialog-mask"
      @click.self="confirmDeleteOpen = false"
    >
      <view class="dialog">
        <text class="dialog-title">删除列表</text>
        <text class="dialog-sub">你确定要删除清单吗？</text>
        <view class="dialog-actions">
          <view class="dialog-btn cancel" @click="confirmDeleteOpen = false"
            ><text class="dialog-btn-text">取消</text></view
          >
          <view class="dialog-btn danger" @click="deleteThisList"
            ><text class="dialog-btn-text danger-text">删除</text></view
          >
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import BlHeader from '../../components/BlHeader.vue'
import {
  addItemInfo,
  deleteItemInfo,
  deleteItemTypeInfo,
  getItemListByType,
  getItemTypeList,
  updateItemInfo,
} from '../../utils/api/tasks'

const SHOW_COMPLETED_KEY = 'list_show_completed_v1'

const listId = ref('')
const listTitle = ref('')
const remoteList = ref(null)
const allItems = ref([])

const itemSheetOpen = ref(false)
const editingItemId = ref('')
const itemText = ref('')

const confirmDeleteOpen = ref(false)
const showCompletedState = ref(true)

function loadShowCompleted(listKey) {
  try {
    const raw = uni.getStorageSync(SHOW_COMPLETED_KEY)
    const obj = typeof raw === 'string' ? JSON.parse(raw || '{}') : raw
    const value = obj && typeof obj === 'object' ? obj[listKey] : undefined
    return typeof value === 'boolean' ? value : true
  } catch (e) {
    return true
  }
}

function saveShowCompleted(listKey, show) {
  try {
    const raw = uni.getStorageSync(SHOW_COMPLETED_KEY)
    const obj = raw && typeof raw === 'string' ? JSON.parse(raw || '{}') : raw && typeof raw === 'object' ? raw : {}
    uni.setStorageSync(SHOW_COMPLETED_KEY, JSON.stringify({ ...(obj || {}), [listKey]: !!show }))
  } catch (e) {}
}

async function refresh() {
  if (!listId.value) return
  try {
    const [types, items] = await Promise.all([
      getItemTypeList(),
      getItemListByType({ typeId: listId.value }),
    ])
    const current = types.find((x) => x.id === listId.value) || null
    if (!current) {
      uni.navigateBack()
      return
    }
    remoteList.value = current
    listTitle.value = current.title || listTitle.value
    allItems.value = items
    showCompletedState.value = loadShowCompleted(listId.value)
  } catch (e) {}
}

onShow(() => {
  refresh()
})

onLoad((options) => {
  listId.value = options && options.id ? String(options.id) : ''
  listTitle.value = options && options.title ? decodeURIComponent(String(options.title)) : ''
  showCompletedState.value = loadShowCompleted(listId.value)
  if (!listId.value) {
    uni.navigateBack()
    return
  }
  refresh()
})

const showCompleted = computed(() => showCompletedState.value)
const undoneItems = computed(() => allItems.value.filter((x) => !x.done))
const doneItems = computed(() => allItems.value.filter((x) => x.done))

const bottomLabel = computed(() => {
  if (doneItems.value.length === 0) return '显示已勾选事项'
  return showCompleted.value ? '隐藏已勾选事项' : '显示已勾选事项'
})

const sheetTitle = computed(() =>
  editingItemId.value ? '修改事项' : '添加事项',
)
const canConfirmItem = computed(() => !!String(itemText.value || '').trim())

function openAdd() {
  editingItemId.value = ''
  itemText.value = ''
  itemSheetOpen.value = true
}

function openEdit(it) {
  editingItemId.value = it.id
  itemText.value = it.text || ''
  itemSheetOpen.value = true
}

function closeItemSheet() {
  itemSheetOpen.value = false
  editingItemId.value = ''
  itemText.value = ''
}

async function confirmItem() {
  if (!canConfirmItem.value || !listId.value) return
  try {
    if (editingItemId.value) {
      const current = allItems.value.find((x) => x.id === editingItemId.value)
      await updateItemInfo({
        itemId: editingItemId.value,
        itemName: itemText.value,
        status: current && current.done ? 1 : 0,
      })
    } else {
      await addItemInfo({ typeId: listId.value, itemName: itemText.value })
    }
    closeItemSheet()
    refresh()
  } catch (e) {}
}

async function delItem(id) {
  try {
    await deleteItemInfo({ itemId: id })
    refresh()
  } catch (e) {}
}

async function toggleDone(id) {
  const current = allItems.value.find((x) => x.id === id)
  if (!current) return
  try {
    await updateItemInfo({
      itemId: id,
      itemName: current.text,
      status: current.done ? 0 : 1,
    })
    refresh()
  } catch (e) {}
}

function toggleShowCompleted() {
  if (doneItems.value.length === 0 || !listId.value) return
  const next = !showCompleted.value
  showCompletedState.value = next
  saveShowCompleted(listId.value, next)
}

function goEdit() {
  if (!listId.value) return
  const title = encodeURIComponent(String(listTitle.value || ''))
  const color = encodeURIComponent(String((remoteList.value && remoteList.value.color) || ''))
  uni.navigateTo({ url: `/pages/lists/list-form?id=${listId.value}&title=${title}&color=${color}` })
}

async function deleteThisList() {
  if (!listId.value) return
  try {
    await deleteItemTypeInfo({ typeId: listId.value })
    confirmDeleteOpen.value = false
    uni.reLaunch({ url: '/pages/lists/index' })
  } catch (e) {}
}
</script>

<style scoped lang="scss">
.detail-page {
  padding-bottom: 220rpx;
  background: #ffffff;
  min-height: 100vh;
  box-sizing: border-box;
}

.hdr-actions {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.hdr-btn {
  width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hdr-icon {
  width: 34rpx;
  height: 34rpx;
  display: block;
}

.add-row {
  margin-top: 10rpx;
  height: 98rpx;
  border-radius: 24rpx;
  background: #eef4ff;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
}

.add-plus {
  font-size: 36rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.9);
}

.add-text {
  font-size: 30rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.9);
}

.items {
  margin-top: 14rpx;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.item {
  height: 96rpx;
  border-radius: 22rpx;
  background: #fafafa;
  padding: 0 22rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.left {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 14rpx;
  min-width: 0;
}

.circle {
  width: 32rpx;
  height: 32rpx;
  border-radius: 999rpx;
  border: 3rpx solid rgba(17, 17, 17, 0.18);
  background: rgba(255, 255, 255, 0.9);
}

.text {
  flex: 1;
  font-size: 30rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.9);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ops {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.op {
  width: 66rpx;
  height: 66rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.op-icon {
  width: 34rpx;
  height: 34rpx;
  display: block;
}

.empty {
  margin-top: 220rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18rpx;
}

.empty-illus {
  width: 220rpx;
  height: 220rpx;
  border-radius: 999rpx;
  background: rgba(17, 17, 17, 0.04);
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-img {
  width: 210rpx;
  height: 210rpx;
  display: block;
}

.empty-text {
  font-size: 28rpx;
  font-weight: 800;
}

.empty-action {
  margin-top: 8rpx;
  height: 84rpx;
  padding: 0 22rpx 0 30rpx;
  border-radius: 999rpx;
  background: #3d6afb;
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.empty-action-text {
  color: #ffffff;
  font-size: 30rpx;
  font-weight: 900;
}

.empty-action-icon {
  width: 52rpx;
  height: 52rpx;
  display: block;
}

.done {
  margin-top: 24rpx;
}

.done-title {
  display: block;
  font-size: 28rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.55);
}

.done-items {
  margin-top: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.done-item {
  height: 104rpx;
  border-radius: 24rpx;
  background: #eef4ff;
  padding: 0 22rpx;
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.done-check-img {
  width: 42rpx;
  height: 42rpx;
  display: block;
}

.done-text {
  font-size: 30rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.9);
}

.bottom {
  position: fixed;
  left: 28rpx;
  right: 28rpx;
  bottom: 34rpx;
  height: 104rpx;
  border-radius: 999rpx;
  background: #3d6afb;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bottom.disabled {
  background: #d9d9d9;
}

.bottom-text {
  color: #ffffff;
  font-size: 34rpx;
  font-weight: 900;
}

.bottom.disabled .bottom-text {
  color: rgba(17, 17, 17, 0.45);
}

.sheet-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: flex-end;
  z-index: 999;
}

.sheet {
  width: 100%;
  background: #ffffff;
  border-top-left-radius: 28rpx;
  border-top-right-radius: 28rpx;
  padding: 26rpx 26rpx 36rpx;
}

.sheet-title {
  display: block;
  text-align: center;
  font-size: 34rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.95);
}

.sheet-input {
  margin-top: 20rpx;
  height: 96rpx;
  border-radius: 24rpx;
  background: rgba(17, 17, 17, 0.04);
  padding: 0 18rpx;
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.sheet-field {
  flex: 1;
  font-size: 34rpx;
  font-weight: 900;
  color: #111111;
}

.ph {
  color: rgba(17, 17, 17, 0.35);
}

.sheet-clear {
  width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.sheet-clear-text {
  font-size: 44rpx;
  font-weight: 700;
  color: rgba(17, 17, 17, 0.45);
}

.sheet-actions {
  margin-top: 22rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.sheet-btn {
  flex: 1;
  height: 96rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sheet-btn.cancel {
  background: #eef2ff;
}

.sheet-btn.ok {
  background: #3d6afb;
}

.sheet-btn.ok.disabled {
  background: #d7d7d7;
}

.sheet-btn-text {
  font-size: 34rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.75);
}

.ok-text {
  color: #ffffff;
}

.sheet-btn.ok.disabled .ok-text {
  color: rgba(17, 17, 17, 0.45);
}

.dialog-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  width: 620rpx;
  background: #ffffff;
  border-radius: 24rpx;
  padding: 28rpx 26rpx 26rpx;
}

.dialog-title {
  display: block;
  text-align: center;
  font-size: 36rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.95);
}

.dialog-sub {
  margin-top: 16rpx;
  display: block;
  text-align: center;
  font-size: 28rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.6);
}

.dialog-actions {
  margin-top: 22rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.dialog-btn {
  flex: 1;
  height: 88rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dialog-btn.cancel {
  background: #eef2ff;
}

.dialog-btn.danger {
  background: #3d6afb;
}

.dialog-btn-text {
  font-size: 32rpx;
  font-weight: 900;
  color: #3d6afb;
}

.danger-text {
  color: #ffffff;
}
</style>
