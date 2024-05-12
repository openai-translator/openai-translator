import { useCallback, useEffect, useState } from 'react'
import NumberInput from './NumberInput'
import { Select, SelectProps } from 'baseui-sd/select'
import { useTranslation } from 'react-i18next'

type DurationUnit = 's' | 'm' | 'h'

interface IDurationPickerProps {
    size?: SelectProps['size']
    value?: string
    onChange?: (value?: string) => void
}

export function DurationPicker({ size, value, onChange }: IDurationPickerProps) {
    const [unit, setUnit] = useState<DurationUnit>()
    const [duration, setDuration] = useState<number>()

    useEffect(() => {
        if (!value) {
            setUnit('s')
            setDuration(0)
            return
        }

        const match = value.match(/(-?\d+)(s|m|h)/)
        if (!match) {
            setUnit('s')
            setDuration(0)
            return
        }

        const [, duration, unit] = match
        setDuration(parseInt(duration, 10))
        setUnit(unit as DurationUnit)
    }, [value])

    const handleDurationChange = useCallback(
        (duration?: number) => {
            if (duration === undefined) {
                onChange?.(undefined)
                return
            }
            onChange?.(`${duration}${unit}`)
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [unit]
    )

    const handleUnitChange = useCallback(
        (unit: DurationUnit | 'forever') => {
            if (unit === 'forever') {
                onChange?.('-1m')
                return
            }
            let duration_ = duration
            if (duration_ !== undefined && duration_ < 0) {
                duration_ = 1
            }
            onChange?.(`${duration_}${unit}`)
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [duration]
    )

    const [t] = useTranslation()

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
            }}
        >
            {duration !== undefined && duration >= 0 && (
                <NumberInput size={size} value={duration} onChange={handleDurationChange} />
            )}
            <Select
                clearable={false}
                creatable={false}
                searchable={false}
                size={size}
                value={duration !== undefined && duration >= 0 ? [{ id: unit }] : [{ id: 'forever' }]}
                options={[
                    { id: 's', label: t('Seconds') },
                    { id: 'm', label: t('Minutes') },
                    { id: 'h', label: t('Hours') },
                    { id: 'forever', label: t('Forever') },
                ]}
                onChange={(params) => {
                    handleUnitChange(params.value[0].id as DurationUnit | 'forever')
                }}
            />
        </div>
    )
}
