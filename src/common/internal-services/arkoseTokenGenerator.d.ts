/* eslint-disable @typescript-eslint/no-explicit-any */
export const arkoseTokenGenerator: ArkoseTokenGenerator
declare class ArkoseTokenGenerator {
    enforcement: {
        setConfig: (arg0: {
            onCompleted: (r: any) => void
            onReady: () => void
            onError: (r: any) => void
            onFailed: (r: any) => void
        }) => void
    }
    /**
     * @type {{ resolve: (value: any) => void; reject: (reason?: any) => void; }[]}
     */
    pendingPromises: {
        resolve: (value: any) => void
        reject: (reason?: any) => void
    }[]
    scriptLoaded: boolean
    /**
     * @param {{ setConfig: (arg0: { onCompleted: (r: any) => void; onReady: () => void; onError: (r: any) => void; onFailed: (r: any) => void; }) => void; }} enforcement
     */
    useArkoseSetupEnforcement(enforcement: {
        setConfig: (arg0: {
            onCompleted: (r: any) => void
            onReady: () => void
            onError: (r: any) => void
            onFailed: (r: any) => void
        }) => void
    }): void
    injectScript(): Promise<void>
    /**
     * @param {{ (): void; (): void; }} callback
     */
    ensureScriptLoaded(callback: { (): void; (): void }): void
    generate(): Promise<any>
}
export {}
