import { createRoot } from 'react-dom/client'
import { ActionManager } from '../common/components/ActionManager'
import { Window } from './Window'

export function ActionManagerWindow() {
    return (
        <Window>
            <ActionManager />
        </Window>
    )
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = createRoot(document.getElementById('root')!)

root.render(<ActionManagerWindow />)
