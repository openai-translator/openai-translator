import { create } from 'zustand'

interface ITranslatorState {
    externalOriginalText?: string
}

export const useTranslatorStore = create<ITranslatorState>()(() => ({
    externalOriginalText: undefined,
}))

export const setExternalOriginalText = (text: string) => useTranslatorStore.setState({ externalOriginalText: text })
