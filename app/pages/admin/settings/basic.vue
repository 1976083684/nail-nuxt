<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const settings = ref<any[]>([])
const loading = ref(false)
const saving = ref(false)

const basicKeys = ['shop_name', 'shop_phone', 'shop_address', 'business_hours_start', 'business_hours_end', 'slot_duration', 'booking_fee', 'cancel_hours']

async function load() {
  loading.value = true
  try {
    const data = await $fetch<any[]>('/api/admin/settings')
    settings.value = (data || []).filter(s => basicKeys.includes(s.setting_key))
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

function getIcon(key: string) {
  const map: Record<string, string> = {
    shop_name: 'fas fa-gem',
    shop_phone: 'fas fa-phone',
    shop_address: 'fas fa-map-marker-alt',
    business_hours_start: 'fas fa-clock',
    business_hours_end: 'fas fa-clock',
    slot_duration: 'fas fa-hourglass-half',
    booking_fee: 'fas fa-money-bill',
    cancel_hours: 'fas fa-ban',
  }
  return map[key] || 'fas fa-cog'
}

function getLabel(key: string) {
  const map: Record<string, string> = {
    shop_name: '店铺名称',
    shop_phone: '联系电话',
    shop_address: '店铺地址',
    business_hours_start: '营业开始时间',
    business_hours_end: '营业结束时间',
    slot_duration: '时间段间隔（分钟）',
    booking_fee: '预约费用（元）',
    cancel_hours: '不可取消时间（小时）',
  }
  return map[key] || key
}

onMounted(load)
</script>

<template>
  <div>
    <div class="flex items-center gap-3 mb-6">
      <NuxtLink to="/admin/settings" class="text-gray-400 hover:text-blue-500">
        <i class="fas fa-arrow-left" />
      </NuxtLink>
      <h2 class="text-xl font-bold text-gray-800">基础配置</h2>
    </div>

    <div v-if="loading" class="text-center py-20">
      <i class="fas fa-spinner fa-spin text-blue-500 text-3xl" />
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="item in settings"
        :key="item.id"
        class="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
      >
        <div class="flex items-start gap-4">
          <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
            <i :class="getIcon(item.setting_key)" class="text-blue-500" />
          </div>
          <div class="flex-1">
            <label class="block text-sm font-semibold text-gray-700 mb-1">
              {{ getLabel(item.setting_key) }}
            </label>
            <p v-if="item.description" class="text-xs text-gray-400 mb-2">{{ item.description }}</p>
            <input
              v-model="item.setting_value"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none transition-colors"
            />
          </div>
        </div>
      </div>

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
    </div>
  </div>
</template>
