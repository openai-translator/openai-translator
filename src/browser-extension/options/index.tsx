import '../enable-dev-hmr'
import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Settings } from '../../common/components/Settings'
import { Client as Styletron } from 'styletron-engine-atomic'
import '../../common/i18n.js'
import './index.css'
import { createUseStyles } from 'react-jss'
import { IThemedStyleProps } from '../../common/types'
import { useTheme } from '../../common/hooks/useTheme'
import browser from 'webextension-polyfill'
import { optionsPagePromotionIDKey } from '../common'

const engine = new Styletron()

const useStyles = createUseStyles({
    root: (props: IThemedStyleProps) => ({
        display: 'flex',
        justifyContent: 'center',
        backgroundColor: props.theme.colors.backgroundSecondary,
        height: '100%',
    }),
    container: {
        maxWidth: '768px',
        height: '100%',
    },
})

const Options = () => {
    const { theme, themeType } = useTheme()
    const styles = useStyles({ theme, themeType })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).__IS_OT_BROWSER_EXTENSION_OPTIONS__ = true
    const [promotionID, setPromotionID] = useState<string | undefined>(undefined)

    useEffect(() => {
        browser.storage.local.get(optionsPagePromotionIDKey).then((resp) => {
            setPromotionID(resp[optionsPagePromotionIDKey])
            browser.storage.local.remove(optionsPagePromotionIDKey)
        })
    }, [])

    return (
        <div className={styles.root}>
            <div className={styles.container}>
                <Settings engine={engine} promotionID={promotionID} />
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
