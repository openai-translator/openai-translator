import { createGlobalState } from 'react-hooks-global-state'

const initialState = { collectedWordTotal: 0 }
export const { useGlobalState } = createGlobalState(initialState)
