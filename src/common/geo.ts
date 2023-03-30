import { userscriptFetch } from './userscript-polyfill'
import { isFirefox, isUserscript } from './utils'
import { ALLOWED_COUNTRY_CODES } from './geo-data' // a separate file for bypassing spell check
import { backgroundFetch } from './background-fetch'

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
    if (isFirefox) {
        return new Promise((resolve) => {
            ;(async () => {
                await backgroundFetch(traceUrl, {
                    stream: false,
                    onMessage: (data) => {
                        const parsed = parseResponse(data)
                        const code = parsed.loc || ''
                        resolve({
                            supported: ALLOWED_COUNTRY_CODES.has(code),
                            name: code,
                        })
                    },
                    onError: (err) => {
                        console.error(err.error)
                    },
                })
            })()
        })
    }

    const fetch = isUserscript()
        ? (url: string, details: RequestInit) => userscriptFetch(url, details, false)
        : window.fetch

    const code = await fetch(traceUrl, { cache: 'no-store' })
        .then((response) => response.text() as string)
        .then(parseResponse)
        .then((o) => o.loc || '')
        .catch(() => '')
    return {
        supported: ALLOWED_COUNTRY_CODES.has(code),
        name: code,
    }
}
