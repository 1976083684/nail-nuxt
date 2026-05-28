<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const items = ref<any[]>([])
const loading = ref(false)
const savingGroup = ref<string | null>(null)

const groupLabels: Record<string, string> = {
  hero: '首页主视觉 (Hero)',
  services: '服务区域',
  artists: '美甲师区域',
  gallery: '画廊区域',
  cta: '预约引导区域',
  footer: '页脚',
}

async function load() {
  loading.value = true
  try {
    const data = await $fetch<any[]>('/api/admin/site-content')
    items.value = data || []
  } catch {}
  loading.value = false
}

const grouped = computed(() => {
  const map: Record<string, any[]> = {}
  for (const item of items.value) {
    if (!map[item.content_group]) map[item.content_group] = []
    map[item.content_group]!.push(item)
  }
  return map
})

async function saveGroup(group: string) {
  savingGroup.value = group
  try {
    const groupItems = grouped.value[group] || []
    await $fetch('/api/admin/site-content', {
      method: 'PUT',
      body: { items: groupItems.map(i => ({ content_key: i.content_key, content_value: i.content_value })) },
    })
    alert('保存成功')
  } catch (e: any) {
    alert(e?.data?.message || '保存失败')
  }
  savingGroup.value = null
}

onMounted(load)
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-bold text-gray-800">内容管理</h2>
    </div>

    <div v-if="loading" class="text-center py-12">
      <i class="fas fa-spinner fa-spin text-blue-500 text-xl" />
    </div>

    <div v-else class="space-y-6">
      <div
        v-for="(groupItems, group) in grouped"
        :key="group"
        class="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
      >
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <i class="fas fa-layer-group text-blue-400 text-sm" />
            {{ groupLabels[group] || group }}
          </h3>
          <button
            class="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50"
            :disabled="savingGroup === group"
            @click="saveGroup(group)"
          >
            <i v-if="savingGroup === group" class="fas fa-spinner fa-spin mr-1" />
            <i v-else class="fas fa-save mr-1" />
            {{ savingGroup === group ? '保存中...' : '保存' }}
          </button>
        </div>
        <div class="grid gap-4">
          <div v-for="item in groupItems" :key="item.content_key">
            <label class="block text-sm font-medium text-gray-600 mb-1">
              {{ item.description || item.content_key }}
            </label>
            <input
              v-model="item.content_value"
              class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-400 outline-none transition-colors"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
