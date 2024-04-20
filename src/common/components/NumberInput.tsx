import { Input, InputProps, Size } from 'baseui-sd/input'
import React from 'react'

export interface INumberInputProps {
    size?: Size
    value?: number
    onChange?: (value?: number) => void
    min?: number
    max?: number
    step?: number
    label?: string
    disabled?: boolean
    type?: 'int' | 'float'
    overrides?: InputProps['overrides']
    startEnhancer?: InputProps['startEnhancer']
    endEnhancer?: InputProps['endEnhancer']
}

export default function NumberInput({
    size,
    value,
    onChange,
    min,
    max,
    step,
    disabled,
    type = 'int',
    overrides,
    startEnhancer,
    endEnhancer,
}: INumberInputProps) {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (!event.target.value) {
            onChange?.(0)
            return
        }
        const value_ = type === 'float' ? parseFloat(event.target.value) : parseInt(event.target.value, 10)
        if (Number.isNaN(value_)) {
            return
        }
        onChange?.(value_)
    }

    return (
        <Input
            size={size}
            overrides={overrides}
            type='number'
            value={value}
            onChange={handleChange}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            startEnhancer={startEnhancer}
            endEnhancer={endEnhancer}
        />
    )
}
