/* eslint-disable camelcase */
import LRUCache from 'lru-cache'
import { AuthCodeModel, ISettings, OpenAIModelDetail } from '../common/types'
import { defaultAPIModel, setSettings } from '../common/utils'
import { getUniversalFetch } from './universal-fetch'

/* eslint-disable @typescript-eslint/no-explicit-any */
export const defaultOpenAIModelDetail: OpenAIModelDetail = { id: defaultAPIModel, name: 'GPT-3.5' }

export async function subscribeApiKeys(subscription: string, signal: AbortSignal): Promise<string[]> {
    if (!subscription) {
        return []
    }

    // extract apiKeys
    function parseSubscribeResponse(content: string): string[] {
        try {
            const matcher = content?.match(/sk-[A-Za-z0-9]{48}/g)
            return matcher ? matcher : []
        } catch {
            return []
        }
    }

    return new Promise((resolve) => {
        ;(async () => {
            await getUniversalFetch()(subscription, { signal: signal })
                .then((response) => (response?.status === 200 ? response?.text() : ''))
                .then(parseSubscribeResponse)
                .then(resolve)
                .catch(() => resolve([]))
        })()
    })
}

export async function batchSubscribeApiKeys(subscriptions: string[], signal: AbortSignal): Promise<string[][]> {
    if (!subscriptions) {
        return []
    }

    return Promise.all(subscriptions.map(async (subscription) => await subscribeApiKeys(subscription, signal)))
}

export async function filterApiKeys(
    url: string,
    apiKeySet: Set<string>,
    signal: AbortSignal,
    limit = 30
): Promise<string[]> {
    if (!url || !apiKeySet) {
        return []
    }

    const apiKeys = Array.from(apiKeySet.values())
    // return Promise.all(apiKeys.map(async (apiKey) => await validateApiKey(url, apiKey, signal))).then((availables) =>
    //     apiKeys.filter((_, index) => availables[index])
    // )

    const { length } = apiKeys
    const results: Promise<boolean>[] = []
    const runnings: Promise<any>[] = []
    const concurrent: number = Math.min(Math.max(limit, 1), 50)

    for (const apiKey of apiKeys) {
        const p = Promise.resolve().then(() => validateApiKey(url, apiKey, signal))
        results.push(p)

        if (concurrent <= length) {
            const e = p.then(() => {
                const index = runnings.indexOf(e)
                return runnings.splice(index, 1)
            })

            runnings.push(e)
            if (runnings.length >= limit) {
                await Promise.race(runnings)
            }
        }
    }

    return Promise.all(results).then((availables) => apiKeys.filter((_, index) => availables[index]))
}

export async function validateApiKey(url: string, apiKey: string, signal: AbortSignal): Promise<boolean> {
    if (!apiKey || !url) {
        return false
    }

    const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` }
    const body = JSON.stringify({
        model: 'gpt-3.5-turbo',
        max_tokens: 5,
        stream: true,
        messages: [
            {
                role: 'system',
                content: 'You are a Python developer',
            },
            {
                role: 'user',
                content: 'Hello, world!',
            },
        ],
    })

    return await getUniversalFetch()(url, { method: 'POST', headers: headers, body: body, signal: signal })
        .then((response) => (response?.status || 400) as number)
        .then((status) => status === 200)
        .catch(() => false)
}

async function generateAuthCodeModel(apiURL: string): Promise<AuthCodeModel | undefined> {
    const payloads: Map<string, Record<string, string>> = new Map([
        [`${apiURL}/api/user`, { authcode: '' } as Record<string, string>],
        [`${apiURL}/api/models`, { key: '' } as Record<string, string>],
    ])

    const responses = await Promise.all(
        Array.from(payloads).map(([url, payload]) => {
            return new Promise((resolve) => {
                ;(async () => {
                    await getUniversalFetch()(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload),
                    })
                        .then((response) => (response?.status === 200 ? response?.json() : undefined))
                        .then(resolve)
                        .catch(() => resolve(undefined))
                })()
            })
        })
    )

    try {
        const user = (responses[0] || {}) as Record<string, any>
        const models = (responses[1] || []) as OpenAIModelDetail[]
        const authCode: string = user?.authCode || ''

        if (!authCode || typeof user.authCode !== 'string') {
            return undefined
        }

        let model: OpenAIModelDetail = defaultOpenAIModelDetail
        if (models) {
            const modelIndexes = new Map<string, OpenAIModelDetail>()
            for (let index = 0; index < models.length; index++) {
                const item = models[index]
                if (!item?.id) {
                    continue
                }
                modelIndexes.set(item.id, item)
            }

            model = modelIndexes.get('gpt-4') || modelIndexes.get(defaultAPIModel) || models[0]
        }

        return { authCode: authCode, model: model }
    } catch {
        return undefined
    }
}

async function persistAuthSettings(settings: ISettings, key: string, value: AuthCodeModel | undefined): Promise<void> {
    if (!settings || !key || !settings.providersProps['ThirdPartyChatGPT']) {
        return
    }

    const extra: Record<string, any> = settings.providersProps['ThirdPartyChatGPT'].extra || {}
    const auths = new Map<string, AuthCodeModel>(Object.entries(extra.auths || {}))
    if (value === undefined) {
        // not exist or delete failed
        if (!auths.get(key) || !auths.delete(key)) {
            return
        }
    } else {
        auths.set(key, value)
    }

    extra.auths = Object.fromEntries(auths)
    settings.providersProps['ThirdPartyChatGPT'].extra = extra

    // apply all changes to the original settings object before saving
    Object.assign(settings.providersProps['ThirdPartyChatGPT'].extra, extra)
    return setSettings(settings)
}

export class AuthCodeModelManager {
    private static instance: AuthCodeModelManager
    private settings: ISettings
    private cache: LRUCache<string, AuthCodeModel>

    private constructor(settings: ISettings) {
        this.settings = settings
        this.cache = new LRUCache<string, AuthCodeModel>({
            max: 50,
            maxSize: 500,
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            sizeCalculation: (_value, _key) => {
                return 1
            },
        })

        const auths = settings?.providersProps['ThirdPartyChatGPT']?.extra?.auths
        try {
            if (auths && typeof auths === 'object') {
                Object.entries(auths).map(([k, v]) => {
                    const authCodeModel: AuthCodeModel = v as AuthCodeModel
                    if (k && authCodeModel.authCode) {
                        this.cache.set(k, authCodeModel)
                    }
                })
            }
        } catch {
            console.error(`cache auth code and model from settings error`)
        }
    }

    public static getInstance(settings: ISettings) {
        if (!AuthCodeModelManager.instance) {
            AuthCodeModelManager.instance = new AuthCodeModelManager(settings)
        }

        return AuthCodeModelManager.instance
    }

    async get(key: string): Promise<AuthCodeModel | undefined> {
        if (!key) {
            return undefined
        }

        let authCodeModel = this.cache.get(key)
        if (!authCodeModel) {
            authCodeModel = await generateAuthCodeModel(key)
            if (authCodeModel?.authCode) {
                // add to cache
                this.update(key, authCodeModel)
            }
        }

        return authCodeModel
    }

    async _dispose(key: string, values: AuthCodeModel | undefined): Promise<void> {
        if (!key || this.cache.get(key) === values) {
            return
        }

        if (values === undefined) {
            if (!this.cache.delete(key)) {
                console.warn(`failed to delete ${key} from cache`)
                return
            }
        } else {
            this.cache.set(key, values)
        }

        // save to localstorage
        persistAuthSettings(this.settings, key, values)
    }

    async update(key: string, values: AuthCodeModel): Promise<void> {
        this._dispose(key, values)
    }

    async remove(key: string): Promise<void> {
        this._dispose(key, undefined)
    }
}
