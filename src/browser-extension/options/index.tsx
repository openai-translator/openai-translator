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
import { optionsPageHeaderPromotionIDKey, optionsPageOpenaiAPIKeyPromotionIDKey } from '../common'

const engine = new Styletron()

const useStyles = createUseStyles({
    root: (props: IThemedStyleProps) => ({
        display: 'flex',
        justifyContent: 'center',
        backgroundColor: props.theme.colors.backgroundSecondary,
        minHeight: '100%',
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
    const [openaiAPIKeyPromotionID, setOpenaiAPIKeyPromotionID] = useState<string>()
    const [headerPromotionID, setHeaderPromotionID] = useState<string>()

    useEffect(() => {
        browser.storage.local.get(optionsPageOpenaiAPIKeyPromotionIDKey).then((resp) => {
            setOpenaiAPIKeyPromotionID(resp[optionsPageOpenaiAPIKeyPromotionIDKey])
            browser.storage.local.remove(optionsPageOpenaiAPIKeyPromotionIDKey)
        })
    }, [])

    useEffect(() => {
        browser.storage.local.get(optionsPageHeaderPromotionIDKey).then((resp) => {
            setHeaderPromotionID(resp[optionsPageHeaderPromotionIDKey])
            browser.storage.local.remove(optionsPageHeaderPromotionIDKey)
        })
    }, [])

    return (
        <div className={styles.root}>
            <div className={styles.container}>
                <Settings
                    engine={engine}
                    openaiAPIKeyPromotionID={openaiAPIKeyPromotionID}
                    headerPromotionID={headerPromotionID}
                />
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
