/* eslint-disable camelcase */
import { getSettings } from '../utils'
import { AbstractOpenAI } from './abstract-openai'

export class Azure extends AbstractOpenAI {
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

    async getAPIURL(): Promise<string> {
        const settings = await getSettings()
        return settings.azureAPIURL
    }

    async getAPIURLPath(): Promise<string> {
        const settings = await getSettings()
        return settings.azureAPIURLPath
    }
}
