import { Azure } from './azure'
import { ChatGPT } from './chatgpt'
import { IEngine } from './interfaces'
import { MiniMax } from './minimax'
import { OpenAI } from './openai'

export type Provider = 'OpenAI' | 'ChatGPT' | 'Azure' | 'MiniMax'

export function getEngine(provider: Provider): IEngine {
    let engine: IEngine = new OpenAI()
    switch (provider) {
        case 'Azure':
            engine = new Azure()
            break
        case 'ChatGPT':
            engine = new ChatGPT()
            break
        case 'MiniMax':
            engine = new MiniMax()
            break
    }
    return engine
}
