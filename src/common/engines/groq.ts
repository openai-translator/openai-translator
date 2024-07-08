import { urlJoin } from 'url-join-ts'
import { CUSTOM_MODEL_ID } from '../constants'
import { getUniversalFetch } from '../universal-fetch'
import { getSettings } from '../utils'
import { AbstractOpenAI } from './abstract-openai'
import { IModel } from './interfaces'

export class Groq extends AbstractOpenAI {
    supportCustomModel(): boolean {
        return true
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async listModels(apiKey: string | undefined): Promise<IModel[]> {
        if (!apiKey) {
            return []
        }
        const fetcher = getUniversalFetch()
        const settings = await getSettings()
        const url = urlJoin(settings.groqAPIURL, '/openai/v1/models')
        const resp = await fetcher(url, {
            cache: 'no-cache',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            method: 'GET',
        })
        const data = await resp.json()
        return data.data.map((model: { id: string; owned_by: string; active: boolean }) => {
            return {
                id: model.id,
                name: `${model.id} (${model.owned_by})`,
            } as IModel
        })
    }

    async getAPIModel(): Promise<string> {
        const settings = await getSettings()
        if (settings.groqAPIModel === CUSTOM_MODEL_ID) {
            return settings.groqCustomModelName
        }
        return settings.groqAPIModel
    }

    async getAPIKey(): Promise<string> {
        const settings = await getSettings()
        return settings.groqAPIKey
    }

    async getAPIURL(): Promise<string> {
        const settings = await getSettings()
        return settings.groqAPIURL
    }

    async getAPIURLPath(): Promise<string> {
        const settings = await getSettings()
        return settings.groqAPIURLPath
    }
}
