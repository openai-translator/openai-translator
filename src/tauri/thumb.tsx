import React from 'react'
import { createRoot } from 'react-dom/client'
import icon from '../content_script/assets/images/icon.png'
import { useTheme } from '../common/hooks/useTheme'

export function Thumb() {
    const { themeType } = useTheme()

    return (
        <div
            className='thumb'
            style={{
                background: themeType === 'dark' ? '#1f1f1f' : '#fff',
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
    )
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = createRoot(document.getElementById('root')!)

root.render(<Thumb />)
