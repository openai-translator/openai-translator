import React, { useEffect, useState } from 'react'
import { Trans } from 'react-i18next'
import { Notification, KIND as NOTIFICATION_KIND } from 'baseui-sd/notification'
import { StyledLink } from 'baseui-sd/link'
import { IpLocation, getIpLocationInfo } from '../geo'
import { isUsingOpenAIOfficial } from '../utils'

export default function IpLocationNotification(props: { showSettings: boolean }) {
    const [ipLocation, setIpLocation] = useState<IpLocation | null>(null)
    useEffect(
        () => {
            ;(async () => {
                setIpLocation(
                    (await isUsingOpenAIOfficial())
                        ? await getIpLocationInfo()
                        : null /* Not directly connecting to OpenAI */
                )
            })()
        },
        [props.showSettings] // refresh on provider / API endpoint change
    )

    if (ipLocation === null || ipLocation.supported) return <></>

    const referenceLink = <StyledLink target='_blank' href='https://platform.openai.com/docs/supported-countries' />

    return ipLocation.name ? (
        <Notification
            kind={NOTIFICATION_KIND.negative}
            closeable
            overrides={{
                Body: { style: { width: 'auto' } },
            }}
        >
            <Trans
                i18nKey='Country Not Supported'
                values={{
                    name: ipLocation.name,
                }}
                components={[referenceLink]}
            />
        </Notification>
    ) : (
        <Notification
            kind={NOTIFICATION_KIND.warning}
            closeable
            overrides={{
                Body: { style: { width: 'auto' } },
            }}
        >
            <Trans i18nKey='Country Not Detected' components={[referenceLink]} />
        </Notification>
    )
}
