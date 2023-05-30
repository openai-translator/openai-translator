import { IconType } from 'react-icons'
import * as mdIcons from 'react-icons/md'
import { createUseStyles } from 'react-jss'
import { Button } from 'baseui-sd/button'
import { useEffect, useState, createElement, useMemo } from 'react'
import { VariableSizeGrid as Grid } from 'react-window'
import { Input } from 'baseui-sd/input'
import { useTranslation } from 'react-i18next'

const useStyles = createUseStyles({
    root: {},
    icons: {
        padding: '20px 5px',
    },
    iconSearchBar: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '10px',
    },
    iconItem: {
        display: 'inline-flex',
    },
})

export interface IIconPickerProps {
    value?: string
    onChange?: (value: string) => void
}

export function IconPicker({ value, onChange }: IIconPickerProps) {
    const { t } = useTranslation()
    const [showIcons, setShowIcons] = useState(false)
    const [currentValue, setCurrentValue] = useState(value ?? 'MdMusicVideo')

    useEffect(() => {
        if (value) {
            setCurrentValue(value)
        }
    }, [value])

    useEffect(() => {
        onChange?.(currentValue)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentValue])

    const [searchInputText, setSearchInputText] = useState('')

    const [searchText, setSearchText] = useState('')

    const iconNames = useMemo(() => {
        const names = Object.keys(mdIcons)
        if (searchText) {
            return names.filter((name) => name.toLowerCase().includes(searchText.toLowerCase()))
        }
        return names
    }, [searchText])

    const styles = useStyles()

    return (
        <div className={styles.root}>
            <Button
                size='mini'
                kind='primary'
                onClick={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                    setShowIcons((v) => !v)
                }}
            >
                {createElement((mdIcons as Record<string, IconType>)[currentValue] as IconType, { size: 16 })}
            </Button>
            {showIcons && (
                <div className={styles.icons}>
                    <div className={styles.iconSearchBar}>
                        <Input
                            overrides={{
                                Root: {
                                    style: {
                                        width: '200px',
                                    },
                                },
                            }}
                            value={searchInputText}
                            onChange={(e) => {
                                setSearchInputText(e.currentTarget.value)
                            }}
                            onKeyPress={(e) => {
                                e.stopPropagation()
                                if (e.key === 'Enter') {
                                    setSearchText(searchInputText)
                                    e.preventDefault()
                                }
                            }}
                            placeholder='Search Icon'
                            size='mini'
                        />
                        <Button
                            size='mini'
                            kind='secondary'
                            onClick={(e) => {
                                e.stopPropagation()
                                e.preventDefault()
                                setSearchText(searchInputText)
                            }}
                        >
                            {t('Search')}
                        </Button>
                    </div>
                    <Grid
                        height={250}
                        width={400}
                        rowHeight={() => 40}
                        columnWidth={() => 40}
                        rowCount={Math.round(iconNames.length / 10)}
                        columnCount={10}
                    >
                        {({ columnIndex, rowIndex, style }) => {
                            const key = iconNames[rowIndex * 10 + columnIndex]
                            if (!key) {
                                return null
                            }
                            const Icon = (mdIcons as Record<string, IconType>)[key] as IconType
                            return (
                                <div key={key} style={style}>
                                    <Button
                                        kind={currentValue === key ? 'primary' : 'secondary'}
                                        size='mini'
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            e.preventDefault()
                                            setCurrentValue(key)
                                            setShowIcons(false)
                                        }}
                                    >
                                        <Icon size={16} />
                                    </Button>
                                </div>
                            )
                        }}
                    </Grid>
                </div>
            )}
        </div>
    )
}
