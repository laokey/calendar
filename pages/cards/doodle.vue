<template>
  <view class="bl-page doodle-page">
    <BlHeader title="涂鸦" back>
      <template #right>
        <text class="top-next" @click="goNext">下一步</text>
      </template>
    </BlHeader>

    <view class="top-tools">
      <view class="circle-btn" @click="undo"><text class="circle-text">↶</text></view>
      <view class="circle-btn" @click="redo"><text class="circle-text">↷</text></view>
      <view class="circle-btn right" @click="clearAll"><text class="circle-text">🧹</text></view>
    </view>

    <view class="canvas-wrap">
      <view class="canvas-bg">
        <canvas
          canvas-id="doodleCanvas"
          id="doodleCanvas"
          class="canvas"
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
          :style="{ left: s.x + 'px', top: s.y + 'px' }"
          @touchstart.stop.prevent="onStickerStart($event, s.id)"
          @touchmove.stop.prevent="onStickerMove"
          @touchend.stop.prevent="onStickerEnd"
          @touchcancel.stop.prevent="onStickerEnd"
        >
          <text class="sticker-text">{{ s.emoji }}</text>
        </view>

        <view v-for="t in texts" :key="t.id" class="txt" :style="{ left: t.x + 'px', top: t.y + 'px', color: t.color }">
          <text class="txt-text">{{ t.text }}</text>
        </view>
      </view>
    </view>

    <view v-if="draggingSticker" class="trash" :class="{ active: overTrash }">
      <text class="trash-text">拖到此处删除</text>
    </view>

    <view class="bottom-tabs">
      <view class="bt" :class="{ active: tool === 'sticker' }" @click="tool = 'sticker'">
        <text class="bt-ico">☺</text>
        <text class="bt-text">贴纸</text>
      </view>
      <view class="bt" :class="{ active: tool === 'brush' }" @click="tool = 'brush'">
        <text class="bt-ico">✎</text>
        <text class="bt-text">涂鸦</text>
      </view>
      <view class="bt" :class="{ active: tool === 'text' }" @click="openTextPanel">
        <text class="bt-ico">T</text>
        <text class="bt-text">文本</text>
      </view>
    </view>

    <view v-if="tool === 'sticker'" class="panel">
      <view class="sticker-row">
        <view v-for="e in stickerOptions" :key="e" class="sticker-opt" @click="addSticker(e)">
          <text class="sticker-opt-text">{{ e }}</text>
        </view>
      </view>
    </view>

    <view v-if="tool === 'brush'" class="panel">
      <view class="colors">
        <view v-for="c in palette" :key="c" class="c" :style="{ background: c }" @click="setBrushColor(c)">
          <view v-if="brushColor === c" class="c-check"><text class="c-check-text">✓</text></view>
        </view>
      </view>
      <view class="panel-actions">
        <view class="p-btn ghost" @click="tool = 'sticker'"><text class="p-text">取消</text></view>
        <view class="p-btn" @click="tool = 'sticker'"><text class="p-text">完成</text></view>
      </view>
    </view>

    <view v-if="textPanelOpen" class="text-panel">
      <view class="text-card" @click.stop>
        <text class="text-title">文本</text>
        <view class="text-input">
          <input v-model="textDraft" class="text-input-real" placeholder="请输入文本" placeholder-class="ph" />
        </view>
        <view class="panel-actions">
          <view class="p-btn ghost" @click="closeTextPanel"><text class="p-text">取消</text></view>
          <view class="p-btn" @click="confirmText"><text class="p-text">完成</text></view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import BlHeader from '../../components/BlHeader.vue'
import { ensureCardDraft, saveCardDraft } from '../../utils/cardStore'

const draft = ref(ensureCardDraft())
const tool = ref('sticker')
const brushColor = ref('#111111')
const strokes = ref([])
const redoStack = ref([])
const stickers = ref([])
const texts = ref([])

const stickerOptions = ['🌸', '⭐', '🎈', '🎉', '❤️', '✨']

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

onLoad((options) => {
  const t = options && options.tool ? String(options.tool) : ''
  if (t === 'text') {
    tool.value = 'text'
    textPanelOpen.value = true
  }
})

onShow(() => {
  draft.value = ensureCardDraft()
  brushColor.value = draft.value?.doodle?.brushColor || '#111111'
  strokes.value = (draft.value?.doodle?.strokes || []).slice()
  redoStack.value = []
  stickers.value = (draft.value?.doodle?.stickers || []).slice()
  texts.value = (draft.value?.doodle?.texts || []).slice()
  redraw()
})

onMounted(() => {
  ctx = uni.createCanvasContext('doodleCanvas')
  setTimeout(() => redraw(), 30)
})

function persist() {
  draft.value = saveCardDraft({
    ...draft.value,
    doodle: {
      strokes: strokes.value.slice(),
      stickers: stickers.value.slice(),
      texts: texts.value.slice(),
      brushColor: brushColor.value,
    },
  })
}

function setBrushColor(c) {
  brushColor.value = c
}

function canvasPx() {
  try {
    const w = uni.upx2px(640)
    return { w, h: w }
  } catch (e) {
    return { w: 320, h: 320 }
  }
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

function addSticker(emoji) {
  const id = `st_${Date.now()}_${Math.random().toString(16).slice(2)}`
  const px = canvasPx().w
  stickers.value = [...stickers.value, { id, emoji, x: px / 2 - 18, y: px / 2 - 18 }]
  persist()
}

function computeTrashRect(e) {
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
  computeTrashRect(e)
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
}

function closeTextPanel() {
  textPanelOpen.value = false
  tool.value = 'sticker'
  textDraft.value = ''
}

function confirmText() {
  const v = String(textDraft.value || '').trim()
  if (!v) return
  const id = `tx_${Date.now()}_${Math.random().toString(16).slice(2)}`
  const px = canvasPx().w
  texts.value = [...texts.value, { id, text: v, x: 22, y: 22, color: '#111111' }]
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
}

.top-next {
  font-size: 30rpx;
  font-weight: 900;
  color: #3d6afb;
}

.top-tools {
  margin-top: 14rpx;
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.circle-btn {
  width: 74rpx;
  height: 74rpx;
  border-radius: 999rpx;
  background: rgba(17, 17, 17, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
}

.circle-btn.right {
  margin-left: auto;
}

.circle-text {
  font-size: 34rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.75);
}

.canvas-wrap {
  margin-top: 18rpx;
  display: flex;
  justify-content: center;
}

.canvas-bg {
  width: 640rpx;
  height: 640rpx;
  border-radius: 28rpx;
  background: rgba(255, 214, 77, 0.22);
  overflow: hidden;
  position: relative;
  box-shadow: 0 10rpx 26rpx rgba(17, 17, 17, 0.06);
}

.canvas {
  width: 640rpx;
  height: 640rpx;
}

.sticker {
  position: absolute;
  width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
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
}

.trash.active {
  background: rgba(255, 75, 63, 0.18);
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
  height: 164rpx;
  background: rgba(255, 255, 255, 0.96);
  padding: 18rpx 28rpx 0;
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

.bt-ico {
  font-size: 38rpx;
  font-weight: 900;
}

.bt-text {
  font-size: 26rpx;
  font-weight: 800;
}

.panel {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 164rpx;
  background: rgba(255, 255, 255, 0.98);
  padding: 18rpx 28rpx 22rpx;
  box-shadow: 0 -18rpx 36rpx rgba(17, 17, 17, 0.06);
}

.sticker-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
}

.sticker-opt {
  width: 96rpx;
  height: 96rpx;
  border-radius: 24rpx;
  background: rgba(17, 17, 17, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
}

.sticker-opt-text {
  font-size: 50rpx;
}

.colors {
  display: flex;
  flex-wrap: wrap;
  gap: 18rpx;
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

.text-title {
  display: block;
  text-align: center;
  font-size: 30rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.9);
}

.text-input {
  margin-top: 18rpx;
  height: 96rpx;
  border-radius: 24rpx;
  background: rgba(17, 17, 17, 0.04);
  padding: 0 18rpx;
  display: flex;
  align-items: center;
}

.text-input-real {
  width: 100%;
  font-size: 34rpx;
  font-weight: 900;
  color: #111111;
}

.ph {
  color: rgba(17, 17, 17, 0.35);
}
</style>

