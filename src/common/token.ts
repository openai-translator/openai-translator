import { encodingForModel, TiktokenModel, Tiktoken } from 'js-tiktoken'

class Encoding {
    enc: Tiktoken

    constructor(model: TiktokenModel) {
        this.enc = encodingForModel(model)
    }

    count(text: string): number {
        return this.enc.encode(text).length
    }
}

const cachedEncodings: { [key: string]: Encoding } = {}

const tiktokenModels = new Set([
    'text-davinci-003',
    'text-davinci-002',
    'text-davinci-001',
    'text-curie-001',
    'text-babbage-001',
    'text-ada-001',
    'davinci',
    'curie',
    'babbage',
    'ada',
    'code-davinci-002',
    'code-davinci-001',
    'code-cushman-002',
    'code-cushman-001',
    'davinci-codex',
    'cushman-codex',
    'text-davinci-edit-001',
    'code-davinci-edit-001',
    'text-embedding-ada-002',
    'text-similarity-davinci-001',
    'text-similarity-curie-001',
    'text-similarity-babbage-001',
    'text-similarity-ada-001',
    'text-search-davinci-doc-001',
    'text-search-curie-doc-001',
    'text-search-babbage-doc-001',
    'text-search-ada-doc-001',
    'code-search-babbage-code-001',
    'code-search-ada-code-001',
    'gpt2',
    'gpt-4',
    'gpt-4-0314',
    'gpt-4-0613',
    'gpt-4-32k',
    'gpt-4-32k-0314',
    'gpt-4-32k-0613',
    'gpt-3.5-turbo-1106',
    'gpt-3.5-turbo',
    'gpt-3.5-turbo-0301',
    'gpt-3.5-turbo-0613',
    'gpt-3.5-turbo-16k',
    'gpt-3.5-turbo-16k-0613',
])

function isTiktokenModel(model: string): model is TiktokenModel {
    return tiktokenModels.has(model)
}

export function countTokens(text: string, model = 'gpt-3.5-turbo-0613'): number {
    if (!isTiktokenModel(model)) {
        model = 'gpt-3.5-turbo-0613'
    }
    let enc = cachedEncodings[model]
    if (!enc) {
        enc = new Encoding(model as TiktokenModel)
        cachedEncodings[model] = enc
    }
    return enc.count(text)
}
