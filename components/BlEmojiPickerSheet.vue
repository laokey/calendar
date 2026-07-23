<template>
  <BlSheet :model-value="modelValue" headless @update:modelValue="emit('update:modelValue', $event)">
    <view class="picker" @click.stop>
      <view class="search">
        <view class="search-left">
          <text class="search-ico">🔍</text>
          <input v-model="query" class="search-input" :placeholder="$t('搜索')" placeholder-class="ph" />
        </view>
        <view v-if="query" class="search-clear" @click="query = ''"><text class="search-clear-text">×</text></view>
      </view>

      <view class="section">
        <text class="section-title">{{ sectionTitle }}</text>
      </view>

      <scroll-view class="grid-scroll" scroll-y>
        <view class="grid">
          <view v-for="it in visibleEmojis" :key="it.emoji" class="cell" @click="pick(it.emoji)">
            <text class="cell-text">{{ it.emoji }}</text>
          </view>
        </view>
      </scroll-view>

      <view class="tabs">
        <view v-for="t in tabs" :key="t.key" class="tab" :class="{ on: tab === t.key }" @click="onTab(t.key)">
          <text class="tab-ico">{{ t.icon }}</text>
        </view>
      </view>
    </view>
  </BlSheet>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import BlSheet from './BlSheet.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  value: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue', 'pick'])

const STORAGE_KEY = 'emoji_recent'
const MAX_RECENT = 36

const query = ref('')
const tab = ref('smileys')
const recents = ref(loadRecents())

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      query.value = ''
      recents.value = loadRecents()
      if (recents.value.length) tab.value = 'recent'
      else tab.value = 'smileys'
    }
  },
)

const tabs = [
  { key: 'recent', icon: '🕘' },
  { key: 'smileys', icon: '😀' },
  { key: 'people', icon: '🧑' },
  { key: 'nature', icon: '🐻' },
  { key: 'food', icon: '🍔' },
  { key: 'activity', icon: '⚽' },
  { key: 'travel', icon: '🚗' },
  { key: 'objects', icon: '💡' },
  { key: 'symbols', icon: '❤️' },
  { key: 'clear', icon: '⌫' },
]

const EMOJI = {
  smileys: [
    { emoji: '😀' },
    { emoji: '😃' },
    { emoji: '😄' },
    { emoji: '😁' },
    { emoji: '😆' },
    { emoji: '😅' },
    { emoji: '🤣' },
    { emoji: '😂' },
    { emoji: '🙂' },
    { emoji: '😉' },
    { emoji: '😊' },
    { emoji: '😇' },
    { emoji: '😍' },
    { emoji: '😘' },
    { emoji: '😋' },
    { emoji: '😜' },
    { emoji: '🤪' },
    { emoji: '😎' },
    { emoji: '🥳' },
    { emoji: '😤' },
    { emoji: '😢' },
    { emoji: '😭' },
    { emoji: '😱' },
    { emoji: '😴' },
    { emoji: '🤒' },
    { emoji: '🤕' },
    { emoji: '🤧' },
    { emoji: '😷' },
    { emoji: '🤩' },
    { emoji: '🤗' },
    { emoji: '🤔' },
    { emoji: '🫡' },
    { emoji: '🫶' },
    { emoji: '👍' },
    { emoji: '👎' },
    { emoji: '👏' },
    { emoji: '🙏' },
  ],
  people: [
    { emoji: '👶' },
    { emoji: '🧒' },
    { emoji: '👧' },
    { emoji: '👦' },
    { emoji: '🧑' },
    { emoji: '👩' },
    { emoji: '👨' },
    { emoji: '👵' },
    { emoji: '👴' },
    { emoji: '🧑‍🎓' },
    { emoji: '🧑‍💻' },
    { emoji: '🧑‍⚕️' },
    { emoji: '🧑‍🍳' },
    { emoji: '🧑‍🏫' },
    { emoji: '🧑‍🚒' },
    { emoji: '🧑‍✈️' },
  ],
  nature: [
    { emoji: '🐶' },
    { emoji: '🐱' },
    { emoji: '🐭' },
    { emoji: '🐰' },
    { emoji: '🦊' },
    { emoji: '🐻' },
    { emoji: '🐼' },
    { emoji: '🐨' },
    { emoji: '🐯' },
    { emoji: '🦁' },
    { emoji: '🐮' },
    { emoji: '🐷' },
    { emoji: '🐸' },
    { emoji: '🐵' },
    { emoji: '🌸' },
    { emoji: '🌿' },
    { emoji: '🍀' },
    { emoji: '🌈' },
    { emoji: '☀️' },
    { emoji: '🌙' },
    { emoji: '⭐' },
  ],
  food: [
    { emoji: '🍎' },
    { emoji: '🍓' },
    { emoji: '🍉' },
    { emoji: '🍌' },
    { emoji: '🍇' },
    { emoji: '🍔' },
    { emoji: '🍟' },
    { emoji: '🍕' },
    { emoji: '🌭' },
    { emoji: '🍗' },
    { emoji: '🍣' },
    { emoji: '🍪' },
    { emoji: '🍰' },
    { emoji: '🍫' },
    { emoji: '🧃' },
    { emoji: '🥛' },
  ],
  activity: [
    { emoji: '⚽' },
    { emoji: '🏀' },
    { emoji: '🏈' },
    { emoji: '⚾' },
    { emoji: '🎾' },
    { emoji: '🏓' },
    { emoji: '🎯' },
    { emoji: '🎮' },
    { emoji: '🎨' },
    { emoji: '🎵' },
    { emoji: '🎬' },
  ],
  travel: [
    { emoji: '🚗' },
    { emoji: '🚌' },
    { emoji: '🚇' },
    { emoji: '✈️' },
    { emoji: '🚀' },
    { emoji: '⛺' },
    { emoji: '🏠' },
    { emoji: '🏫' },
    { emoji: '🏖️' },
    { emoji: '🗺️' },
  ],
  objects: [
    { emoji: '💡' },
    { emoji: '📱' },
    { emoji: '💻' },
    { emoji: '⌚' },
    { emoji: '📷' },
    { emoji: '📚' },
    { emoji: '✏️' },
    { emoji: '🎁' },
    { emoji: '🔑' },
  ],
  symbols: [
    { emoji: '❤️' },
    { emoji: '💛' },
    { emoji: '💚' },
    { emoji: '💙' },
    { emoji: '💜' },
    { emoji: '🖤' },
    { emoji: '🤍' },
    { emoji: '✨' },
    { emoji: '✅' },
    { emoji: '❌' },
    { emoji: '⚠️' },
  ],
}

const sectionTitle = computed(() => {
  if (tab.value === 'recent') return uni.$t('最近使用')
  return uni.$t('表情与人物')
})

const activeList = computed(() => {
  if (tab.value === 'recent') return recents.value.map((e) => ({ emoji: e }))
  if (tab.value === 'people') return EMOJI.people
  if (tab.value === 'nature') return EMOJI.nature
  if (tab.value === 'food') return EMOJI.food
  if (tab.value === 'activity') return EMOJI.activity
  if (tab.value === 'travel') return EMOJI.travel
  if (tab.value === 'objects') return EMOJI.objects
  if (tab.value === 'symbols') return EMOJI.symbols
  return EMOJI.smileys
})

const visibleEmojis = computed(() => {
  const q = String(query.value || '').trim()
  if (!q) return activeList.value
  const list = activeList.value
  return list.filter((x) => String(x.emoji || '').includes(q))
})

function loadRecents() {
  try {
    const raw = uni.getStorageSync(STORAGE_KEY)
    const list = Array.isArray(raw) ? raw : JSON.parse(raw || '[]')
    return Array.isArray(list) ? list.map((x) => String(x || '')).filter(Boolean) : []
  } catch (e) {
    return []
  }
}

function saveRecents(list) {
  try {
    uni.setStorageSync(STORAGE_KEY, list)
  } catch (e) {}
}

function pushRecent(e) {
  const emoji = String(e || '').trim()
  if (!emoji) return
  const cur = loadRecents()
  const next = [emoji, ...cur.filter((x) => x !== emoji)].slice(0, MAX_RECENT)
  saveRecents(next)
  recents.value = next
}

function pick(e) {
  const emoji = String(e || '')
  if (emoji) pushRecent(emoji)
  emit('pick', emoji)
  emit('update:modelValue', false)
}

function onTab(key) {
  if (key === 'clear') {
    pick('')
    return
  }
  tab.value = key
}
</script>

<style scoped lang="scss">
.picker {
  height: 760rpx;
  display: flex;
  flex-direction: column;
}

.search {
  height: 86rpx;
  border-radius: 22rpx;
  background: rgba(17, 17, 17, 0.06);
  display: flex;
  align-items: center;
  padding: 0 18rpx 0 18rpx;
}

.search-left {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.search-ico {
  font-size: 30rpx;
  font-weight: 700;
  color: rgba(17, 17, 17, 0.55);
}

.search-input {
  flex: 1;
  font-size: 28rpx;
  font-weight: 700;
  color: rgba(17, 17, 17, 0.88);
}

.search-clear {
  width: 56rpx;
  height: 56rpx;
  border-radius: 999rpx;
  background: rgba(17, 17, 17, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-clear-text {
  font-size: 36rpx;
  font-weight: 700;
  color: rgba(17, 17, 17, 0.65);
  line-height: 1;
}

.section {
  padding: 18rpx 4rpx 10rpx;
}

.section-title {
  font-size: 20rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.45);
  letter-spacing: 2rpx;
}

.grid-scroll {
  flex: 1;
}

.grid {
  display: flex;
  flex-wrap: wrap;
  padding: 6rpx 0 10rpx;
}

.cell {
  width: 12.5%;
  height: 76rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cell-text {
  font-size: 42rpx;
  line-height: 1;
}

.tabs {
  height: 84rpx;
  border-top: 2rpx solid rgba(17, 17, 17, 0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12rpx;
}

.tab {
  width: 64rpx;
  height: 64rpx;
  border-radius: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tab.on {
  background: rgba(17, 17, 17, 0.06);
}

.tab-ico {
  font-size: 34rpx;
  line-height: 1;
}
</style>
