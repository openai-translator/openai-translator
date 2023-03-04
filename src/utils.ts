const apiKeyStorageKey = 'apiKey'

export async function getApiKey(): Promise<string> {
    return new Promise((resolve) => {
        chrome.storage.sync.get([apiKeyStorageKey], (items) => {
            resolve(items?.[apiKeyStorageKey] ?? '')
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
