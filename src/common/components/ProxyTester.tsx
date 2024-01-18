import { useTranslation } from 'react-i18next'
import { ISettings } from '../types'
import { Button } from 'baseui-sd/button'
import { Notification } from 'baseui-sd/notification'
import { useState } from 'react'
import { fetch } from '@tauri-apps/plugin-http'
import ReactCountryFlag from 'react-country-flag'
import { getFetchProxy } from '../polyfills/tauri'
import { BsRocketTakeoff } from 'react-icons/bs'
import { SpinnerIcon } from './SpinnerIcon'

interface IProxyTesterProps {
    proxy?: ISettings['proxy']
}

export function ProxyTester(props: IProxyTesterProps) {
    const [t] = useTranslation()
    const [isTesting, setIsTesting] = useState(false)
    const [isSuccess, setIsSuccess] = useState<boolean>()
    const [error, setError] = useState<string>()
    const [testResult, setTestResult] = useState<{
        ip: string
        country: string
        countryCode: string
        city: string
        org: string
        timeConsumed: number
    }>()

    const testProxy = async () => {
        setIsTesting(true)
        try {
            setError(undefined)
            const start = Date.now()
            const fetchProxy = getFetchProxy(props.proxy, true)
            const resp = await fetch('https://api.ip.sb/geoip', {
                proxy: fetchProxy,
                connectTimeout: 10000,
            })
            const jsn = await resp.json()
            const end = Date.now()
            setIsSuccess(true)
            setTestResult({
                ip: jsn.ip,
                country: jsn.country,
                countryCode: jsn.country_code,
                city: jsn.city,
                org: jsn.asn_organization,
                timeConsumed: end - start,
            })
        } catch (e) {
            setError(String(e))
            setIsSuccess(false)
            setTestResult(undefined)
        } finally {
            setIsTesting(false)
        }
    }

    const notificationOverrides = {
        Body: {
            style: {
                width: '100%',
                boxSizing: 'border-box',
                margin: '10px 0',
            },
        },
    }

    return (
        <div
            style={{
                padding: '10px 0',
            }}
        >
            <div>
                {!isTesting &&
                    isSuccess !== undefined &&
                    (isSuccess ? (
                        <Notification kind='positive' overrides={notificationOverrides}>
                            <div>{t('Your proxy is working fine')}</div>
                            {testResult && (
                                <div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                    }}
                                >
                                    <div>IP: {testResult.ip}</div>
                                    <div>
                                        {t('Location')}:{' '}
                                        {
                                            <ReactCountryFlag
                                                style={{
                                                    verticalAlign: 'default',
                                                }}
                                                countryCode={testResult.countryCode}
                                            />
                                        }{' '}
                                        {testResult.country} {testResult.city} {testResult.org}
                                    </div>
                                    <div>
                                        {t('Time consumed')}: {testResult.timeConsumed}ms
                                    </div>
                                </div>
                            )}
                        </Notification>
                    ) : (
                        <Notification kind='negative' overrides={notificationOverrides}>
                            <div>{t('Your proxy is not working')}</div>
                            {error && <div>{error}</div>}
                        </Notification>
                    ))}
            </div>
            <div>
                <Button
                    size='compact'
                    onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        if (isTesting) {
                            return
                        }
                        testProxy()
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                        }}
                    >
                        {isTesting ? <SpinnerIcon size={12} /> : <BsRocketTakeoff size={12} />}
                        {t('Test')}
                    </div>
                </Button>
            </div>
        </div>
    )
}
