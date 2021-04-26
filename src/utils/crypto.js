import { NativeModules } from 'react-native'
import { getUniqueId } from 'react-native-device-info'
const { Aes } = NativeModules

import { readFile, writeFile } from './vaultFile'

const PEPPER = '2iQ56n1oBs3agpagu7t3aqmwehZvLwKb3RYuH8xVjsYE5NJYJspgdawCmERfJg5DSnxqyDO'
const COST = 5000
const LENGTH = 256
const IVLEN = 16

export const getKey = (password, salt) => Aes.pbkdf2(password, salt+PEPPER, COST, LENGTH)

async function decrypt({ cipher, iv, hmac }, key) {
    const newHmac = await Aes.hmac256(cipher+iv, key)
    if (newHmac !== hmac) return
    const decrypted = await Aes.decrypt(cipher, key, iv)
    return decrypted
}

async function encrypt(data, key) {
    const iv = await Aes.randomKey(IVLEN)
    const cipher = await Aes.encrypt(data, key, iv)
    const hmac = await Aes.hmac256(cipher+iv, key)
    return { cipher, iv, hmac }
}

export async function readEncrypted(key, ...pathParts) {
    const encryptedContents = await readFile(...pathParts)
    const decrypted = await decrypt(encryptedContents, key)

    if (decrypted === undefined) return undefined
    else if(decrypted.startsWith('{')) return JSON.parse(decrypted)
    else return decrypted
}

export async function writeEncrypted(key, contents, ...pathParts) {
    if (typeof contents !== 'string') contents = JSON.stringify(contents)
    const encryptedContents = await encrypt(contents, key)
    await writeFile(encryptedContents, ...pathParts)
}

export const getUUID = () => Aes.randomUuid()

export const getSalt = () => getUniqueId()
