import { Select, SelectProps } from 'baseui-sd/select'
import { ActionOutputRenderingFormat } from '../internal-services/db'

export interface IRenderingFormatSelector extends Omit<SelectProps, 'value' | 'onChange'> {
    value?: ActionOutputRenderingFormat
    onChange?: (value: ActionOutputRenderingFormat) => void
}

export function RenderingFormatSelector({ value, onChange, ...props }: IRenderingFormatSelector) {
    const options = [
        {
            id: 'text',
            label: 'Text',
        },
        {
            id: 'markdown',
            label: 'Markdown',
        },
        {
            id: 'latex',
            label: 'LaTeX',
        },
    ] as {
        id: ActionOutputRenderingFormat
        label: React.ReactNode
    }[]

    return (
        <Select
            {...props}
            options={options}
            value={value ? [{ id: value }] : []}
            onChange={(params) => {
                if (params.value.length > 0) {
                    onChange?.(params.value[0].id as ActionOutputRenderingFormat)
                }
            }}
        />
    )
}
