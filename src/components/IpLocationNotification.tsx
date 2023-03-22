import React, { useEffect, useState } from 'react'
import { Notification, KIND as NOTIFICATION_KIND } from 'baseui-sd/notification'
import { StyledLink } from 'baseui-sd/link'
import { IpLocation, getIpLocationInfo } from '../common/geo'

export default function IpLocationNotification() {
    const [ipLocation, setIpLocation] = useState<IpLocation | null>(null)
    useEffect(() => {
        ;(async () => {
            setIpLocation(await getIpLocationInfo())
        })()
    }, [])

    if (ipLocation === null || ipLocation.supported) return <></>

    const referenceLink = (
        <StyledLink target='_blank' href='https://platform.openai.com/docs/supported-countries'>
            supported region
        </StyledLink>
    )

    return ipLocation.name ? (
        <Notification
            kind={NOTIFICATION_KIND.negative}
            closeable
            overrides={{
                Body: { style: { width: 'auto' } },
            }}
        >
            Your IP address is from {ipLocation.name}, which is not in a {referenceLink} of OpenAI. Continuing to use
            without extra network configuration may result in your account being blocked by OpenAI, regardless of your
            GPT Plus subscription status or any remaining account balance.
        </Notification>
    ) : (
        <Notification
            kind={NOTIFICATION_KIND.warning}
            closeable
            overrides={{
                Body: { style: { width: 'auto' } },
            }}
        >
            We were unable to check if your IP address is in a {referenceLink} of OpenAI. Please ensure that you are
            accessing the API in a supported location, or your account may get banned regardless of your GPT Plus
            subscription status or any remaining account balance.
        </Notification>
    )
}
