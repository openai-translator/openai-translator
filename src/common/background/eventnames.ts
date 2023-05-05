import { IVocabularyInternalService } from '../internal-services/vocabulary'

export const BackgroundEventNames = {
    fetch: 'fetch',
    vocabularyService: 'vocabularyService',
}

export type BackgroundVocabularyServiceMethodNames = keyof IVocabularyInternalService
