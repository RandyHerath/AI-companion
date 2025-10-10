import type { Pinia } from 'pinia'
import type { Plugin } from 'vue'
import type { Router } from 'vue-router'

import Tres from '@tresjs/core'
import NProgress from 'nprogress'

import { autoAnimatePlugin } from '@formkit/auto-animate/vue'
import { useConsciousnessStore } from '@proj-airi/stage-ui/stores/modules/consciousness'
import { useOnboardingStore } from '@proj-airi/stage-ui/stores/onboarding'
import { useProvidersStore } from '@proj-airi/stage-ui/stores/providers'
import { MotionPlugin } from '@vueuse/motion'
import { createPinia } from 'pinia'
import { setupLayouts } from 'virtual:generated-layouts'
import { createApp } from 'vue'
import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'
import { routes } from 'vue-router/auto-routes'

import App from './App.vue'

import { i18n } from './modules/i18n'

import '@proj-airi/font-cjkfonts-allseto/index.css'
import '@proj-airi/font-xiaolai/index.css'
import '@unocss/reset/tailwind.css'
import './styles/main.css'
import 'uno.css'

const pinia = createPinia()
applyRuntimeDefaults(pinia)
const routeRecords = setupLayouts(routes)

let router: Router
if (import.meta.env.VITE_APP_TARGET_HUGGINGFACE_SPACE)
  router = createRouter({ routes: routeRecords, history: createWebHashHistory() })
else
  router = createRouter({ routes: routeRecords, history: createWebHistory() })

router.beforeEach((to, from) => {
  if (to.path !== from.path)
    NProgress.start()
})

router.afterEach(() => {
  NProgress.done()
})

function applyRuntimeDefaults(pinia: Pinia) {
  if (typeof window === 'undefined')
    return

  const runtimeConfig = window.__NIMARA_CONFIG__ ?? {}
  const defaultApiKey = runtimeConfig.defaultGeminiApiKey ?? import.meta.env.VITE_DEFAULT_GEMINI_API_KEY
  if (!defaultApiKey)
    return

  const providersStore = useProvidersStore(pinia)
  const onboardingStore = useOnboardingStore(pinia)
  const consciousnessStore = useConsciousnessStore(pinia)

  const baseUrl = runtimeConfig.defaultGeminiBaseUrl ?? 'https://generativelanguage.googleapis.com/v1beta/openai/'
  const model = runtimeConfig.defaultGeminiModel ?? import.meta.env.VITE_DEFAULT_GEMINI_MODEL ?? 'gemini-1.5-flash-latest'

  const credentials = providersStore.providers
  if (!credentials.value['google-generative-ai']?.apiKey) {
    credentials.value['google-generative-ai'] = {
      apiKey: defaultApiKey,
      baseUrl,
    }
  }

  providersStore.configuredProviders.value['google-generative-ai'] = true

  onboardingStore.hasCompletedSetup.value = true
  onboardingStore.hasSkippedSetup.value = false
  onboardingStore.shouldShowSetup.value = false

  consciousnessStore.activeProvider.value = 'google-generative-ai'
  if (!consciousnessStore.activeModel.value)
    consciousnessStore.activeModel.value = model

  void providersStore.fetchModelsForProvider('google-generative-ai')
}

createApp(App)
  .use(MotionPlugin)
  // TODO: Fix autoAnimatePlugin type error
  .use(autoAnimatePlugin as unknown as Plugin)
  .use(router)
  .use(pinia)
  .use(i18n)
  .use(Tres)
  .mount('#app')
