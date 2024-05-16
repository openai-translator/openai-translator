/* eslint-disable camelcase */
import { getSettings } from '../utils'
import { AbstractOpenAI } from './abstract-openai'
import { IModel } from './interfaces'

export class Azure extends AbstractOpenAI {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async listModels(apiKey_: string | undefined): Promise<IModel[]> {
        return [
            { name: 'gpt-3.5-turbo-1106', id: 'gpt-3.5-turbo-1106' },
            { name: 'gpt-3.5-turbo', id: 'gpt-3.5-turbo' },
            { name: 'gpt-3.5-turbo-0613', id: 'gpt-3.5-turbo-0613' },
            { name: 'gpt-3.5-turbo-0301', id: 'gpt-3.5-turbo-0301' },
            { name: 'gpt-3.5-turbo-16k', id: 'gpt-3.5-turbo-16k' },
            { name: 'gpt-3.5-turbo-16k-0613', id: 'gpt-3.5-turbo-16k-0613' },
            { name: 'gpt-4', id: 'gpt-4' },
            { name: 'gpt-4o (recommended)', id: 'gpt-4o' },
            { name: 'gpt-4-turbo', id: 'gpt-4-turbo' },
            { name: 'gpt-4-turbo-2024-04-09', id: 'gpt-4-turbo-2024-04-09' },
            { name: 'gpt-4-turbo-preview', id: 'gpt-4-turbo-preview' },
            { name: 'gpt-4-0125-preview ', id: 'gpt-4-0125-preview' },
            { name: 'gpt-4-1106-preview', id: 'gpt-4-1106-preview' },
            { name: 'gpt-4-0314', id: 'gpt-4-0314' },
            { name: 'gpt-4-0613', id: 'gpt-4-0613' },
            { name: 'gpt-4-32k', id: 'gpt-4-32k' },
            { name: 'gpt-4-32k-0314', id: 'gpt-4-32k-0314' },
            { name: 'gpt-4-32k-0613', id: 'gpt-4-32k-0613' },
        ]
    }

    async isChatAPI(): Promise<boolean> {
        const settings = await getSettings()
        return !(settings.azureAPIURLPath && settings.azureAPIURLPath.indexOf('/chat/completions') < 0)
    }

    async getAPIModel(): Promise<string> {
        const settings = await getSettings()
        return settings.azureAPIModel
    }

    async getAPIKey(): Promise<string> {
        const settings = await getSettings()
        const apiKeys = (settings.azureAPIKeys ?? '').split(',').map((s) => s.trim())
        const apiKey = apiKeys[Math.floor(Math.random() * apiKeys.length)] ?? ''
        return apiKey
    }

    async getHeaders(): Promise<Record<string, string>> {
        const apiKey = await this.getAPIKey()
        return {
            'Content-Type': 'application/json',
            'api-key': apiKey,
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async getBaseRequestBody(): Promise<Record<string, any>> {
        const settings = await getSettings()
        const body = await super.getBaseRequestBody()
        return {
            ...body,
            max_tokens: settings.azMaxWords,
        }
    }

    async getAPIURL(): Promise<string> {
        const settings = await getSettings()
        return settings.azureAPIURL
    }

    async getAPIURLPath(): Promise<string> {
        const settings = await getSettings()
        return settings.azureAPIURLPath
    }
}
