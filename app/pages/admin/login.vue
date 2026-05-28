<script setup lang="ts">
definePageMeta({ layout: false })

const { login, loading } = useAdmin()
const username = ref('')
const password = ref('')
const error = ref('')
const showPassword = ref(false)

async function handleLogin() {
  error.value = ''
  if (!username.value || !password.value) {
    error.value = '请输入用户名和密码'
    return
  }
  try {
    await login(username.value, password.value)
    await navigateTo('/admin')
  } catch (e: any) {
    error.value = e?.data?.message || '登录失败'
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-2xl mb-4">
          <i class="fas fa-gem text-blue-400 text-3xl" />
        </div>
        <h1 class="text-2xl font-bold text-white tracking-wide">LUXE NAIL</h1>
        <p class="text-gray-400 mt-1">管理后台</p>
      </div>

      <!-- Login card -->
      <div class="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
        <form @submit.prevent="handleLogin">
          <!-- Username -->
          <div class="mb-5">
            <label class="block text-sm font-medium text-gray-300 mb-2">用户名</label>
            <div class="relative">
              <i class="fas fa-user absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                v-model="username"
                type="text"
                placeholder="请输入用户名"
                class="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none transition-colors"
                autocomplete="username"
              />
            </div>
          </div>

          <!-- Password -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-300 mb-2">密码</label>
            <div class="relative">
              <i class="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="请输入密码"
                class="w-full pl-11 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none transition-colors"
                autocomplete="current-password"
              />
              <button
                type="button"
                class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                @click="showPassword = !showPassword"
              >
                <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'" />
              </button>
            </div>
          </div>

          <!-- Error -->
          <div v-if="error" class="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
            <i class="fas fa-exclamation-circle mr-1" />
            {{ error }}
          </div>

          <!-- Submit -->
          <button
            type="submit"
            :disabled="loading"
            class="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i v-if="loading" class="fas fa-spinner fa-spin mr-2" />
            {{ loading ? '登录中...' : '登 录' }}
          </button>
        </form>

        <p class="text-center text-gray-500 text-xs mt-6">
          默认账号: admin / admin123
        </p>
      </div>
    </div>
  </div>
</template>
