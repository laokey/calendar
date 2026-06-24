<template>
  <view :id="wrapId" class="preview-wrap" :style="{ background: background }">
    <view class="preview-stage" :style="stageStyle">
      <canvas :canvas-id="canvasId" :id="canvasId" class="preview-canvas" :style="{ width: baseWidthPx + 'px', height: baseHeightPx + 'px' }" />
      <view
        v-for="s in stickerList"
        :key="s.id"
        class="sticker"
        :style="{ left: s.x + 'px', top: s.y + 'px', width: stickerSizePx(s) + 'px', height: stickerSizePx(s) + 'px' }"
      >
        <image v-if="s.src" class="sticker-img" :src="s.src" mode="aspectFit" />
        <text v-else class="sticker-text">{{ s.emoji }}</text>
      </view>
      <view
        v-for="t in textList"
        :key="t.id"
        class="txt"
        :style="{ left: t.x + 'px', top: t.y + 'px', color: t.color || '#111111' }"
      >
        <text class="txt-text">{{ t.text }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, getCurrentInstance, nextTick, onMounted, ref, watch } from 'vue'

const props = defineProps({
  canvasId: { type: String, required: true },
  doodle: { type: Object, default: () => ({}) },
  background: { type: String, default: 'rgba(255, 214, 77, 0.22)' },
})

const instance = getCurrentInstance()
const scale = ref(1)
const baseWidthPx = computed(() => {
  const v = Number(props.doodle && props.doodle.canvasWidthPx)
  if (v > 0) return v
  try {
    return uni.upx2px(640)
  } catch (e) {
    return 320
  }
})
const baseHeightPx = computed(() => {
  const v = Number(props.doodle && props.doodle.canvasHeightPx)
  if (v > 0) return v
  return baseWidthPx.value
})
const wrapId = computed(() => `wrap_${props.canvasId}`)
const strokeList = computed(() => (props.doodle && Array.isArray(props.doodle.strokes) ? props.doodle.strokes : []))
const stickerList = computed(() => (props.doodle && Array.isArray(props.doodle.stickers) ? props.doodle.stickers : []))
const textList = computed(() => (props.doodle && Array.isArray(props.doodle.texts) ? props.doodle.texts : []))
const stageStyle = computed(() => ({
  width: `${baseWidthPx.value}px`,
  height: `${baseHeightPx.value}px`,
  transform: `scale(${scale.value})`,
  transformOrigin: 'top left',
}))

let ctx = null

function stickerSizePx(sticker) {
  const n = Number(sticker && sticker.size)
  if (n > 0) return n
  try {
    return uni.upx2px(72)
  } catch (e) {
    return 36
  }
}

function redraw() {
  if (!ctx) return
  const width = baseWidthPx.value
  const height = baseHeightPx.value
  ctx.clearRect(0, 0, width, height)
  ctx.setLineCap('round')
  ctx.setLineJoin('round')
  ;(strokeList.value || []).forEach((s) => {
    if (!s || !Array.isArray(s.points) || s.points.length < 2) return
    ctx.beginPath()
    ctx.setStrokeStyle(s.color || '#111111')
    ctx.setLineWidth(Number(s.width || 10) || 10)
    ctx.moveTo(Number(s.points[0].x) || 0, Number(s.points[0].y) || 0)
    for (let i = 1; i < s.points.length; i += 1) {
      const p = s.points[i] || {}
      ctx.lineTo(Number(p.x) || 0, Number(p.y) || 0)
    }
    ctx.stroke()
  })
  ctx.draw()
}

function measure() {
  nextTick(() => {
    const proxy = instance && instance.proxy ? instance.proxy : null
    if (!proxy) return
    const query = uni.createSelectorQuery().in(proxy)
    query.select(`#${wrapId.value}`).boundingClientRect((rect) => {
      if (!rect || !rect.width || !rect.height) return
      const nextScale = Math.min(rect.width / baseWidthPx.value, rect.height / baseHeightPx.value)
      scale.value = nextScale > 0 ? nextScale : 1
      redraw()
    })
    query.exec()
  })
}

onMounted(() => {
  ctx = uni.createCanvasContext(props.canvasId, instance && instance.proxy ? instance.proxy : undefined)
  measure()
  setTimeout(() => {
    measure()
    redraw()
  }, 30)
})

watch(
  () => props.doodle,
  () => {
    measure()
    redraw()
  },
  { deep: true },
)
</script>

<style scoped lang="scss">
.preview-wrap {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
}

.preview-stage {
  position: relative;
}

.preview-canvas {
  position: absolute;
  inset: 0;
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
  font-size: 34rpx;
  line-height: 1;
}

.txt {
  position: absolute;
  max-width: 520rpx;
}

.txt-text {
  font-size: 48rpx;
  line-height: 1.25;
  font-weight: 900;
}
</style>
