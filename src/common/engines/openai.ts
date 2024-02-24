/* eslint-disable camelcase */
import { CUSTOM_MODEL_ID } from '../constants'
import { getSettings } from '../utils'
import { AbstractOpenAI } from './abstract-openai'

export class OpenAI extends AbstractOpenAI {
    supportCustomModel(): boolean {
        return true
    }

    async getAPIModel(): Promise<string> {
        const settings = await getSettings()
        if (settings.apiModel === CUSTOM_MODEL_ID) {
            return settings.customModelName ?? ''
        }
        return settings.apiModel
    }

    async getAPIKey(): Promise<string> {
        const settings = await getSettings()
        const apiKeys = (settings.apiKeys ?? '').split(',').map((s) => s.trim())
        const apiKey = apiKeys[Math.floor(Math.random() * apiKeys.length)] ?? ''
        return apiKey
    }

    async getAPIURL(): Promise<string> {
        const settings = await getSettings()
        return settings.apiURL
    }

    async getAPIURLPath(): Promise<string> {
        const settings = await getSettings()
        return settings.apiURLPath
    }
}
