import '../enable-dev-hmr'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { Settings } from '../../common/components/Settings'
import { Client as Styletron } from 'styletron-engine-atomic'
import '../../common/i18n.js'
import './index.css'
import { createUseStyles } from 'react-jss'
import { IThemedStyleProps } from '../../common/types'
import { useTheme } from '../../common/hooks/useTheme'

const engine = new Styletron()

const useStyles = createUseStyles({
    root: (props: IThemedStyleProps) => ({
        display: 'flex',
        justifyContent: 'center',
        backgroundColor: props.theme.colors.backgroundSecondary,
    }),
    container: {
        maxWidth: '768px',
    },
})

const Options = () => {
    const { theme, themeType } = useTheme()
    const styles = useStyles({ theme, themeType })

    return (
        <div className={styles.root}>
            <div className={styles.container}>
                <Settings engine={engine} />
            </div>
        </div>
    )
}

const root = createRoot(document.getElementById('root') as HTMLElement)

root.render(
    <React.StrictMode>
        <Options />
    </React.StrictMode>
)
