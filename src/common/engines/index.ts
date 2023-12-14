import { Azure } from './azure'
import { ChatGPT } from './chatgpt'
import { Gemini } from './gemini'
import { IEngine } from './interfaces'
import { MiniMax } from './minimax'
import { Moonshot } from './moonshot'
import { OpenAI } from './openai'

export type Provider = 'OpenAI' | 'ChatGPT' | 'Azure' | 'MiniMax' | 'Moonshot' | 'Gemini'

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
        case 'Moonshot':
            engine = new Moonshot()
            break
        case 'Gemini':
            engine = new Gemini()
            break
    }
    return engine
}
