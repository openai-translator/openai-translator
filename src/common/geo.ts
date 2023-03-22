import { userscriptFetch } from './userscript-polyfill'
import { isUserscript } from './utils'
import { ALLOWED_COUNTRY_CODES } from './geo-data'

export interface IpLocation {
    supported: boolean
    name?: string
}

interface GeoPluginData {
    geoplugin_request: string
    geoplugin_status: number
    geoplugin_delay: string
    geoplugin_credit: string
    geoplugin_city: string
    geoplugin_region: string
    geoplugin_regionCode: string
    geoplugin_regionName: string
    geoplugin_areaCode: string
    geoplugin_dmaCode: string
    geoplugin_countryCode: string
    geoplugin_countryName: string
    geoplugin_inEU: number
    geoplugin_euVATrate: number
    geoplugin_continentCode: string
    geoplugin_continentName: string
    geoplugin_latitude: string
    geoplugin_longitude: string
    geoplugin_locationAccuracyRadius: string
    geoplugin_timezone: string
    geoplugin_currencyCode: string
    geoplugin_currencySymbol: string
    geoplugin_currencySymbol_UTF8: string
    geoplugin_currencyConverter: number
}

export async function getIpLocationInfo(): Promise<IpLocation> {
    const fetch = isUserscript() ? userscriptFetch : window.fetch

    const geoPluginPromise = fetch('http://www.geoplugin.net/json.gp', { cache: 'no-store' })
        .then((response) => response.json() as GeoPluginData)
        .then((data) => [data.geoplugin_countryCode, data.geoplugin_countryName])
        .catch((_) => ['', ''])

    const openAiPromise = fetch('https://chat.openai.com/cdn-cgi/trace', { cache: 'no-store' })
        .then((response) => response.text() as string)
        .then((body) => {
            const match = body.match(/loc=(.*)/)
            if (match && match[1]) {
                return match[1]
            }
            return ''
        })
        .catch(() => '')
    // API endpoint of OpenAI's CDN that returns location information. No authentication needed.

    const [geoPluginData, openAiCode] = await Promise.all([geoPluginPromise, openAiPromise])
    const [geoPluginCode, geoPluginName] = geoPluginData
    const atLeaseOneSuccessful = openAiCode !== '' || geoPluginCode !== ''
    if (!atLeaseOneSuccessful) return { supported: false }
    const code = openAiCode || geoPluginCode
    // GeoPlugin's data is less accurate. If the two results differ, use the one from OpenAI.
    return {
        supported: ALLOWED_COUNTRY_CODES.has(code),
        name: geoPluginCode == openAiCode ? geoPluginName : openAiCode,
    }
}
