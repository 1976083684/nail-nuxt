<script setup lang="ts">
const { showLogin, closeLogin } = useModal()
const { simulateLogin, loginWithUser } = useAuth()
const { showToast } = useToast()

const loginTab = ref<'qr' | 'phone'>('qr')
const phone = ref('')
const smsCode = ref('')
const smsSent = ref(false)
const smsCountdown = ref(0)
const smsLoading = ref(false)
const loginLoading = ref(false)
const smsCodeReturned = ref('')

const qrCanvas = ref<HTMLCanvasElement | null>(null)

function drawQR() {
  const cv = qrCanvas.value
  if (!cv) return
  const ctx = cv.getContext('2d')!
  const sz = 176
  cv.width = sz
  cv.height = sz
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, sz, sz)
  ctx.fillStyle = '#000'
  const cs = 6
  const cols = Math.floor(sz / cs)
  for (let r = 0; r < cols; r++) {
    for (let c = 0; c < cols; c++) {
      if (Math.abs(c - cols / 2) < 4 && Math.abs(r - cols / 2) < 4) continue
      if ((r < 3 && c < 3) || (r < 3 && c > cols - 4) || (r > cols - 4 && c < 3)) {
        ctx.fillRect(c * cs, r * cs, cs, cs)
        continue
      }
      if (Math.random() > 0.5) ctx.fillRect(c * cs, r * cs, cs, cs)
    }
  }
}

async function handleQrLogin() {
  await simulateLogin()
  closeLogin()
  showToast('登录成功，欢迎回来', 'success')
}

async function sendSms() {
  if (!phone.value || !/^1\d{10}$/.test(phone.value)) {
    showToast('请输入正确的手机号', 'error')
    return
  }
  smsLoading.value = true
  try {
    const data = await $fetch<any>('/api/auth/sms-send', {
      method: 'POST',
      body: { phone: phone.value },
    })
    smsSent.value = true
    smsCodeReturned.value = data.code || ''
    smsCountdown.value = 60
    const timer = setInterval(() => {
      smsCountdown.value--
      if (smsCountdown.value <= 0) clearInterval(timer)
    }, 1000)
    if (data.code) {
      showToast(`验证码已发送（测试模式: ${data.code}）`, 'success')
    } else {
      showToast('验证码已发送', 'success')
    }
  } catch (e: any) {
    showToast(e?.data?.message || '发送失败', 'error')
  }
  smsLoading.value = false
}

async function handlePhoneLogin() {
  if (!phone.value || !/^1\d{10}$/.test(phone.value)) {
    showToast('请输入正确的手机号', 'error')
    return
  }
  if (!smsCode.value) {
    showToast('请输入验证码', 'error')
    return
  }
  loginLoading.value = true
  try {
    const data = await $fetch<any>('/api/auth/sms-login', {
      method: 'POST',
      body: { phone: phone.value, code: smsCode.value },
    })
    loginWithUser(data.user)
    closeLogin()
    showToast('登录成功，欢迎回来', 'success')
  } catch (e: any) {
    showToast(e?.data?.message || '登录失败', 'error')
  }
  loginLoading.value = false
}

watch(showLogin, (val) => {
  if (val) {
    nextTick(drawQR)
    loginTab.value = 'qr'
    phone.value = ''
    smsCode.value = ''
    smsSent.value = false
    smsCountdown.value = 0
    smsCodeReturned.value = ''
  }
})
</script>

<template>
  <div class="modal-overlay" :class="{ active: showLogin }" style="align-items: center" @click.self="closeLogin()">
    <div class="modal-panel" style="max-width: 400px; border-radius: 20px; transform: translateY(30px) scale(0.96)" @click.stop>
      <div class="p-6 md:p-8">
        <!-- Close button -->
        <button
          class="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center"
          style="background: var(--bg); color: var(--text-muted)"
          @click="closeLogin()"
        >
          <i class="fa-solid fa-xmark" />
        </button>

        <!-- Tabs -->
        <div class="flex mb-6 border-b" style="border-color: var(--border)">
          <button
            :class="['flex-1 pb-3 text-sm font-medium transition-colors relative', loginTab === 'qr' ? 'text-pink-500' : 'text-gray-400']"
            @click="loginTab = 'qr'"
          >
            <i class="fa-brands fa-weixin mr-1" />扫码登录
            <div v-if="loginTab === 'qr'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-500" />
          </button>
          <button
            :class="['flex-1 pb-3 text-sm font-medium transition-colors relative', loginTab === 'phone' ? 'text-pink-500' : 'text-gray-400']"
            @click="loginTab = 'phone'"
          >
            <i class="fa-solid fa-mobile-screen mr-1" />短信登录
            <div v-if="loginTab === 'phone'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-500" />
          </button>
        </div>

        <!-- QR Login -->
        <div v-if="loginTab === 'qr'" class="text-center">
          <div class="qr-frame mb-4">
            <canvas ref="qrCanvas" />
            <div class="qr-center">
              <img src="https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop&crop=face" alt="logo">
            </div>
            <div class="scan-line" />
          </div>
          <p class="text-xs mb-6" style="color: var(--text-muted)">打开微信 → 扫一扫</p>
          <button class="btn-wechat mb-3" @click="handleQrLogin()">
            <i class="fa-brands fa-weixin text-lg" /> 模拟微信登录
          </button>
        </div>

        <!-- Phone Login -->
        <div v-if="loginTab === 'phone'">
          <div class="mb-4">
            <label class="block text-xs font-medium mb-2" style="color: var(--text-muted)">手机号</label>
            <div class="flex gap-2">
              <input
                v-model="phone"
                type="tel"
                maxlength="11"
                class="form-input flex-1"
                placeholder="请输入手机号"
              />
              <button
                class="px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap"
                :class="smsCountdown > 0 ? 'bg-gray-200 text-gray-400' : 'bg-pink-500 text-white hover:bg-pink-600'"
                :disabled="smsCountdown > 0 || smsLoading"
                @click="sendSms()"
              >
                <i v-if="smsLoading" class="fa-solid fa-spinner fa-spin mr-1" />
                {{ smsCountdown > 0 ? `${smsCountdown}s` : '获取验证码' }}
              </button>
            </div>
          </div>
          <div class="mb-6">
            <label class="block text-xs font-medium mb-2" style="color: var(--text-muted)">验证码</label>
            <input
              v-model="smsCode"
              type="text"
              maxlength="6"
              class="form-input"
              placeholder="请输入验证码"
              @keyup.enter="handlePhoneLogin()"
            />
          </div>
          <button
            class="btn-primary w-full"
            :disabled="loginLoading"
            @click="handlePhoneLogin()"
          >
            <i v-if="loginLoading" class="fa-solid fa-spinner fa-spin mr-2" />
            {{ loginLoading ? '登录中...' : '登录' }}
          </button>
          <p class="text-xs text-center mt-4" style="color: var(--text-muted)">
            未注册手机号将自动创建账号
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
