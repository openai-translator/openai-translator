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
    try {
        const fetch = isUserscript() ? userscriptFetch : window.fetch
        const response = await fetch('http://www.geoplugin.net/json.gp', { cache: 'no-store' })
        const data = (await response.json()) as GeoPluginData
        return {
            supported: ALLOWED_COUNTRY_CODES.has(data.geoplugin_countryCode),
            name: data.geoplugin_countryName,
        }
    } catch (e) {
        return { supported: false }
    }
}
