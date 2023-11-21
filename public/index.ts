import { arkoseTokenGenerator } from './js/v2/35536E1E-65B4-4D96-9D97-6ADB7EFF8147/api'

export async function getArkoseToken() {
    const token = await arkoseTokenGenerator.generate()
    if (token) {
        return token
    }
    console.log('Fail to get arkosetoken!')
}
