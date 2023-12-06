import { CodeBlock as BaseCodeBlock } from 'react-code-block'
import { Button } from 'baseui-sd/button'
import { themes } from 'prism-react-renderer'
import { createUseStyles } from 'react-jss'
import { useCopyToClipboard } from 'react-use'
import { useEffect, useState } from 'react'
import { useTheme } from '../hooks/useTheme'

const useStyles = createUseStyles({
    selectNone: {
        'user-select': 'none',
        '-webkit-user-select': 'none',
        '-moz-user-select': 'none',
    },
})

export interface ICodeBlockProps {
    code: string
    language: string
}

export function CodeBlock({ code, language }: ICodeBlockProps) {
    const { theme, themeType } = useTheme()
    const styles = useStyles()
    const [, copyToClipboard] = useCopyToClipboard()
    const [isCopied, setIsCopied] = useState(false)

    const copyCode = () => {
        copyToClipboard(code)
        setIsCopied(true)
    }
    useEffect(() => {
        const timeout = setTimeout(() => {
            setIsCopied(false)
        }, 2000)

        return () => clearTimeout(timeout)
    }, [isCopied])

    return (
        <BaseCodeBlock code={code} language={language} theme={themeType === 'dark' ? themes.oneDark : themes.oneLight}>
            <div
                style={{
                    position: 'relative',
                }}
            >
                <BaseCodeBlock.Code
                    style={{
                        margin: '0.2rem',
                        padding: '0.7rem',
                        paddingRight: '2rem',
                        borderRadius: '0.4rem',
                        boxShadow: theme.lighting.shadow400,
                        backgroundColor: theme.colors.backgroundSecondary,
                    }}
                >
                    <div
                        style={{
                            display: 'table-row',
                        }}
                    >
                        {language !== 'text' && (
                            <BaseCodeBlock.LineNumber
                                style={{
                                    display: 'table-cell',
                                    fontSize: '0.875rem',
                                    lineHeight: '1.25rem',
                                    textAlign: 'right',
                                    paddingRight: '1rem',
                                }}
                                className={styles.selectNone}
                            />
                        )}
                        <BaseCodeBlock.LineContent
                            style={{
                                display: 'table-cell',
                                whiteSpace: 'pre-wrap',
                            }}
                        >
                            <BaseCodeBlock.Token />
                        </BaseCodeBlock.LineContent>
                    </div>
                </BaseCodeBlock.Code>

                <Button
                    overrides={{
                        Root: {
                            style: {
                                position: 'absolute',
                                top: '0.5rem',
                                right: '0.8rem',
                            },
                        },
                    }}
                    kind='tertiary'
                    size='mini'
                    onClick={copyCode}
                >
                    <svg
                        xmlns='http://www.w3.org/2000/svg'
                        fill='none'
                        viewBox='0 0 24 24'
                        strokeWidth={2}
                        stroke='currentColor'
                        style={{
                            width: '1rem',
                            height: '1rem',
                        }}
                    >
                        {isCopied ? (
                            <path strokeLinecap='round' strokeLinejoin='round' d='M4.5 12.75l6 6 9-13.5' />
                        ) : (
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                d='M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184'
                            />
                        )}
                    </svg>
                </Button>
            </div>
        </BaseCodeBlock>
    )
}
