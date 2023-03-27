import { userscriptFetch } from './userscript-polyfill'
import { isUserscript } from './utils'
import { ALLOWED_COUNTRY_CODES } from './geo-data' // a separate file for bypassing spell check

export interface IpLocation {
    supported: boolean
    name?: string
}

interface OpenAICDNCGITraceResponse {
    fl: string
    h: string
    ip: string
    ts: string
    visit_scheme: string
    uag: string
    colo: string
    sliver: string
    http: string
    loc: string
    tls: string
    sni: string
    warp: string
    gateway: string
    rbi: string
    kex: string
}

function parseResponse(response: string): OpenAICDNCGITraceResponse {
    const params: Record<string, string> = {}
    const pairs = response.split('\n')
    for (const pair of pairs) {
        const [key, value] = pair.split('=')
        if (key && value) {
            params[key.trim()] = value.trim()
        }
    }
    return params as unknown as OpenAICDNCGITraceResponse
}

export async function getIpLocationInfo(): Promise<IpLocation> {
    const fetch = isUserscript()
        ? (url: string, details: RequestInit) => userscriptFetch(url, details, false)
        : window.fetch

    const code = await fetch(
        'https://chat.openai.com/cdn-cgi/trace', // API endpoint of OpenAI's CDN that returns location information. No authentication needed.
        { cache: 'no-store' }
    )
        .then((response) => response.text() as string)
        .then(parseResponse)
        .then((o) => o.loc || '')
        .catch(() => '')
    return {
        supported: ALLOWED_COUNTRY_CODES.has(code),
        name: code,
    }
}
