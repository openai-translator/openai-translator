/* eslint-disable camelcase */
import { getSettings } from '../utils'
import { AbstractOpenAI } from './abstract-openai'

export class OpenAI extends AbstractOpenAI {
    async getAPIModel(): Promise<string> {
        const settings = await getSettings()
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
