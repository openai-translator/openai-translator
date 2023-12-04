import * as Sentry from '@sentry/react'
import ReactGA from 'react-ga4'
import { getSettings, isDesktopApp, isUserscript } from './utils'

export async function setupAnalysis() {
    if (isUserscript()) {
        return
    }
    doSetupAnalysis()
}

let isAnalysisSetupped = false

export async function doSetupAnalysis() {
    if (isAnalysisSetupped) {
        return
    }
    isAnalysisSetupped = true
    const settings = await getSettings()
    if (settings.disableCollectingStatistics) {
        return
    }
    if (isDesktopApp()) {
        Sentry.init({
            dsn: 'https://477519542bd6491cb347ca3f55fcdce6@o441417.ingest.sentry.io/4505051776090112',
            integrations: [
                new Sentry.BrowserTracing({
                    traceFetch: false,
                }),
                new Sentry.Replay(),
            ],
            // Performance Monitoring
            tracesSampleRate: 0.5, // Capture 100% of the transactions, reduce in production!
            // Session Replay
            replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
            replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
        })
        ReactGA.initialize('G-D7054DX333')
    }
}
