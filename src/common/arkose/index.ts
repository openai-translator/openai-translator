import { arkoseTokenGenerator } from './generator'

export async function getArkoseToken() {
    const token = await arkoseTokenGenerator.generate()
    console.log(token)
    console.log('1')

    if (token) {
        console.log(token)
        return token
    }
    console.log('失败！')
}
