import { IVocabularyInternalService } from '../internal-services/vocabulary'

export const BackgroundEventNames = {
    fetch: 'fetch',
    vocabularyService: 'vocabularyService',
    actionService: 'actionService',
}

export type BackgroundVocabularyServiceMethodNames = keyof IVocabularyInternalService
