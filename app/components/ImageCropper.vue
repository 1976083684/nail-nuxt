<script setup lang="ts">
const props = defineProps<{
  modelValue: string
  label?: string
  cropWidth?: number
  cropHeight?: number
  enableCrop?: boolean
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const fileInput = ref<HTMLInputElement | null>(null)
const cropFileInput = ref<HTMLInputElement | null>(null)
const previewUrl = computed(() => props.modelValue)
const showCropper = ref(false)
const uploading = ref(false)
const selectedFile = ref<string | null>(null)

// 裁剪区域状态
const cropArea = reactive({ x: 0, y: 0, w: 0, h: 0 })
const imgSize = reactive({ w: 0, h: 0 })
const containerSize = reactive({ w: 0, h: 0 })
const scale = ref(1)
let dragMode: 'move' | 'nw' | 'ne' | 'sw' | 'se' | null = null
let dragStart = { x: 0, y: 0, cropX: 0, cropY: 0, cropW: 0, cropH: 0 }

const shouldCrop = computed(() => props.enableCrop !== false)
const cropperCanvas = ref<HTMLCanvasElement | null>(null)

function triggerUpload() { fileInput.value?.click() }
function triggerCropUpload() { cropFileInput.value?.click() }

// 直接上传
async function handleDirectUpload(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('file', file)
    const result = await $fetch<any>('/api/upload', { method: 'POST', body: formData })
    emit('update:modelValue', result.url)
  } catch (e: any) {
    alert(e?.data?.message || '上传失败')
  }
  uploading.value = false
  if (fileInput.value) fileInput.value.value = ''
}

// 选择文件后打开裁剪器
function handleCropFileChange(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    selectedFile.value = ev.target?.result as string
    showCropper.value = true
    nextTick(() => initCropper())
  }
  reader.readAsDataURL(file)
  if (cropFileInput.value) cropFileInput.value.value = ''
}

function initCropper() {
  const canvas = cropperCanvas.value
  if (!canvas || !selectedFile.value) return

  const img = new Image()
  img.onload = () => {
    imgSize.w = img.naturalWidth
    imgSize.h = img.naturalHeight

    // 计算缩放比例，使图片适应容器（最大 500px）
    const maxW = 500, maxH = 420
    const s = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1)
    scale.value = s

    const dw = Math.round(img.naturalWidth * s)
    const dh = Math.round(img.naturalHeight * s)
    containerSize.w = dw
    containerSize.h = dh
    canvas.width = dw
    canvas.height = dh

    // 初始化裁剪区域（居中，60% 覆盖率）
    let cw = dw * 0.6
    let ch = dh * 0.6
    cropArea.x = (dw - cw) / 2
    cropArea.y = (dh - ch) / 2
    cropArea.w = cw
    cropArea.h = ch

    drawCropper(img)
  }
  img.src = selectedFile.value
}

function drawCropper(img?: HTMLImageElement) {
  const canvas = cropperCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')!
  const { w, h } = containerSize

  if (!img) {
    const i = new Image()
    i.onload = () => drawCropper(i)
    i.src = selectedFile.value!
    return
  }

  ctx.clearRect(0, 0, w, h)
  ctx.drawImage(img, 0, 0, w, h)

  // 半透明遮罩
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
  ctx.fillRect(0, 0, w, h)

  // 裁剪区域显示原图
  const { x, y, w: cw, h: ch } = cropArea
  ctx.save()
  ctx.beginPath()
  ctx.rect(x, y, cw, ch)
  ctx.clip()
  ctx.drawImage(img, 0, 0, w, h)
  ctx.restore()

  // 裁剪边框
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 2
  ctx.strokeRect(x, y, cw, ch)

  // 九宫格线
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
  ctx.lineWidth = 1
  for (let i = 1; i < 3; i++) {
    ctx.beginPath(); ctx.moveTo(x + cw * i / 3, y); ctx.lineTo(x + cw * i / 3, y + ch); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(x, y + ch * i / 3); ctx.lineTo(x + cw, y + ch * i / 3); ctx.stroke()
  }

  // 四角拖拽手柄
  const hs = 10
  ctx.fillStyle = '#fff'
  const corners = [[x, y], [x + cw, y], [x, y + ch], [x + cw, y + ch]]
  corners.forEach(([cx, cy]) => {
    ctx.fillRect(cx - hs / 2, cy - hs / 2, hs, hs)
  })
}

function getHandle(ex: number, ey: number): typeof dragMode {
  const { x, y, w, h } = cropArea
  const threshold = 15
  if (Math.abs(ex - x) < threshold && Math.abs(ey - y) < threshold) return 'nw'
  if (Math.abs(ex - (x + w)) < threshold && Math.abs(ey - y) < threshold) return 'ne'
  if (Math.abs(ex - x) < threshold && Math.abs(ey - (y + h)) < threshold) return 'sw'
  if (Math.abs(ex - (x + w)) < threshold && Math.abs(ey - (y + h)) < threshold) return 'se'
  if (ex > x && ex < x + w && ey > y && ey < y + h) return 'move'
  return null
}

function getCursor(mode: typeof dragMode): string {
  if (mode === 'nw' || mode === 'se') return 'nwse-resize'
  if (mode === 'ne' || mode === 'sw') return 'nesw-resize'
  if (mode === 'move') return 'move'
  return 'default'
}

function onCanvasMouseDown(e: MouseEvent) {
  const rect = cropperCanvas.value!.getBoundingClientRect()
  const ex = e.clientX - rect.left
  const ey = e.clientY - rect.top
  dragMode = getHandle(ex, ey)
  if (!dragMode) return
  dragStart = { x: ex, y: ey, cropX: cropArea.x, cropY: cropArea.y, cropW: cropArea.w, cropH: cropArea.h }
  e.preventDefault()
}

function onCanvasMouseMove(e: MouseEvent) {
  const rect = cropperCanvas.value!.getBoundingClientRect()
  const ex = e.clientX - rect.left
  const ey = e.clientY - rect.top

  if (!dragMode) {
    cropperCanvas.value!.style.cursor = getCursor(getHandle(ex, ey))
    return
  }

  const dx = ex - dragStart.x
  const dy = ey - dragStart.y
  const { w: maxW, h: maxH } = containerSize
  const minSize = 30

  if (dragMode === 'move') {
    cropArea.x = Math.max(0, Math.min(maxW - cropArea.w, dragStart.cropX + dx))
    cropArea.y = Math.max(0, Math.min(maxH - cropArea.h, dragStart.cropY + dy))
  } else if (dragMode === 'se') {
    const newW = Math.max(minSize, Math.min(maxW - dragStart.cropX, dragStart.cropW + dx))
    const newH = Math.max(minSize, Math.min(maxH - dragStart.cropY, dragStart.cropH + dy))
    cropArea.w = newW; cropArea.h = newH
  } else if (dragMode === 'nw') {
    const newW = Math.max(minSize, dragStart.cropW - dx)
    const newH = Math.max(minSize, dragStart.cropH - dy)
    const newX = dragStart.cropX + dragStart.cropW - newW
    const newY = dragStart.cropY + dragStart.cropH - newH
    if (newX >= 0 && newY >= 0) { cropArea.x = newX; cropArea.y = newY; cropArea.w = newW; cropArea.h = newH }
  } else if (dragMode === 'ne') {
    const newW = Math.max(minSize, Math.min(maxW - dragStart.cropX, dragStart.cropW + dx))
    const newH = Math.max(minSize, dragStart.cropH - dy)
    const newY = dragStart.cropY + dragStart.cropH - newH
    if (newY >= 0) { cropArea.y = newY; cropArea.w = newW; cropArea.h = newH }
  } else if (dragMode === 'sw') {
    const newW = Math.max(minSize, dragStart.cropW - dx)
    const newH = Math.max(minSize, Math.min(maxH - dragStart.cropY, dragStart.cropH + dy))
    const newX = dragStart.cropX + dragStart.cropW - newW
    if (newX >= 0) { cropArea.x = newX; cropArea.w = newW; cropArea.h = newH }
  }

  drawCropper()
}

function onCanvasMouseUp() {
  dragMode = null
}

async function cropAndUpload() {
  uploading.value = true
  try {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    await new Promise<void>((resolve, reject) => { img.onload = () => resolve(); img.onerror = reject; img.src = selectedFile.value! })

    // 将裁剪区域映射回原图尺寸
    const s = scale.value
    const ox = cropArea.x / s
    const oy = cropArea.y / s
    const ow = cropArea.w / s
    const oh = cropArea.h / s

    const outW = props.cropWidth || Math.round(ow)
    const outH = props.cropHeight || Math.round(oh)

    const outCanvas = document.createElement('canvas')
    outCanvas.width = outW
    outCanvas.height = outH
    const ctx = outCanvas.getContext('2d')!
    ctx.drawImage(img, ox, oy, ow, oh, 0, 0, outW, outH)

    const blob = await new Promise<Blob>((resolve, reject) => {
      outCanvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob failed')), 'image/jpeg', 0.9)
    })

    const formData = new FormData()
    formData.append('file', blob, 'cropped.jpg')
    const result = await $fetch<any>('/api/upload', { method: 'POST', body: formData })
    emit('update:modelValue', result.url)
    closeCropper()
  } catch (e: any) {
    console.error('裁剪上传失败:', e)
    alert(e?.message || '裁剪上传失败')
  }
  uploading.value = false
}

function closeCropper() {
  selectedFile.value = null
  showCropper.value = false
}

function clearImage() {
  emit('update:modelValue', '')
}
</script>

<template>
  <div>
    <label v-if="label" class="block text-sm font-medium text-gray-700 mb-1">{{ label }}</label>
    <div class="flex gap-3">
      <!-- Preview -->
      <div
        v-if="previewUrl"
        class="relative rounded-lg overflow-hidden border border-gray-200 group shrink-0"
        style="width: 96px; height: 96px;"
      >
        <img :src="previewUrl" class="w-full h-full object-cover" />
        <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
          <button class="p-1 bg-white rounded text-xs" @click="triggerUpload" title="重新上传">
            <i class="fas fa-sync text-gray-700" />
          </button>
          <button v-if="shouldCrop" class="p-1 bg-white rounded text-xs" @click="triggerCropUpload" title="裁剪上传">
            <i class="fas fa-crop-alt text-gray-700" />
          </button>
          <button class="p-1 bg-white rounded text-xs" @click="clearImage" title="删除">
            <i class="fas fa-trash text-red-500" />
          </button>
        </div>
      </div>

      <!-- Upload buttons -->
      <div v-if="!previewUrl" class="flex gap-2">
        <div
          class="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 transition-colors"
          @click="triggerUpload"
        >
          <i v-if="uploading" class="fas fa-spinner fa-spin text-blue-400 text-xl mb-1" />
          <i v-else class="fas fa-cloud-upload-alt text-gray-400 text-xl mb-1" />
          <span class="text-[10px] text-gray-400">{{ shouldCrop ? '直接上传' : '上传图片' }}</span>
        </div>
        <div
          v-if="shouldCrop"
          class="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-purple-400 transition-colors"
          @click="triggerCropUpload"
        >
          <i class="fas fa-crop-alt text-gray-400 text-xl mb-1" />
          <span class="text-[10px] text-gray-400">裁剪上传</span>
        </div>
      </div>

      <!-- URL input -->
      <div class="flex-1" v-if="!previewUrl">
        <input
          :value="modelValue"
          @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
          class="w-full px-3 py-2 border rounded-lg text-sm focus:border-blue-400 outline-none"
          placeholder="或输入图片URL"
        />
      </div>
    </div>

    <!-- Hidden file inputs -->
    <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="handleDirectUpload" />
    <input ref="cropFileInput" type="file" accept="image/*" class="hidden" @change="handleCropFileChange" />

    <!-- Cropper modal -->
    <Teleport to="body">
      <div v-if="showCropper" class="fixed inset-0 bg-black/80 z-[80] flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl w-full max-w-lg overflow-hidden">
          <div class="flex items-center justify-between p-4 border-b">
            <h3 class="font-bold text-gray-800">裁剪图片</h3>
            <button class="text-gray-400 hover:text-gray-600" @click="closeCropper">
              <i class="fas fa-times text-xl" />
            </button>
          </div>
          <div class="p-4 flex justify-center">
            <canvas
              ref="cropperCanvas"
              class="rounded-lg"
              style="max-width: 100%; touch-action: none;"
              @mousedown="onCanvasMouseDown"
              @mousemove="onCanvasMouseMove"
              @mouseup="onCanvasMouseUp"
              @mouseleave="onCanvasMouseUp"
            />
          </div>
          <div class="flex justify-end gap-3 p-4 border-t">
            <button class="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200" @click="closeCropper">取消</button>
            <button
              class="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50"
              :disabled="uploading"
              @click="cropAndUpload"
            >
              <i v-if="uploading" class="fas fa-spinner fa-spin mr-1" />
              {{ uploading ? '上传中...' : '确认裁剪' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
