<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const configs = ref<any[]>([])
const loading = ref(false)
const saving = ref(false)
const testPhone = ref('')
const testSending = ref(false)
const testResult = ref<any>(null)

// 当前选中的供应商
const activeProvider = ref('aliyun')

// 短信签名选项
const signNameOptions = [
  '云渚科技验证平台',
  '云渚科技验证服务',
  '速通互联验证码',
  '速通互联验证平台',
  '速通互联验证服务',
]

// 短信模板选项
const templateOptions = [
  { code: '100001', name: '登录/注册模板', content: '您的验证码为${code}。尊敬的客户，以上验证码${min}分钟内有效，请注意保密，切勿告知他人。' },
  { code: '100002', name: '修改绑定手机号模板', content: '尊敬的客户，您正在进行修改手机号操作，您的验证码为${code}。以上验证码${min}分钟内有效，请注意保密，切勿告知他人。' },
  { code: '100003', name: '重置密码模板', content: '尊敬的客户，您正在进行重置密码操作，您的验证码为${code}。以上验证码${min}分钟内有效，请注意保密，切勿告知他人。' },
  { code: '100004', name: '绑定新手机号模板', content: '尊敬的客户，您正在进行绑定手机号操作，您的验证码为${code}。以上验证码${min}分钟内有效，请注意保密，切勿告知他人。' },
  { code: '100005', name: '验证绑定手机号模板', content: '尊敬的客户，您正在验证绑定手机号操作，您的验证码为${code}。以上验证码${min}分钟内有效，请注意保密，切勿告知他人。' },
]

const showSignDropdown = ref(false)
const showTemplateDropdown = ref(false)

// 追踪 key 是否被修改过
const keyModified = ref(false)
const secretModified = ref(false)

// 当前编辑的配置
const currentConfig = computed(() => configs.value.find(c => c.provider === activeProvider.value))

// 是否已接入
const isProviderReady = computed(() => activeProvider.value === 'aliyun')

// 更新配置
function updateConfig(field: string, value: any) {
  if (currentConfig.value) {
    currentConfig.value[field] = value
  }
}

// 标记 key 已修改
function onKeyInput(e: Event) {
  if (currentConfig.value) {
    currentConfig.value.accessKey = (e.target as HTMLInputElement).value
    keyModified.value = true
  }
}

// 标记 secret 已修改
function onSecretInput(e: Event) {
  if (currentConfig.value) {
    currentConfig.value.accessSecret = (e.target as HTMLInputElement).value
    secretModified.value = true
  }
}

// 选择签名
function selectSign(name: string) {
  updateConfig('signName', name)
  showSignDropdown.value = false
}

// 选择模板
function selectTemplate(code: string) {
  updateConfig('templateCode', code)
  showTemplateDropdown.value = false
}

// 切换供应商
function switchProvider(provider: string) {
  activeProvider.value = provider
  testResult.value = null
  keyModified.value = false
  secretModified.value = false
}

async function load() {
  loading.value = true
  try {
    const data = await $fetch<any[]>('/api/admin/settings/sms')
    configs.value = data || []
    // 默认选中默认供应商
    const defaultConfig = configs.value.find(c => c.isDefault)
    if (defaultConfig) {
      activeProvider.value = defaultConfig.provider
    }
  } catch (e) {
    console.error('加载短信配置失败:', e)
  }
  loading.value = false
}

async function save() {
  if (!currentConfig.value) return

  saving.value = true
  try {
    const body: any = {
      id: currentConfig.value.id,
      signName: currentConfig.value.signName,
      templateCode: currentConfig.value.templateCode,
      isEnabled: currentConfig.value.isEnabled,
      isDefault: true,
    }
    // 只在用户修改过时才发送 key/secret，避免把遮盖值存入数据库
    if (keyModified.value) body.accessKey = currentConfig.value.accessKey
    if (secretModified.value) body.accessSecret = currentConfig.value.accessSecret

    await $fetch('/api/admin/settings/sms', { method: 'PUT', body })
    keyModified.value = false
    secretModified.value = false
    alert('保存成功')
    await load()
  } catch (e: any) {
    alert(e?.data?.message || '保存失败')
  }
  saving.value = false
}

async function sendTest() {
  if (!testPhone.value) {
    alert('请输入手机号')
    return
  }
  testSending.value = true
  testResult.value = null

  try {
    const data = await $fetch<any>('/api/admin/settings/sms-test', {
      method: 'POST',
      body: { phone: testPhone.value },
    })

    testResult.value = {
      success: data.success,
      status: data.success ? '发送成功' : '发送失败',
      request: {
        phoneNumber: testPhone.value,
        signName: data.config?.signName || currentConfig.value?.signName,
        templateCode: data.config?.templateCode || currentConfig.value?.templateCode,
        templateParam: JSON.stringify({ code: data.code || '****', min: '5' }),
      },
      response: data.response || data,
      accessKeyId: currentConfig.value?.accessKey || '未配置',
    }
  } catch (e: any) {
    testResult.value = {
      success: false,
      status: '请求失败',
      request: {
        phoneNumber: testPhone.value,
        signName: currentConfig.value?.signName,
        templateCode: currentConfig.value?.templateCode,
      },
      response: e?.data || { message: e?.message || '网络错误' },
      accessKeyId: currentConfig.value?.accessKey || '未配置',
    }
  }
  testSending.value = false
}

function closeDropdowns() {
  showSignDropdown.value = false
  showTemplateDropdown.value = false
}

onMounted(() => {
  load()
  document.addEventListener('click', closeDropdowns)
})

onUnmounted(() => {
  document.removeEventListener('click', closeDropdowns)
})
</script>

<template>
  <div @click="closeDropdowns">
    <div class="flex items-center gap-3 mb-6">
      <NuxtLink to="/admin/settings" class="text-gray-400 hover:text-blue-500">
        <i class="fas fa-arrow-left" />
      </NuxtLink>
      <h2 class="text-xl font-bold text-gray-800">短信配置</h2>
    </div>

    <div v-if="loading" class="text-center py-20">
      <i class="fas fa-spinner fa-spin text-blue-500 text-3xl" />
    </div>

    <template v-else>
      <!-- 供应商选择 -->
      <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-4">
        <h3 class="font-semibold text-gray-800 mb-4">
          <i class="fas fa-building text-blue-500 mr-2" />短信供应商
        </h3>
        <div class="grid grid-cols-2 gap-4">
          <!-- 阿里云 -->
          <div
            :class="[
              'p-4 rounded-xl border-2 cursor-pointer transition-all',
              activeProvider === 'aliyun'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300',
            ]"
            @click="switchProvider('aliyun')"
          >
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center">
                <i class="fab fa-alipay text-2xl text-blue-500 mr-2" />
                <span class="font-medium text-gray-800">阿里云</span>
              </div>
              <span class="px-2 py-0.5 text-xs bg-green-100 text-green-600 rounded-full">已接入</span>
            </div>
            <p class="text-xs text-gray-500">阿里云号码认证服务，支持短信验证码发送</p>
          </div>

          <!-- 腾讯云 -->
          <div
            :class="[
              'p-4 rounded-xl border-2 cursor-pointer transition-all relative',
              activeProvider === 'tencent'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300',
            ]"
            @click="switchProvider('tencent')"
          >
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center">
                <i class="fas fa-cloud text-2xl text-blue-400 mr-2" />
                <span class="font-medium text-gray-800">腾讯云</span>
              </div>
              <span class="px-2 py-0.5 text-xs bg-orange-100 text-orange-600 rounded-full">暂未接入</span>
            </div>
            <p class="text-xs text-gray-500">腾讯云短信服务，敬请期待</p>
          </div>
        </div>
      </div>

      <!-- 启用短信服务（全局开关） -->
      <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-4">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="font-semibold text-gray-800">启用短信服务</h3>
            <p class="text-sm text-gray-400 mt-1">开启后用户可通过短信验证码登录</p>
          </div>
          <button
            :class="[
              'relative w-12 h-6 rounded-full transition-colors',
              currentConfig?.isEnabled ? 'bg-blue-500' : 'bg-gray-300',
            ]"
            @click="updateConfig('isEnabled', !currentConfig?.isEnabled)"
          >
            <span
              :class="[
                'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
                currentConfig?.isEnabled ? 'left-6' : 'left-0.5',
              ]"
            />
          </button>
        </div>
      </div>

      <!-- 腾讯云未接入提示 -->
      <div v-if="activeProvider === 'tencent'" class="bg-orange-50 border border-orange-200 rounded-xl p-6 mb-4">
        <div class="flex items-center">
          <i class="fas fa-exclamation-triangle text-orange-500 text-xl mr-3" />
          <div>
            <p class="font-medium text-orange-800">腾讯云短信服务暂未接入</p>
            <p class="text-sm text-orange-600 mt-1">该功能正在开发中，敬请期待。当前请使用阿里云短信服务。</p>
          </div>
        </div>
      </div>

      <!-- 阿里云配置 -->
      <template v-if="activeProvider === 'aliyun' && currentConfig">
        <!-- 操作指南 -->
        <div class="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-4">
          <div class="flex items-start">
            <i class="fas fa-book-open text-blue-500 text-lg mr-3 mt-0.5" />
            <div class="flex-1">
              <h4 class="font-semibold text-blue-800 mb-1">阿里云号码认证服务接入指南</h4>
              <p class="text-sm text-blue-600 mb-3">
                首次使用请先按照阿里云官方文档完成服务开通、签名和模板审核，获取 AccessKey 后在此处配置。
              </p>
              <div class="flex flex-wrap gap-2">
                <a
                  href="https://help.aliyun.com/zh/pnvs/getting-started/sms-authentication-service-novice-guide"
                  target="_blank"
                  class="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
                >
                  <i class="fas fa-external-link-alt mr-2 text-xs" />查看接入指南
                </a>
                <a
                  href="https://dypns.console.aliyun.com/"
                  target="_blank"
                  class="inline-flex items-center px-4 py-2 bg-white text-blue-600 border border-blue-300 rounded-lg text-sm hover:bg-blue-50 transition-colors"
                >
                  <i class="fas fa-cog mr-2 text-xs" />阿里云控制台
                </a>
              </div>
            </div>
          </div>
        </div>

        <!-- AccessKey 配置 -->
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-4">
          <h3 class="font-semibold text-gray-800 mb-4">
            <i class="fas fa-key text-blue-500 mr-2" />AccessKey 配置
          </h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">AccessKey ID</label>
              <input
                :value="currentConfig.accessKey"
                @input="onKeyInput"
                class="w-full px-3 py-2 border rounded-lg text-sm focus:border-blue-400 outline-none"
                placeholder="输入 AccessKey ID"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">AccessKey Secret</label>
              <input
                :value="currentConfig.accessSecret"
                @input="onSecretInput"
                type="password"
                class="w-full px-3 py-2 border rounded-lg text-sm focus:border-blue-400 outline-none"
                placeholder="输入 AccessKey Secret"
              />
            </div>
          </div>
        </div>

        <!-- 短信签名配置 -->
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-4">
          <h3 class="font-semibold text-gray-800 mb-4">
            <i class="fas fa-signature text-blue-500 mr-2" />短信签名
          </h3>
          <div class="relative">
            <input
              v-model="currentConfig.signName"
              @click.stop="showSignDropdown = !showSignDropdown; showTemplateDropdown = false"
              class="w-full px-3 py-2 border rounded-lg text-sm focus:border-blue-400 outline-none pr-8"
              placeholder="输入或选择短信签名"
            />
            <i class="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />

            <div
              v-if="showSignDropdown"
              class="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto"
              @click.stop
            >
              <div
                v-for="sign in signNameOptions"
                :key="sign"
                :class="[
                  'px-3 py-2 text-sm cursor-pointer hover:bg-blue-50',
                  currentConfig?.signName === sign ? 'bg-blue-100 text-blue-700' : 'text-gray-700',
                ]"
                @click="selectSign(sign)"
              >
                <i class="fas fa-check mr-2 text-xs" :class="currentConfig?.signName === sign ? 'visible' : 'invisible'" />
                {{ sign }}
              </div>
            </div>
          </div>
          <p class="text-xs text-gray-400 mt-2">
            <i class="fas fa-info-circle mr-1" />
            输入自定义签名或从下拉列表选择已验证的签名
          </p>
        </div>

        <!-- 短信模板配置 -->
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-4">
          <h3 class="font-semibold text-gray-800 mb-4">
            <i class="fas fa-file-alt text-blue-500 mr-2" />短信模板
          </h3>
          <div class="relative">
            <input
              v-model="currentConfig.templateCode"
              @click.stop="showTemplateDropdown = !showTemplateDropdown; showSignDropdown = false"
              class="w-full px-3 py-2 border rounded-lg text-sm focus:border-blue-400 outline-none pr-8"
              placeholder="输入或选择模板CODE"
            />
            <i class="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />

            <div
              v-if="showTemplateDropdown"
              class="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-64 overflow-y-auto"
              @click.stop
            >
              <div
                v-for="t in templateOptions"
                :key="t.code"
                :class="[
                  'px-3 py-2 text-sm cursor-pointer hover:bg-blue-50',
                  currentConfig?.templateCode === t.code ? 'bg-blue-100 text-blue-700' : 'text-gray-700',
                ]"
                @click="selectTemplate(t.code)"
              >
                <div class="flex items-center">
                  <i class="fas fa-check mr-2 text-xs" :class="currentConfig?.templateCode === t.code ? 'visible' : 'invisible'" />
                  <span class="font-medium">{{ t.code }}</span>
                  <span class="text-gray-500 ml-2">- {{ t.name }}</span>
                </div>
                <p class="text-xs text-gray-400 mt-1 ml-5">{{ t.content }}</p>
              </div>
            </div>
          </div>
          <div v-if="currentConfig?.templateCode" class="mt-3 p-3 bg-gray-50 rounded-lg">
            <p class="text-xs text-gray-500">
              <span class="font-medium">当前模板：</span>
              {{ templateOptions.find(t => t.code === currentConfig?.templateCode)?.name || '自定义模板' }}
            </p>
            <p class="text-xs text-gray-400 mt-1">
              {{ templateOptions.find(t => t.code === currentConfig?.templateCode)?.content || '请输入有效的模板CODE' }}
            </p>
          </div>
        </div>

        <!-- 测试发送 -->
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-4">
          <h3 class="font-semibold text-gray-800 mb-4">
            <i class="fas fa-paper-plane text-blue-500 mr-2" />测试发送
          </h3>
          <div class="flex gap-3">
            <input
              v-model="testPhone"
              class="flex-1 px-3 py-2 border rounded-lg text-sm focus:border-blue-400 outline-none"
              placeholder="输入测试手机号"
              maxlength="11"
            />
            <button
              class="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50"
              :disabled="testSending"
              @click="sendTest"
            >
              <i v-if="testSending" class="fas fa-spinner fa-spin mr-1" />
              {{ testSending ? '发送中...' : '发送测试' }}
            </button>
          </div>

          <!-- 测试结果详情 -->
          <div v-if="testResult" class="mt-4 border rounded-lg overflow-hidden">
            <div :class="['px-4 py-2 text-sm font-medium', testResult.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700']">
              <i :class="testResult.success ? 'fas fa-check-circle' : 'fas fa-times-circle'" class="mr-2" />
              {{ testResult.status }}
            </div>

            <div class="p-4 space-y-3 bg-gray-50">
              <div>
                <p class="text-xs font-medium text-gray-500 mb-2">
                  <i class="fas fa-arrow-up mr-1" />请求信息
                </p>
                <div class="bg-white p-3 rounded border text-xs font-mono">
                  <p><span class="text-gray-500">AccessKey ID:</span> {{ testResult.accessKeyId }}</p>
                  <p><span class="text-gray-500">手机号:</span> {{ testResult.request.phoneNumber }}</p>
                  <p><span class="text-gray-500">签名:</span> {{ testResult.request.signName }}</p>
                  <p><span class="text-gray-500">模板CODE:</span> {{ testResult.request.templateCode }}</p>
                  <p><span class="text-gray-500">模板参数:</span> {{ testResult.request.templateParam }}</p>
                </div>
              </div>

              <div>
                <p class="text-xs font-medium text-gray-500 mb-2">
                  <i class="fas fa-arrow-down mr-1" />响应信息
                </p>
                <div class="bg-white p-3 rounded border text-xs font-mono">
                  <pre class="whitespace-pre-wrap break-all">{{ JSON.stringify(testResult.response, null, 2) }}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 保存按钮 -->
        <div class="flex justify-end pt-4">
          <button
            class="px-6 py-2.5 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50"
            :disabled="saving"
            @click="save"
          >
            <i v-if="saving" class="fas fa-spinner fa-spin mr-1" />
            <i v-else class="fas fa-save mr-1" />
            {{ saving ? '保存中...' : '保存设置' }}
          </button>
        </div>
      </template>

      <!-- 阿里云配置为空时的提示 -->
      <div v-else-if="activeProvider === 'aliyun'" class="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
        <div class="flex items-center">
          <i class="fas fa-exclamation-circle text-yellow-500 text-xl mr-3" />
          <div>
            <p class="font-medium text-yellow-800">短信配置数据加载失败</p>
            <p class="text-sm text-yellow-600 mt-1">请刷新页面重试，或联系管理员初始化短信配置。</p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>