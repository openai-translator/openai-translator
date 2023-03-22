import { userscriptFetch } from './userscript-polyfill'
import { isUserscript } from './utils'

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

const ALLOWED_COUNTRY_CODES = new Set([
    'AL',
    'DZ',
    'AD',
    'AO',
    'AG',
    'AR',
    'AM',
    'AU',
    'AT',
    'AZ',
    'BS',
    'BD',
    'BB',
    'BE',
    'BZ',
    'BJ',
    'BT',
    'BO',
    'BA',
    'BW',
    'BR',
    'BN',
    'BG',
    'BF',
    'CV',
    'CA',
    'CL',
    'CO',
    'KM',
    'CG',
    'CR',
    'CI',
    'HR',
    'CY',
    'CZ',
    'DK',
    'DJ',
    'DM',
    'DO',
    'EC',
    'SV',
    'EE',
    'FJ',
    'FI',
    'FR',
    'GA',
    'GM',
    'GE',
    'DE',
    'GH',
    'GR',
    'GD',
    'GT',
    'GN',
    'GW',
    'GY',
    'HT',
    'VA',
    'HN',
    'HU',
    'IS',
    'IN',
    'ID',
    'IQ',
    'IE',
    'IL',
    'IT',
    'JM',
    'JP',
    'JO',
    'KZ',
    'KE',
    'KI',
    'KW',
    'KG',
    'LV',
    'LB',
    'LS',
    'LR',
    'LI',
    'LT',
    'LU',
    'MG',
    'MW',
    'MY',
    'MV',
    'ML',
    'MT',
    'MH',
    'MR',
    'MU',
    'MX',
    'FM',
    'MD',
    'MC',
    'MN',
    'ME',
    'MA',
    'MZ',
    'MM',
    'NA',
    'NR',
    'NP',
    'NL',
    'NZ',
    'NI',
    'NE',
    'NG',
    'MK',
    'NO',
    'OM',
    'PK',
    'PW',
    'PS',
    'PA',
    'PG',
    'PE',
    'PH',
    'PL',
    'PT',
    'QA',
    'RO',
    'RW',
    'KN',
    'LC',
    'VC',
    'WS',
    'SM',
    'ST',
    'SN',
    'RS',
    'SC',
    'SL',
    'SG',
    'SK',
    'SI',
    'SB',
    'ZA',
    'KR',
    'ES',
    'LK',
    'SR',
    'SE',
    'CH',
    'TW',
    'TZ',
    'TH',
    'TL',
    'TG',
    'TO',
    'TT',
    'TN',
    'TR',
    'TV',
    'UG',
    'UA',
    'AE',
    'GB',
    'US',
    'UY',
    'VU',
    'ZM',
])

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
