/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prefer-promise-reject-errors */
/* eslint-disable no-restricted-syntax */
export type Validator = (rule: any, value: any) => Promise<void>

export const compose = (validators: Array<Validator | null>): Validator => {
    return async (rule, value) => {
        for (const validator of validators) {
            if (validator) {
                try {
                    // eslint-disable-next-line no-await-in-loop
                    await validator(rule, value)
                } catch (err) {
                    return Promise.reject(err)
                }
            }
        }
        return Promise.resolve()
    }
}

export const required =
    (msg: string): Validator =>
    (_, value) => {
        const val = typeof value === 'string' ? value.trim() : value
        // eslint-disable-next-line no-nested-ternary
        const valid = !!(Array.isArray(val)
            ? val.length
            : typeof value === 'boolean' // for checkbox
            ? value
            : !(typeof val === 'undefined' || val === null || val === ''))
        return valid ? Promise.resolve() : Promise.reject(msg)
    }

export const number: Validator = (_, value) =>
    !value || value === '-' || /^-?\d*\.?\d*$/.test(value)
        ? Promise.resolve()
        : Promise.reject('Please input number only')

export const integer =
    (msg = 'Please input integer only'): Validator =>
    (_, value) =>
        value === '' || /^(-)?\d*$/.test(value) ? Promise.resolve() : Promise.reject(msg)

export const maxDecimal =
    (max: number): Validator =>
    (_, value) =>
        value === '' || new RegExp(`^(\\d+|\\d\\.\\d{0,${max}})$`).test(value)
            ? Promise.resolve()
            : Promise.reject(`Should not more then ${max} decimal`)

const numberComparison =
    (callback: (value: number, flag: number) => boolean) =>
    (flag: number, msg: string, inclusive = false) => {
        const validator: Validator = (_, value) => {
            const num = Number(value)
            // eslint-disable-next-line no-restricted-globals
            return value === '' || isNaN(num) || callback(num, flag) || (inclusive && num === flag)
                ? Promise.resolve()
                : Promise.reject(msg)
        }
        return validator
    }

export const min = numberComparison((value, flag) => value > flag)
export const max = numberComparison((value, flag) => value < flag)

const lengthComparison = (callback: (length: number, flag: number) => boolean) => (flag: number, msg: string) => {
    const validator: Validator = (_, value) => {
        if (Array.isArray(value) || typeof value === 'string') {
            return callback(value.length, flag) ? Promise.resolve() : Promise.reject(msg)
        }
        return Promise.resolve()
    }
    return validator
}

export const minLength = lengthComparison((length, minLength_) => length >= minLength_)

export const maxLength = lengthComparison((length, maxLength_) => length <= maxLength_)

export const passwordFormat =
    (msg = 'Password must contain number and english character'): Validator =>
    (_, value) =>
        /^(?![0-9]+$)(?![a-zA-Z]+$)[0-9A-Za-z_]{6,20}$/.test(value) ? Promise.resolve() : Promise.reject(msg)

export const shouldBeEqual =
    (val: any, msg: string): Validator =>
    (_, value) =>
        value === val ? Promise.resolve() : Promise.reject(msg)

export const shouldNotBeEqual =
    (val: any, msg: string): Validator =>
    (_, value) =>
        value !== val ? Promise.resolve() : Promise.reject(msg)
