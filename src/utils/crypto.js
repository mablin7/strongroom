import { NativeModules } from 'react-native'
import { getUniqueId } from 'react-native-device-info'
const { Aes } = NativeModules

const PEPPER = '2iQ56n1oBs3agpagu7t3aqmwehZvLwKb3RYuH8xVjsYE5NJYJspgdawCmERfJg5DSnxqyDO'
const COST = 5000
const LENGTH = 256
const IVLEN = 16

export const getKey = (password, salt) => Aes.pbkdf2(password, salt+PEPPER, COST, LENGTH)

export const decrypt = async ({ cipher, iv, hmac }, key) => {
    const newHmac = await Aes.hmac256(cipher+iv, key)
    if (newHmac !== hmac) return
    const decrypted = await Aes.decrypt(cipher, key, iv)
    return decrypted
}

export const encrypt = async (data, key) => {
    const iv = await Aes.randomKey(IVLEN)
    const cipher = await Aes.encrypt(data, key, iv)
    const hmac = await Aes.hmac256(cipher+iv, key)
    return { cipher, iv, hmac }
}

export const getUUID = () => Aes.randomUuid()

export const getSalt = () => getUniqueId()
