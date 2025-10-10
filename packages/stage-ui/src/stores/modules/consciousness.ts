import { useLocalStorage } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { useProvidersStore } from '../providers'

const HARDCODED_GEMINI_API_KEY = 'AIzaSyBy_b7-AgxklHcEjx3SyTgFVUO88wU5CUo'
const HARDCODED_GEMINI_MODEL = 'gemini-1.5-pro-latest'

export const useConsciousnessStore = defineStore('consciousness', () => {
  const providersStore = useProvidersStore()

  // State
  const runtimeConfig = typeof window !== 'undefined' ? (window as any).__NIMARA_CONFIG__ ?? {} : {}
  const DEFAULT_GEMINI_API_KEY = runtimeConfig.defaultGeminiApiKey ?? import.meta.env.VITE_DEFAULT_GEMINI_API_KEY ?? HARDCODED_GEMINI_API_KEY
  const DEFAULT_CHAT_PROVIDER = 'google-generative-ai'
  const DEFAULT_CHAT_MODEL = runtimeConfig.defaultGeminiModel ?? import.meta.env.VITE_DEFAULT_GEMINI_MODEL ?? HARDCODED_GEMINI_MODEL
  const activeProvider = useLocalStorage(
    'settings/consciousness/active-provider',
    DEFAULT_GEMINI_API_KEY ? DEFAULT_CHAT_PROVIDER : '',
  )
  const activeModel = useLocalStorage(
    'settings/consciousness/active-model',
    DEFAULT_GEMINI_API_KEY ? DEFAULT_CHAT_MODEL : '',
  )
  const activeCustomModelName = useLocalStorage('settings/consciousness/active-custom-model', '')
  const expandedDescriptions = ref<Record<string, boolean>>({})
  const modelSearchQuery = ref('')

  // Computed properties
  const supportsModelListing = computed(() => {
    return providersStore.getProviderMetadata(activeProvider.value)?.capabilities.listModels !== undefined
  })

  const providerModels = computed(() => {
    return providersStore.getModelsForProvider(activeProvider.value)
  })

  const isLoadingActiveProviderModels = computed(() => {
    return providersStore.isLoadingModels[activeProvider.value] || false
  })

  const activeProviderModelError = computed(() => {
    return providersStore.modelLoadError[activeProvider.value] || null
  })

  const filteredModels = computed(() => {
    if (!modelSearchQuery.value.trim()) {
      return providerModels.value
    }

    const query = modelSearchQuery.value.toLowerCase().trim()
    return providerModels.value.filter(model =>
      model.name.toLowerCase().includes(query)
      || model.id.toLowerCase().includes(query)
      || (model.description && model.description.toLowerCase().includes(query)),
    )
  })

  function resetModelSelection() {
    activeModel.value = ''
    activeCustomModelName.value = ''
    expandedDescriptions.value = {}
    modelSearchQuery.value = ''
  }

  async function loadModelsForProvider(provider: string) {
    if (provider && providersStore.getProviderMetadata(provider)?.capabilities.listModels !== undefined) {
      await providersStore.fetchModelsForProvider(provider)
    }
  }

  async function getModelsForProvider(provider: string) {
    if (provider && providersStore.getProviderMetadata(provider)?.capabilities.listModels !== undefined) {
      return providersStore.getModelsForProvider(provider)
    }

    return []
  }

  const configured = computed(() => {
    return !!activeProvider.value && !!activeModel.value
  })

  return {
    // State
    configured,
    activeProvider,
    activeModel,
    customModelName: activeCustomModelName,
    expandedDescriptions,
    modelSearchQuery,

    // Computed
    supportsModelListing,
    providerModels,
    isLoadingActiveProviderModels,
    activeProviderModelError,
    filteredModels,

    // Actions
    resetModelSelection,
    loadModelsForProvider,
    getModelsForProvider,
  }
})
