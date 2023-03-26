import React from 'react'
import { createRoot } from 'react-dom/client'
import icon from '../content_script/assets/images/icon.png'
import { useTheme } from '../common/hooks/useTheme'
import { BaseProvider } from 'baseui-sd'

export function Thumb() {
    const { theme } = useTheme()

    return (
        <BaseProvider theme={theme}>
            <div
                className='thumb'
                style={{
                    background: theme.colors.backgroundPrimary,
                }}
            >
                <img
                    style={{
                        display: 'block',
                        width: '100%',
                        height: '100%',
                    }}
                    src={icon}
                />
            </div>
        </BaseProvider>
    )
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = createRoot(document.getElementById('root')!)

root.render(<Thumb />)
