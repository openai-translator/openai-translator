import { ofetch } from 'ofetch'

export async function fetchArkoseToken(): Promise<string | undefined> {
  try {
    const resp = await ofetch('https://chathub.gg/api/arkose')
    return resp.token
  } catch (err) {
    console.error(err)
    return undefined
  }
}
