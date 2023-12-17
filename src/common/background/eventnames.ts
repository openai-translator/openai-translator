import { IVocabularyInternalService } from '../internal-services/vocabulary'

export const BackgroundEventNames = {
    fetch: 'fetch',
    vocabularyService: 'vocabularyService',
    actionService: 'actionService',
    getItem: 'getItem',
    setItem: 'setItem',
    removeItem: 'removeItem',
}

export type BackgroundVocabularyServiceMethodNames = keyof IVocabularyInternalService
