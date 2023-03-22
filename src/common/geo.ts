import { userscriptFetch } from './userscript-polyfill'
import { isUserscript } from './utils'
import { ALLOWED_COUNTRY_CODES } from './geo-data' // a separate file for bypassing spell check

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

function parseResponse(response: string): Record<string, string> {
    console.log(response)
    const params: Record<string, string> = {}
    const pairs = response.split('\n')
    for (const pair of pairs) {
        const [key, value] = pair.split('=')
        if (key && value) {
            params[key.trim()] = value.trim()
        }
    }
    return params
}

export async function getIpLocationInfo(): Promise<IpLocation> {
    const fetch = isUserscript() ? userscriptFetch : window.fetch

    // GeoPlugin is accessible in China, so try this first.
    // Promise.All will take a long time to wait for timeout when OpenAI is blocked.
    const [geoPluginCode, geoPluginName] = await fetch('http://www.geoplugin.net/json.gp', { cache: 'no-store' })
        .then((response) => response.json() as GeoPluginData)
        .then((data) => [data.geoplugin_countryCode, data.geoplugin_countryName])
        .catch(() => ['', ''])
    if (geoPluginCode !== '' && !ALLOWED_COUNTRY_CODES.has(geoPluginCode))
        return { supported: false, name: geoPluginName }

    // GeoPlugin's data is less accurate. Some unsupported IP addresses can only be detected by OpenAI.
    const openAiCode = await fetch(
        'https://chat.openai.com/cdn-cgi/trace', // API endpoint of OpenAI's CDN that returns location information. No authentication needed.
        { cache: 'no-store' }
    )
        .then((response) => response.text() as string)
        .then(parseResponse)
        .then((o) => o['loc'] || '')
        .catch(() => '')
    return {
        supported: ALLOWED_COUNTRY_CODES.has(openAiCode),
        name: openAiCode,
    }
}
