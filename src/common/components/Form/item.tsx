import React from 'react'
import { FieldProps } from 'rc-field-form/lib/Field'
import { Field } from 'rc-field-form'
import styles from './index.module.css'

export interface IFormItemProps extends FieldProps {
    label?: React.ReactNode
    required?: boolean
    style?: React.CSSProperties
}

export const FormItem = ({ label: label_, required, style, children, ...restProps }: IFormItemProps) => {
    let label = label_
    if (required) {
        label = <span>{label} *</span>
    }
    return (
        <div className={styles.formItem} style={style}>
            <Field {...restProps}>
                {(control, meta, form) => {
                    const childNode =
                        typeof children === 'function'
                            ? children(control, meta, form)
                            : React.cloneElement(children as React.ReactElement, {
                                  label,
                                  errorMessage: meta.errors.join(';'),
                                  ...control,
                              })
                    return <>{childNode}</>
                }}
            </Field>
        </div>
    )
}
