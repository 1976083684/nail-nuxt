<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const settings = ref<any[]>([])
const loading = ref(false)
const saving = ref(false)
const testPhone = ref('')
const testSending = ref(false)
const testResult = ref('')

const smsKeys = ['sms_enabled', 'sms_provider', 'sms_access_key', 'sms_access_secret', 'sms_sign_name', 'sms_template_code']

const providers = [
  {
    value: 'aliyun',
    label: '阿里云短信',
    icon: 'fab fa-alipay',
    description: '阿里云短信服务',
    docUrl: 'https://help.aliyun.com/zh/pnvs/getting-started/sms-authentication-service-novice-guide',
    fields: [
      { key: 'sms_access_key', label: 'AccessKey ID', placeholder: '输入阿里云 AccessKey ID' },
      { key: 'sms_access_secret', label: 'AccessKey Secret', placeholder: '输入阿里云 AccessKey Secret', type: 'password' },
      { key: 'sms_sign_name', label: '短信签名', placeholder: '如: LUXE NAIL' },
      { key: 'sms_template_code', label: '模板代码', placeholder: '如: SMS_123456789' },
    ],
  },
  {
    value: 'tencent',
    label: '腾讯云短信',
    icon: 'fas fa-cloud',
    description: '腾讯云短信服务',
    docUrl: 'https://cloud.tencent.com/document/product/382/3773',
    fields: [
      { key: 'sms_access_key', label: 'SecretId', placeholder: '输入腾讯云 SecretId' },
      { key: 'sms_access_secret', label: 'SecretKey', placeholder: '输入腾讯云 SecretKey', type: 'password' },
      { key: 'sms_sign_name', label: '短信签名', placeholder: '如: LUXE NAIL' },
      { key: 'sms_template_code', label: '模板ID', placeholder: '如: 123456' },
    ],
  },
  {
    value: 'qiniu',
    label: '七牛云短信',
    icon: 'fas fa-server',
    description: '七牛云短信服务',
    docUrl: 'https://developer.qiniu.com/sms',
    fields: [
      { key: 'sms_access_key', label: 'AccessKey', placeholder: '输入七牛云 AccessKey' },
      { key: 'sms_access_secret', label: 'SecretKey', placeholder: '输入七牛云 SecretKey', type: 'password' },
      { key: 'sms_sign_name', label: '短信签名', placeholder: '如: LUXE NAIL' },
      { key: 'sms_template_code', label: '模板ID', placeholder: '输入模板ID' },
    ],
  },
]

function getSetting(key: string): string {
  return settings.value.find(s => s.setting_key === key)?.setting_value || ''
}

function setSetting(key: string, value: string) {
  const item = settings.value.find(s => s.setting_key === key)
  if (item) item.setting_value = value
}

const smsEnabled = computed({
  get: () => getSetting('sms_enabled') === 'true',
  set: (v: boolean) => setSetting('sms_enabled', String(v)),
})

const currentProvider = computed(() => {
  return providers.find(p => p.value === getSetting('sms_provider')) || providers[0]
})

async function load() {
  loading.value = true
  try {
    const data = await $fetch<any[]>('/api/admin/settings')
    settings.value = (data || []).filter(s => smsKeys.includes(s.setting_key))
    // 确保所有key都有值
    for (const key of smsKeys) {
      if (!settings.value.find(s => s.setting_key === key)) {
        settings.value.push({ setting_key: key, setting_value: key === 'sms_enabled' ? 'false' : key === 'sms_provider' ? 'aliyun' : '' })
      }
    }
  } catch {}
  loading.value = false
}

async function save() {
  saving.value = true
  try {
    await $fetch('/api/admin/settings', {
      method: 'PUT',
      body: {
        settings: settings.value.map(s => ({
          setting_key: s.setting_key,
          setting_value: s.setting_value,
        })),
      },
    })
    alert('保存成功')
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
  testResult.value = ''
  try {
    const data = await $fetch<any>('/api/admin/settings/sms-test', {
      method: 'POST',
      body: { phone: testPhone.value },
    })
    testResult.value = data.success ? '发送成功' : '发送失败: ' + (data.message || '未知错误')
  } catch (e: any) {
    testResult.value = '发送失败: ' + (e?.data?.message || '网络错误')
  }
  testSending.value = false
}

onMounted(load)
</script>

<template>
  <div>
    <div class="flex items-center gap-3 mb-6">
      <NuxtLink to="/admin/settings" class="text-gray-400 hover:text-pink-500">
        <i class="fas fa-arrow-left" />
      </NuxtLink>
      <h2 class="text-xl font-bold text-gray-800">短信配置</h2>
    </div>

    <div v-if="loading" class="text-center py-20">
      <i class="fas fa-spinner fa-spin text-pink-500 text-3xl" />
    </div>

    <template v-else>
      <!-- 开关 -->
      <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-4">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="font-semibold text-gray-800">启用短信服务</h3>
            <p class="text-sm text-gray-400 mt-1">开启后用户可通过短信验证码登录</p>
          </div>
          <button
            :class="[
              'relative w-12 h-6 rounded-full transition-colors',
              smsEnabled ? 'bg-pink-500' : 'bg-gray-300',
            ]"
            @click="smsEnabled = !smsEnabled"
          >
            <span
              :class="[
                'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
                smsEnabled ? 'left-6' : 'left-0.5',
              ]"
            />
          </button>
        </div>
      </div>

      <!-- 供应商选择 -->
      <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-4">
        <h3 class="font-semibold text-gray-800 mb-4">
          <i class="fas fa-building text-pink-500 mr-2" />短信供应商
        </h3>
        <div class="grid grid-cols-3 gap-3">
          <button
            v-for="p in providers"
            :key="p.value"
            :class="[
              'p-4 rounded-xl border-2 text-center transition-all',
              getSetting('sms_provider') === p.value
                ? 'border-pink-500 bg-pink-50'
                : 'border-gray-200 hover:border-pink-300',
            ]"
            @click="setSetting('sms_provider', p.value)"
          >
            <i :class="p.icon" class="text-2xl mb-2 text-gray-600" />
            <p class="text-sm font-medium text-gray-700">{{ p.label }}</p>
          </button>
        </div>
        <p class="text-xs text-gray-400 mt-3">
          <i class="fas fa-info-circle mr-1" />
          选择不同的供应商需要配置对应的参数，每个供应商的参数格式可能不同
        </p>
      </div>

      <!-- 接口配置 -->
      <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-4">
        <h3 class="font-semibold text-gray-800 mb-4">
          <i class="fas fa-key text-pink-500 mr-2" />{{ currentProvider.label }}配置
        </h3>
        <p class="text-sm text-gray-500 mb-4">
          {{ currentProvider.description }}
          <a :href="currentProvider.docUrl" target="_blank" class="text-pink-500 hover:text-pink-600 ml-1">
            <i class="fas fa-external-link-alt mr-1" />查看文档
          </a>
        </p>
        <div class="space-y-4">
          <div v-for="field in currentProvider.fields" :key="field.key">
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ field.label }}</label>
            <input
              :value="getSetting(field.key)"
              @input="setSetting(field.key, ($event.target as HTMLInputElement).value)"
              :type="field.type || 'text'"
              class="w-full px-3 py-2 border rounded-lg text-sm focus:border-pink-400 outline-none"
              :placeholder="field.placeholder"
            />
          </div>
        </div>
      </div>

      <!-- 配置说明 -->
      <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-4">
        <h3 class="font-semibold text-gray-800 mb-4">
          <i class="fas fa-info-circle text-pink-500 mr-2" />配置说明
        </h3>
        <div class="text-sm text-gray-600 space-y-2">
          <p v-if="getSetting('sms_provider') === 'aliyun'">
            <strong>阿里云短信配置步骤：</strong>
          </p>
          <ol v-if="getSetting('sms_provider') === 'aliyun'" class="list-decimal pl-5 space-y-1">
            <li>登录阿里云控制台，开通短信服务</li>
            <li>创建短信签名（需审核通过）</li>
            <li>创建短信模板（需审核通过）</li>
            <li>获取 AccessKey ID 和 AccessKey Secret</li>
            <li>在下方填写配置信息并保存</li>
          </ol>
          <p v-if="getSetting('sms_provider') === 'aliyun'" class="text-orange-500 mt-2">
            <i class="fas fa-exclamation-triangle mr-1" />
            注意：短信签名和模板需要在阿里云控制台审核通过后才能使用
          </p>
          <p v-if="getSetting('sms_provider') === 'tencent'">
            <strong>腾讯云短信配置步骤：</strong>
          </p>
          <ol v-if="getSetting('sms_provider') === 'tencent'" class="list-decimal pl-5 space-y-1">
            <li>登录腾讯云控制台，开通短信服务</li>
            <li>创建短信签名（需审核通过）</li>
            <li>创建短信模板（需审核通过）</li>
            <li>获取 SecretId 和 SecretKey</li>
            <li>在下方填写配置信息并保存</li>
          </ol>
          <p v-if="getSetting('sms_provider') === 'qiniu'">
            <strong>七牛云短信配置步骤：</strong>
          </p>
          <ol v-if="getSetting('sms_provider') === 'qiniu'" class="list-decimal pl-5 space-y-1">
            <li>登录七牛云控制台，开通短信服务</li>
            <li>创建短信签名和模板</li>
            <li>获取 AccessKey 和 SecretKey</li>
            <li>在下方填写配置信息并保存</li>
          </ol>
        </div>
      </div>

      <!-- 测试发送 -->
      <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-4">
        <h3 class="font-semibold text-gray-800 mb-4">
          <i class="fas fa-paper-plane text-pink-500 mr-2" />测试发送
        </h3>
        <div class="flex gap-3">
          <input
            v-model="testPhone"
            class="flex-1 px-3 py-2 border rounded-lg text-sm focus:border-pink-400 outline-none"
            placeholder="输入测试手机号"
            maxlength="11"
          />
          <button
            class="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50"
            :disabled="testSending || !smsEnabled"
            @click="sendTest"
          >
            <i v-if="testSending" class="fas fa-spinner fa-spin mr-1" />
            {{ testSending ? '发送中...' : '发送测试' }}
          </button>
        </div>
        <p v-if="testResult" :class="['text-sm mt-2', testResult.includes('成功') ? 'text-green-600' : 'text-red-600']">
          {{ testResult }}
        </p>
        <p v-if="!smsEnabled" class="text-xs text-orange-500 mt-2">
          <i class="fas fa-exclamation-triangle mr-1" />请先启用短信服务
        </p>
      </div>

      <!-- 保存按钮 -->
      <div class="flex justify-end pt-4">
        <button
          class="px-6 py-2.5 bg-pink-500 text-white rounded-lg text-sm hover:bg-pink-600 disabled:opacity-50"
          :disabled="saving"
          @click="save"
        >
          <i v-if="saving" class="fas fa-spinner fa-spin mr-1" />
          <i v-else class="fas fa-save mr-1" />
          {{ saving ? '保存中...' : '保存设置' }}
        </button>
      </div>
    </template>
  </div>
</template>
