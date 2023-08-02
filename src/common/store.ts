import { create } from 'zustand'

interface ITranslatorState {
    editableText: string
    originalText: string
    detectedOriginalText: string
}

export const useTranslatorStore = create<ITranslatorState>()(() => ({
    editableText: '',
    originalText: '',
    detectedOriginalText: '',
}))

export const setEditableText = (text: string) => useTranslatorStore.setState({ editableText: text })
export const setOriginalText = (text: string) => useTranslatorStore.setState({ originalText: text })
export const setDetectedOriginalText = (text: string) => useTranslatorStore.setState({ detectedOriginalText: text })
