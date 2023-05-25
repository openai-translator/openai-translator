import { Translator } from '../../common/components/Translator'
import { Client as Styletron } from 'styletron-engine-atomic'
import { PREFIX } from '../../common/constants'

const engine = new Styletron({
    prefix: `${PREFIX}-styletron-`,
})

export function App() {
    const isWindows = navigator.userAgent.indexOf('Windows') !== -1

    return (
        <div
            style={{
                font: '14px/1.6 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji',
                height: '100%',
            }}
        >
            <div className='draggable' />
            <Translator
                text=''
                engine={engine}
                showSettings
                autoFocus
                defaultShowSettings
                containerStyle={{
                    paddingTop: isWindows ? '30px' : '20px',
                }}
            />
        </div>
    )
}
