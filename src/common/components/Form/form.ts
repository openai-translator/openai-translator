/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { ReactElement, ReactNode } from 'react'
import RcForm, { useForm as RcUseForm } from 'rc-field-form'
import { FormProps as RcFormProps } from 'rc-field-form/es/Form'
import { FieldProps as RcFieldProps } from 'rc-field-form/es/Field'
import { FieldData, FieldError, Store } from 'rc-field-form/lib/interface'
import { FormControl } from 'baseui-sd/form-control'
import { Validator, compose as composeValidator } from './validators'
import { FormItem as RcField } from './item'
import { NamePath, Paths, PathType } from './typings'
import styles from './index.module.css'

export type FormInstance<S extends {} = Store, K extends keyof S = keyof S> = {
    getFieldValue(name: K): S[K]
    getFieldValue<T extends Paths<S>>(name: T): PathType<S, T>
    getFieldsValue: (nameList?: NamePath<S>[]) => S
    getFieldError: (name: NamePath<S>) => string[]
    getFieldsError: (nameList?: NamePath<S>[]) => FieldError[]
    isFieldsTouched(nameList?: NamePath<S>[], allFieldsTouched?: boolean): boolean
    isFieldsTouched(allFieldsTouched?: boolean): boolean
    isFieldTouched: (name: NamePath<S>) => boolean
    isFieldValidating: (name: NamePath<S>) => boolean
    isFieldsValidating: (nameList: NamePath<S>[]) => boolean
    resetFields: (fields?: NamePath<S>[]) => void
    setFields: (fields: FieldData[]) => void
    setFieldsValue: (value: Partial<S>) => void
    validateFields: (nameList?: NamePath<K>[]) => Promise<S>
    submit: () => void
}

export interface FormProps<S extends {} = Store, V = S>
    extends Omit<RcFormProps, 'form' | 'onFinish' | 'onValuesChange'> {
    form?: FormInstance<S>
    initialValues?: Partial<V>
    onFinish?: (values: V) => void
    onValuesChange?: (changes: Partial<S>, values: S) => void
    transformInitialValues?: (payload: Partial<V>) => Partial<S>
    beforeSubmit?: (payload: S) => V
}

type OmittedRcFieldProps = Omit<RcFieldProps, 'name' | 'dependencies' | 'children' | 'rules'>

interface BasicFormItemProps<S extends {} = Store> extends OmittedRcFieldProps {
    name?: NamePath<S, 10>
    children?: ReactElement | ((value: S) => ReactElement)
    validators?: Array<Validator | null> | ((value: S) => Array<Validator | null>)
    label?: ReactNode
    noStyle?: boolean
    className?: string
    required?: boolean
    style?: React.CSSProperties
    caption?: ReactNode
}

type Deps<S> = Array<NamePath<S>>
type FormItemPropsDeps<S extends {} = Store> =
    | {
          deps?: Deps<S>
          children?: ReactElement
          validators?: Array<Validator | null>
      }
    | {
          deps: Deps<S>
          validators: (value: S) => Array<Validator | null>
      }
    | {
          deps: Deps<S>
          children: (value: S) => ReactElement
      }

export type FormItemProps<S extends {} = Store> = BasicFormItemProps<S> & FormItemPropsDeps<S>

export interface FormItemClassName {
    item?: string
    label?: string
    error?: string
    touched?: string
    validating?: string
    help?: string
}

type Rule = NonNullable<RcFieldProps['rules']>[number]

const getValues = (obj: any, paths: (string | number)[]) =>
    paths.reduce<any>((result, key) => result && result[key] && result[key], obj)

export function createShouldUpdate(
    names: Array<string | number | (string | number)[]> = []
): RcFieldProps['shouldUpdate'] {
    return (prev, curr) => {
        // eslint-disable-next-line no-restricted-syntax
        for (const name of names) {
            const paths = Array.isArray(name) ? name : [name]
            if (getValues(prev, paths) !== getValues(curr, paths)) {
                return true
            }
        }
        return false
    }
}

const defaultFormItemClassName: Required<FormItemClassName> = {
    item: 'rc-form-item',
    label: 'rc-form-item-label',
    error: styles.error,
    touched: 'rc-form-item-touched',
    validating: 'rc-form-item-validating',
    help: styles.help,
}

export function createForm<S extends {} = Store>({
    itemClassName,
    ...defaultProps
}: Partial<FormItemProps<S>> & { itemClassName?: FormItemClassName } = {}) {
    const ClassNames = { ...defaultFormItemClassName, ...itemClassName }

    const FormItemLabel: React.FC<{ label: string; children: ReactNode }> = ({ children, label }) =>
        React.createElement(
            'div',
            { className: ClassNames.item },
            React.createElement('label', { className: ClassNames.label }, label),
            children
        )

    const FormItem = (props_: FormItemProps<S>) => {
        const {
            name,
            children,
            validators = [],
            deps = [],
            noStyle,
            label,
            style,
            caption,
            ...props
        } = {
            ...defaultProps,
            ...props_,
        } as FormItemProps<S> & {
            deps?: Array<string | number | (string | number)[]>
            name: string | number
        }

        const rules: Rule[] =
            typeof validators === 'function'
                ? [
                      ({ getFieldsValue }) => ({
                          validator: composeValidator(validators(getFieldsValue(deps) as any)),
                      }),
                  ]
                : [{ validator: composeValidator(validators) }]

        // eslint-disable-next-line react/destructuring-assignment
        // eslint-disable-next-line react/prop-types
        if (props.required) {
            rules.push({ required: true, message: `${label} is required` })
        }

        return React.createElement(
            RcField,
            {
                name,
                rules,
                style,
                ...(deps.length ? { dependencies: deps, shouldUpdate: createShouldUpdate(deps) } : {}),
                ...props,
            },
            ((control: any, { errors }: FieldData, form: FormInstance<S>) => {
                const { getFieldsValue } = form

                const childNode =
                    typeof children === 'function'
                        ? children(getFieldsValue(deps))
                        : React.cloneElement(children as React.ReactElement, {
                              ...control,
                          })

                if (noStyle) {
                    return childNode
                }

                const error = errors && errors[0]

                const labelText = React.createElement(
                    'div',
                    {
                        style: {
                            flexShrink: 0,
                            padding: '0.25em 0',
                            fontSize: '1.2em',
                            fontWeight: '600',
                        },
                    },
                    label
                )

                // eslint-disable-next-line react/no-children-prop
                return React.createElement(
                    FormControl,
                    {
                        error,
                        // eslint-disable-next-line react/prop-types
                        label: props.required
                            ? React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 4 } }, [
                                  React.createElement('div', {}, '*'),
                                  labelText,
                              ])
                            : labelText,
                        caption,
                        children: childNode,
                    },
                    childNode
                )
            }) as any
        )
    }

    // eslint-disable-next-line react/display-name
    const Form = React.forwardRef<FormInstance<S>, FormProps<S>>(
        ({ children, onFinish, beforeSubmit, initialValues, transformInitialValues, ...props }, ref) =>
            React.createElement(
                RcForm,
                {
                    ...props,
                    ref,
                    initialValues:
                        initialValues && transformInitialValues ? transformInitialValues(initialValues) : initialValues,
                    onFinish:
                        onFinish &&
                        ((store: any) => {
                            onFinish(beforeSubmit ? beforeSubmit(store) : store)
                        }),
                } as any,
                children as any
            )
    )

    const useForm: () => [FormInstance<S>] = RcUseForm as any

    return {
        Form,
        FormItem,
        FormList: RcForm.List,
        FormProvider: RcForm.FormProvider,
        FormItemLabel,
        useForm,
    }
}
