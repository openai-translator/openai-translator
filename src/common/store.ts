import { create } from 'zustand'

interface ITranslatorState {
    editableText: string
    originalText: string
}

export const useTranslatorStore = create<ITranslatorState>()(() => ({
    editableText: '',
    originalText: '',
}))

export const setEditableText = (text: string) => useTranslatorStore.setState({ editableText: text })
export const setOriginalText = (text: string) => useTranslatorStore.setState({ originalText: text })
