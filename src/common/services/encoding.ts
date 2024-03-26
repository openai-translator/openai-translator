export function string2Uint8Array(str: string): Uint8Array {
  const encoder = new TextEncoder()
  return encoder.encode(str)
}

export function uint8Array2String(uint8Array: Uint8Array): string {
  const decoder = new TextDecoder()
  return decoder.decode(uint8Array)
}
