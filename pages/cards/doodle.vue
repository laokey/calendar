<template>
  <view class="bl-page doodle-page">
    <BlHeader :title="$t('涂鸦')" back>
      <template #right>
        <text class="top-next" @click="goNext">{{ $t('下一步') }}</text>
      </template>
    </BlHeader>

    <view class="top-tools">
      <view class="circle-btn" @click="undo"><image class="circle-ico" src="/static/card/icon-card-tool-undo.png" mode="aspectFit" /></view>
      <view class="circle-btn" @click="redo"><image class="circle-ico" src="/static/card/icon-card-tool-redo.png" mode="aspectFit" /></view>
      <view class="circle-btn right" @click="clearAll"><image class="circle-ico" src="/static/card/icon-card-tool-clear.png" mode="aspectFit" /></view>
    </view>

    <view id="canvasWrap" class="canvas-wrap" :style="{ height: canvasHeightPx + 'px' }">
      <view class="canvas-bg" :style="{ width: canvasWidthPx + 'px', height: canvasHeightPx + 'px' }">
        <canvas
          canvas-id="doodleCanvas"
          id="doodleCanvas"
          class="canvas"
          :style="{ width: canvasWidthPx + 'px', height: canvasHeightPx + 'px' }"
          disable-scroll
          @touchstart="onCanvasStart"
          @touchmove="onCanvasMove"
          @touchend="onCanvasEnd"
          @touchcancel="onCanvasEnd"
        />

        <view
          v-for="s in stickers"
          :key="s.id"
          class="sticker"
          :style="{ left: s.x + 'px', top: s.y + 'px', width: stickerSizePx(s) + 'px', height: stickerSizePx(s) + 'px' }"
          @touchstart.stop.prevent="onStickerStart($event, s.id)"
          @touchmove.stop.prevent="onStickerMove"
          @touchend.stop.prevent="onStickerEnd"
          @touchcancel.stop.prevent="onStickerEnd"
        >
          <image v-if="s.src" class="sticker-img" :src="s.src" mode="aspectFit" />
          <text v-else class="sticker-text">{{ s.emoji }}</text>
        </view>

        <view v-for="t in texts" :key="t.id" class="txt" :style="{ left: t.x + 'px', top: t.y + 'px', color: t.color }">
          <text class="txt-text">{{ t.text }}</text>
        </view>
      </view>
    </view>

    <view v-if="draggingSticker" class="trash" :class="{ active: overTrash }">
      <image class="trash-ico" src="/static/card/icon-card-trash.png" mode="aspectFit" />
      <text class="trash-text">{{ $t('拖到此处删除') }}</text>
    </view>

    <view class="bottom-tabs">
      <view class="bt" :class="{ active: tool === 'sticker' }" @click="openStickerSheet">
        <image class="bt-ico-img" src="/static/card/icon-card-tab-sticker.png" mode="aspectFit" />
        <text class="bt-text">{{ $t('贴纸') }}</text>
      </view>
      <view class="bt" :class="{ active: tool === 'brush' }" @click="toggleBrushPanel">
        <image class="bt-ico-img" src="/static/card/icon-card-tab-brush.png" mode="aspectFit" />
        <text class="bt-text">{{ $t('涂鸦') }}</text>
      </view>
      <view class="bt" :class="{ active: tool === 'text' }" @click="openTextPanel">
        <image class="bt-ico-img" src="/static/card/icon-card-tab-text.png" mode="aspectFit" />
        <text class="bt-text">{{ $t('文本') }}</text>
      </view>
    </view>

    <view v-if="stickerSheetOpen" class="sheet-mask" @click="closeStickerSheet">
      <view class="sticker-sheet" @click.stop>
        <view class="sheet-head">
          <text class="sheet-title">{{ $t('贴纸') }}</text>
          <view class="sheet-close" @click="closeStickerSheet">
            <image class="sheet-close-img" src="/static/card/icon-card-close.png" mode="aspectFit" />
          </view>
        </view>
        <view class="sheet-grid">
          <view
            v-for="e in stickerOptions"
            :key="e.id"
            class="sheet-item"
            :class="{ selected: selectedStickerId === e.id }"
            @click="selectSticker(e.id)"
          >
            <image class="sheet-item-img" :src="e.src" mode="aspectFit" />
            <image v-if="selectedStickerId === e.id" class="sheet-check" src="/static/card/icon-card-select-on.png" mode="aspectFit" />
          </view>
        </view>
        <view class="sheet-actions">
          <view class="sheet-btn ghost" @click="closeStickerSheet"><text class="sheet-btn-text ghost-text">{{ $t('取消') }}</text></view>
          <view class="sheet-btn" @click="confirmSticker"><text class="sheet-btn-text">{{ $t('完成') }}</text></view>
        </view>
      </view>
    </view>

    <view v-if="brushPanelOpen" class="panel">
      <view class="colors">
        <view v-for="c in palette" :key="c" class="c" :style="{ background: c }" @click="setBrushColor(c)">
          <view v-if="brushColor === c" class="c-check"><text class="c-check-text">✓</text></view>
        </view>
      </view>
      <view class="panel-actions">
        <view class="p-btn ghost" @click="closeBrushPanel"><text class="p-text">{{ $t('取消') }}</text></view>
        <view class="p-btn" @click="closeBrushPanel"><text class="p-text">{{ $t('完成') }}</text></view>
      </view>
    </view>

    <view v-if="textPanelOpen" class="text-panel">
      <view class="text-card" @click.stop>
        <view class="text-head">
          <text class="text-title">{{ $t('文本') }}</text>
          <view class="text-close" @click="closeTextPanel">
            <image class="text-close-img" src="/static/card/icon-card-close.png" mode="aspectFit" />
          </view>
        </view>
        <view class="text-input">
          <textarea
            v-model="textDraft"
            class="text-input-real"
            :placeholder="$t('输入你想表达的话')"
            placeholder-class="ph"
            maxlength="60"
            auto-height
            cursor-spacing="20"
          />
        </view>
        <view class="colors text-colors">
          <view v-for="c in palette" :key="`text_${c}`" class="c" :style="{ background: c }" @click="setTextColor(c)">
            <view v-if="textColor === c" class="c-check"><text class="c-check-text">✓</text></view>
          </view>
        </view>
        <view class="panel-actions">
          <view class="p-btn ghost" @click="closeTextPanel"><text class="p-text">{{ $t('取消') }}</text></view>
          <view class="p-btn" @click="confirmText"><text class="p-text">{{ $t('完成') }}</text></view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { getCurrentInstance, nextTick, onMounted, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import BlHeader from '../../components/BlHeader.vue'
import { ensureCardDraft, saveCardDraft } from '../../utils/cardStore'

const instance = getCurrentInstance()
const draft = ref(ensureCardDraft())
const tool = ref('brush')
const brushColor = ref('#111111')
const textColor = ref('#111111')
const canvasWidthPx = ref(uni.getSystemInfoSync().windowWidth - uni.upx2px(36))
const canvasHeightPx = ref(uni.upx2px(640))
const strokes = ref([])
const redoStack = ref([])
const stickers = ref([])
const texts = ref([])
const stickerSheetOpen = ref(false)
const selectedStickerId = ref('')
const brushPanelOpen = ref(false)

const stickerOptions = [
  { id: 'flower', src: '/static/card/sticker-card-flower.png', label: uni.$t('花朵') },
  { id: 'citrus', src: '/static/card/sticker-card-citrus.png', label: uni.$t('柑橘') },
  { id: 'rainbow', src: '/static/card/sticker-card-rainbow.png', label: uni.$t('彩虹') },
  { id: 'smile_badge', src: '/static/card/sticker-card-smile-badge.png', label: uni.$t('笑脸') },
  { id: 'sale_tag', src: '/static/card/sticker-card-sale-tag.png', label: uni.$t('标签') },
  { id: 'bright_side', src: '/static/card/sticker-card-bright-side.png', label: uni.$t('卡片') },
]

const palette = [
  '#ffb020',
  '#ff5a5f',
  '#ff4b3f',
  '#7ddc5a',
  '#4cc38a',
  '#00b060',
  '#00a3ff',
  '#4c8dff',
  '#3d6afb',
  '#9b59ff',
  '#6b2cff',
  '#ff4bd8',
  '#a600a6',
]

const textPanelOpen = ref(false)
const textDraft = ref('')

let ctx = null
let drawing = false
let currentStroke = null

const draggingSticker = ref(false)
const draggingStickerId = ref('')
const overTrash = ref(false)
let stickerStart = { x: 0, y: 0, cx: 0, cy: 0 }
let trashRect = { left: 0, top: 0, right: 0, bottom: 0 }

// onLoad((options) => {
//   const t = options && options.tool ? String(options.tool) : ''
//   if (t === 'text') {
//     tool.value = 'text'
//     textPanelOpen.value = true
//   } else if (t === 'sticker') {
//     openStickerSheet()
//   }
// })

onShow(() => {
  draft.value = ensureCardDraft()
  brushColor.value = draft.value?.doodle?.brushColor || '#111111'
  textColor.value = draft.value?.doodle?.textColor || '#111111'
  strokes.value = (draft.value?.doodle?.strokes || []).slice()
  redoStack.value = []
  stickers.value = (draft.value?.doodle?.stickers || []).slice()
  texts.value = (draft.value?.doodle?.texts || []).slice()
  nextTick(() => {
    measureCanvasSize()
    redraw()
  })
})

onMounted(() => {
  ctx = uni.createCanvasContext('doodleCanvas')
  setTimeout(() => {
    measureCanvasSize()
    redraw()
  }, 30)
})

function persist() {
  draft.value = saveCardDraft({
    ...draft.value,
    doodle: {
      strokes: strokes.value.slice(),
      stickers: stickers.value.slice(),
      texts: texts.value.slice(),
      brushColor: brushColor.value,
      textColor: textColor.value,
      canvasWidthPx: canvasPx().w,
      canvasHeightPx: canvasPx().h,
    },
  })
}

function setBrushColor(c) {
  brushColor.value = c
}

function setTextColor(c) {
  textColor.value = c
}

function openStickerSheet() {
  tool.value = 'sticker'
  stickerSheetOpen.value = true
  brushPanelOpen.value = false
  if (!selectedStickerId.value && stickerOptions.length) selectedStickerId.value = stickerOptions[0].id
}

function closeStickerSheet() {
  stickerSheetOpen.value = false
}

function selectSticker(id) {
  selectedStickerId.value = String(id || '')
}

function confirmSticker() {
  const id = String(selectedStickerId.value || '').trim()
  const option = stickerOptions.find((x) => x.id === id)
  if (option) addSticker(option)
  closeStickerSheet()
}

function toggleBrushPanel() {
  if (tool.value === 'brush') {
    brushPanelOpen.value = !brushPanelOpen.value
    stickerSheetOpen.value = false
    return
  }
  tool.value = 'brush'
  stickerSheetOpen.value = false
  brushPanelOpen.value = false
}

function closeBrushPanel() {
  brushPanelOpen.value = false
}

function canvasPx() {
  try {
    const w = Math.max(Number(canvasWidthPx.value) || 320, uni.upx2px(240))
    const h = Math.max(Number(canvasHeightPx.value) || w, w)
    return { w, h }
  } catch (e) {
    const h = Math.max(Number(canvasHeightPx.value) || 320, 320)
    const w = Math.max(Number(canvasWidthPx.value) || 320, 320)
    return { w, h }
  }
}

function measureCanvasSize() {
  nextTick(() => {
    const proxy = instance && instance.proxy ? instance.proxy : null
    if (!proxy) return
    const query = uni.createSelectorQuery().in(proxy)
    query.select('#canvasWrap').boundingClientRect((rect) => {
      if (!rect) return
      try {
        const info = uni.getSystemInfoSync()
        const sideGapPx = uni.upx2px(36)
        const bottomTabsPx = uni.upx2px(186)
        const safeBottom = info && info.safeAreaInsets && typeof info.safeAreaInsets.bottom === 'number' ? info.safeAreaInsets.bottom : 0
        const viewportH = info && typeof info.windowHeight === 'number' ? info.windowHeight : 0
        const viewportW = info && typeof info.windowWidth === 'number' ? info.windowWidth : uni.upx2px(640)
        const nextWidth = Math.floor(viewportW - sideGapPx)
        const nextHeight = Math.floor(viewportH - rect.top - bottomTabsPx - safeBottom)
        const minWidth = uni.upx2px(240)
        const minHeight = uni.upx2px(240)
        canvasWidthPx.value = Math.max(nextWidth, minWidth)
        canvasHeightPx.value = Math.max(nextHeight, minHeight)
        redraw()
      } catch (e) {
        canvasWidthPx.value = uni.upx2px(640)
        canvasHeightPx.value = uni.upx2px(640)
        redraw()
      }
    })
    query.exec()
  })
}

function redraw() {
  if (!ctx) return
  const { w, h } = canvasPx()
  ctx.clearRect(0, 0, w, h)
  ctx.setLineCap('round')
  ctx.setLineJoin('round')
  ;(strokes.value || []).forEach((s) => {
    if (!s || !Array.isArray(s.points) || s.points.length < 2) return
    ctx.setStrokeStyle(s.color || '#111111')
    ctx.setLineWidth(Number(s.width || 10) || 10)
    const pts = s.points
    ctx.beginPath()
    ctx.moveTo(pts[0].x, pts[0].y)
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y)
    ctx.stroke()
  })
  ctx.draw()
}

function normPoint(touch) {
  if (!touch) return { x: 0, y: 0 }
  return { x: touch.x, y: touch.y }
}

function onCanvasStart(e) {
  if (tool.value !== 'brush') return
  const touch = e?.touches?.[0]
  if (!touch) return
  drawing = true
  currentStroke = { color: brushColor.value, width: 10, points: [normPoint(touch)] }
  redoStack.value = []
}

function onCanvasMove(e) {
  if (!drawing || tool.value !== 'brush') return
  const touch = e?.touches?.[0]
  if (!touch || !currentStroke) return
  currentStroke.points.push(normPoint(touch))
  redrawWithCurrent()
}

function redrawWithCurrent() {
  if (!ctx) return
  const base = strokes.value.slice()
  const tmp = currentStroke ? [...base, currentStroke] : base
  const original = strokes.value
  strokes.value = tmp
  redraw()
  strokes.value = original
}

function onCanvasEnd() {
  if (!drawing) return
  drawing = false
  if (currentStroke && currentStroke.points && currentStroke.points.length > 1) {
    strokes.value = [...strokes.value, currentStroke]
    persist()
  }
  currentStroke = null
  redraw()
}

function undo() {
  if (drawing) return
  const list = strokes.value.slice()
  const last = list.pop()
  if (!last) return
  strokes.value = list
  redoStack.value = [...redoStack.value, last]
  persist()
  redraw()
}

function redo() {
  if (drawing) return
  const stack = redoStack.value.slice()
  const last = stack.pop()
  if (!last) return
  redoStack.value = stack
  strokes.value = [...strokes.value, last]
  persist()
  redraw()
}

function clearAll() {
  if (drawing) return
  strokes.value = []
  redoStack.value = []
  stickers.value = []
  texts.value = []
  persist()
  redraw()
}

function defaultStickerSize() {
  try {
    return uni.upx2px(72)
  } catch (e) {
    return 36
  }
}

function stickerSizePx(sticker) {
  const n = Number(sticker && sticker.size)
  return n > 0 ? n : defaultStickerSize()
}

function addSticker(option) {
  const id = `st_${Date.now()}_${Math.random().toString(16).slice(2)}`
  const px = canvasPx().w
  const size = defaultStickerSize()
  const opt = option && typeof option === 'object' ? option : {}
  stickers.value = [
    ...stickers.value,
    {
      id,
      emoji: String(opt.label || opt.emoji || ''),
      src: String(opt.src || ''),
      x: px / 2 - size / 2,
      y: px / 2 - size / 2,
      size,
    },
  ]
  persist()
}

function computeTrashRect() {
  try {
    const info = uni.getSystemInfoSync()
    const windowHeight = info && typeof info.windowHeight === 'number' ? info.windowHeight : 0
    const h = uni.upx2px(110)
    const w = uni.upx2px(500)
    const left = (info.windowWidth - w) / 2
    const top = windowHeight - h - uni.upx2px(160)
    trashRect = { left, top, right: left + w, bottom: top + h }
  } catch (err) {
    trashRect = { left: 0, top: 0, right: 0, bottom: 0 }
  }
}

function onStickerStart(e, id) {
  const touch = e?.touches?.[0]
  if (!touch) return
  const s = stickers.value.find((x) => x.id === id)
  if (!s) return
  draggingSticker.value = true
  draggingStickerId.value = id
  overTrash.value = false
  stickerStart = { x: s.x, y: s.y, cx: touch.clientX, cy: touch.clientY }
  computeTrashRect()
}

function onStickerMove(e) {
  if (!draggingSticker.value) return
  const touch = e?.touches?.[0]
  if (!touch) return
  const dx = touch.clientX - stickerStart.cx
  const dy = touch.clientY - stickerStart.cy
  const id = draggingStickerId.value
  stickers.value = stickers.value.map((s) => (s.id === id ? { ...s, x: stickerStart.x + dx, y: stickerStart.y + dy } : s))
  const inTrash = touch.clientX >= trashRect.left && touch.clientX <= trashRect.right && touch.clientY >= trashRect.top && touch.clientY <= trashRect.bottom
  overTrash.value = inTrash
}

function onStickerEnd() {
  if (!draggingSticker.value) return
  const id = draggingStickerId.value
  if (overTrash.value) {
    stickers.value = stickers.value.filter((x) => x.id !== id)
  }
  draggingSticker.value = false
  draggingStickerId.value = ''
  overTrash.value = false
  persist()
}

function openTextPanel() {
  tool.value = 'text'
  textPanelOpen.value = true
  stickerSheetOpen.value = false
  brushPanelOpen.value = false
}

function closeTextPanel() {
  textPanelOpen.value = false
  tool.value = 'brush'
  textDraft.value = ''
}

function confirmText() {
  const v = String(textDraft.value || '').trim()
  if (!v) return
  const id = `tx_${Date.now()}_${Math.random().toString(16).slice(2)}`
  texts.value = [...texts.value, { id, text: v, x: 22, y: 22, color: textColor.value }]
  persist()
  closeTextPanel()
}

function goNext() {
  persist()
  uni.navigateBack()
}
</script>

<style scoped lang="scss">
.doodle-page {
  padding-bottom: 240rpx;
  background: #ffffff;
}

.top-next {
  font-size: 30rpx;
  font-weight: 900;
  color: #3d6afb;
}

.top-tools {
  margin-top: 14rpx;
  padding: 0 18rpx;
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.circle-btn {
  width: 74rpx;
  height: 74rpx;
  border-radius: 999rpx;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
}

.circle-btn.right {
  margin-left: auto;
}

.circle-ico {
  width: 74rpx;
  height: 74rpx;
  display: block;
}

.canvas-wrap {
  margin-top: 18rpx;
  display: flex;
  justify-content: center;
  padding: 0 18rpx;
  box-sizing: border-box;
}

.canvas-bg {
  border-radius: 28rpx;
  background: #f2e9c9;
  overflow: hidden;
  position: relative;
  box-shadow: 0 10rpx 26rpx rgba(17, 17, 17, 0.06);
}

.canvas {
  display: block;
}

.sticker {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sticker-img {
  width: 100%;
  height: 100%;
  display: block;
}

.sticker-text {
  font-size: 56rpx;
}

.txt {
  position: absolute;
  max-width: 560rpx;
}

.txt-text {
  font-size: 56rpx;
  font-weight: 900;
  line-height: 70rpx;
}

.trash {
  position: fixed;
  left: 50%;
  bottom: 170rpx;
  transform: translateX(-50%);
  width: 500rpx;
  height: 110rpx;
  border-radius: 999rpx;
  background: rgba(17, 17, 17, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
}

.trash.active {
  background: rgba(255, 75, 63, 0.18);
}

.trash-ico {
  width: 40rpx;
  height: 40rpx;
  display: block;
  opacity: 0.85;
}

.trash-text {
  font-size: 28rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.6);
}

.bottom-tabs {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  height: 186rpx;
  background: rgba(255, 255, 255, 0.98);
  padding: 22rpx 28rpx 0;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 18rpx;
}

.bt {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  color: rgba(17, 17, 17, 0.65);
}

.bt.active {
  color: rgba(17, 17, 17, 0.92);
}

.bt-ico-img {
  width: 44rpx;
  height: 44rpx;
  display: block;
  opacity: 0.65;
}

.bt.active .bt-ico-img {
  opacity: 1;
}

.bt-text {
  font-size: 26rpx;
  font-weight: 800;
}

.sheet-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  z-index: 9999;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 0 22rpx 22rpx;
}

.sticker-sheet {
  width: 100%;
  border-radius: 28rpx;
  background: #ffffff;
  padding: 18rpx 18rpx 22rpx;
  box-shadow: 0 18rpx 36rpx rgba(17, 17, 17, 0.16);
}

.sheet-head {
  height: 70rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.sheet-title {
  font-size: 30rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.9);
}

.sheet-close {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sheet-close-img {
  width: 34rpx;
  height: 34rpx;
  display: block;
  opacity: 0.75;
}

.sheet-grid {
  margin-top: 10rpx;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18rpx;
}

.sheet-item {
  height: 150rpx;
  border-radius: 22rpx;
  background: rgba(17, 17, 17, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  border: 2rpx solid transparent;
}

.sheet-item.selected {
  border-color: rgba(61, 106, 251, 0.55);
  background: rgba(61, 106, 251, 0.08);
}

.sheet-item-img {
  width: 92rpx;
  height: 92rpx;
  display: block;
}

.sheet-check {
  position: absolute;
  top: 10rpx;
  left: 10rpx;
  width: 36rpx;
  height: 36rpx;
  display: block;
}

.sheet-actions {
  margin-top: 18rpx;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18rpx;
}

.sheet-btn {
  height: 92rpx;
  border-radius: 9999rpx;
  background: #3d6afb;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sheet-btn.ghost {
  background: rgba(61, 106, 251, 0.12);
}

.sheet-btn-text {
  font-size: 30rpx;
  font-weight: 900;
  color: #ffffff;
}

.sheet-btn-text.ghost-text {
  color: #3d6afb;
}

.panel {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 186rpx;
  background: rgba(255, 255, 255, 0.98);
  padding: 18rpx 28rpx 22rpx;
  box-shadow: 0 -18rpx 36rpx rgba(17, 17, 17, 0.06);
}

.colors {
  display: flex;
  flex-wrap: wrap;
  gap: 18rpx;
}

.text-colors {
  margin-top: 18rpx;
}

.c {
  width: 66rpx;
  height: 66rpx;
  border-radius: 999rpx;
  box-shadow: 0 8rpx 16rpx rgba(17, 17, 17, 0.12);
  position: relative;
}

.c-check {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.c-check-text {
  color: #ffffff;
  font-size: 30rpx;
  font-weight: 900;
}

.panel-actions {
  margin-top: 18rpx;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18rpx;
}

.p-btn {
  height: 96rpx;
  border-radius: 999rpx;
  background: #3d6afb;
  display: flex;
  align-items: center;
  justify-content: center;
}

.p-btn.ghost {
  background: rgba(61, 106, 251, 0.12);
}

.p-text {
  font-size: 32rpx;
  font-weight: 900;
  color: #ffffff;
}

.p-btn.ghost .p-text {
  color: rgba(17, 17, 17, 0.75);
}

.text-panel {
  position: fixed;
  inset: 0;
  background: rgba(17, 17, 17, 0.35);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 0 28rpx 34rpx;
}

.text-card {
  width: 100%;
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.98);
  padding: 18rpx 18rpx 22rpx;
}

.text-head {
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.text-title {
  font-size: 30rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.9);
}

.text-close {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.text-close-img {
  width: 32rpx;
  height: 32rpx;
  display: block;
  opacity: 0.78;
}

.text-input {
  margin-top: 18rpx;
  min-height: 132rpx;
  border-radius: 24rpx;
  background: rgba(17, 17, 17, 0.04);
  padding: 18rpx;
  display: flex;
}

.text-input-real {
  width: 100%;
  min-height: 96rpx;
  font-size: 34rpx;
  font-weight: 900;
  color: #111111;
  line-height: 46rpx;
}

.ph {
  color: rgba(17, 17, 17, 0.35);
}
</style>
