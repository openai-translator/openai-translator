import { backgroundVocabularyService } from '../background/services/vocabulary'
import { IVocabularyInternalService, vocabularyInternalService } from '../internal-services/vocabulary'
import { isDesktopApp } from '../utils'

export const vocabularyService: IVocabularyInternalService = isDesktopApp()
    ? vocabularyInternalService
    : backgroundVocabularyService
