declare global {
  interface Window {
    __NIMARA_CONFIG__?: {
      defaultGeminiApiKey?: string
      defaultGeminiBaseUrl?: string
      defaultGeminiModel?: string
    }
  }
}

export {}
