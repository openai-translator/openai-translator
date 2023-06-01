import { Suspense } from 'react'

export function GlobalSuspense({ children }: { children: React.ReactNode }) {
    // TODO: a global loading fallback
    return <Suspense fallback={null}>{children}</Suspense>
}
