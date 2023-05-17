import { ALLOWED_COUNTRY_CODES } from './geo-data' // a separate file for bypassing spell check
import { getUniversalFetch } from './universal-fetch'

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

const traceUrl = 'https://chat.openai.com/cdn-cgi/trace' // API endpoint of OpenAI's CDN that returns location information. No authentication needed.

export async function getIpLocationInfo(): Promise<IpLocation> {
    const fetch = getUniversalFetch()

    const code = await fetch(traceUrl, { cache: 'no-store' })
        .then((response) => response.text())
        .then(parseResponse)
        .then((o) => o.loc || '')
        .catch(() => '')
    return {
        supported: ALLOWED_COUNTRY_CODES.has(code),
        name: code,
    }
}
