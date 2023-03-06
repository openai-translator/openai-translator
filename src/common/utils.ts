const apiKeyStorageKey = 'apiKey'

export async function getApiKey(): Promise<string> {
    return new Promise((resolve) => {
        chrome.storage.sync.get([apiKeyStorageKey], (items) => {
            const apiKeys = items?.[apiKeyStorageKey] ?? ''
            const keys = apiKeys.split(',') // Split the API keys into an array
            keys.length === 0 ? resolve(apiKeys) : resolve(keys[Math.floor(Math.random() * keys.length)])
        })
    })
}

export async function setApiKey(apiKey: string) {
    return new Promise<void>((resolve) => {
        chrome.storage.sync.set({ [apiKeyStorageKey]: apiKey }, () => {
            resolve()
        })
    })
}
