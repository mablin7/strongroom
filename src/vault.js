import { useRef, useState } from 'react'

import RNFS from 'react-native-fs'
import ImageResizer from 'react-native-image-resizer'

import { deleteMediaFiles } from './utils/media-deleter'
import { THUMBNAIL_SIZE } from './utils/constants'
import { readVaultFile, saveVaultFile, vaultExists } from './utils/vaultFile'
import { getKey, decrypt, encrypt, getUUID, getSalt } from './utils/crypto'

// Vault type:
// vault: {
//   path: "",
//   key: "",
//   items: { [uuid]: { data: "", itemPath: "", ...metadata } },
//   encrypted: {
//     salt: "",
//     dataItems: { [uuid]: {cipher, iv, hmac} },
//     manifest: {cipher, iv, hmac} /* { [uuid]: { itemPath: "", ...metadata }  } */
//   }
// }

async function importDataFromFile({ name, type, uri }) {
  if (typeof type !== 'string') {
    if (name.endsWith('.png')) type = 'image/png'
    else if (name.endsWith('.jpg') || name.endsWith('.jpeg')) type = 'image/jpeg'
    else throw new Error('Unknown file type! ' + name)
  }
  if (type.startsWith('image/')) {
    const data = `data:${type};base64, ${await RNFS.readFile(uri, 'base64')}`
    const { uri: thumbnailUri } = await ImageResizer.createResizedImage(data, THUMBNAIL_SIZE, THUMBNAIL_SIZE, 'JPEG', 100)
    const thumbnailData = `data:image=jpeg;base64, ${await RNFS.readFile(thumbnailUri, 'base64')}`
    await RNFS.unlink(thumbnailUri)
    return { type, data, thumbnail: thumbnailData }
  }
  else throw new Error('Unknown file type! ' + name + ' ' + type)
}

/**
 * Tries to open vault at given path.
 * If it exists decrypts manifest and returns encrypted items
 * if not returns a new empty vault.
 */
export async function openVault(vaultPath, password) {
    if (await vaultExists(vaultPath)) {
      const encrypted = await readVaultFile(vaultPath)
      const vaultKey = await getKey(password, encrypted.salt)
      const manifestDecrypted = await decrypt(encrypted.manifest, vaultKey)
      if (manifestDecrypted === undefined) return

      const items = JSON.parse(manifestDecrypted)
      return {
        path: vaultPath,
        key: vaultKey,
        items, encrypted
      }
    } else {
      const salt = getSalt()
      const vaultKey = await getKey(password, salt)
      const encrypted = {
        salt, dataItems: {}, manifest: {cipher: '', iv: '', hmac: ''}
      }

      return {
        path: vaultPath,
        key: vaultKey,
        items: {},
        encrypted
      }
    }
}

/**
 * Hook that keeps track of the vault, decrypts files, encrypts and saves changes.
*/
export function useVault(initialVault) {
  const { key, path } = initialVault
  const [items, setItems] = useState(initialVault.items)
  const encrypted = useRef(initialVault.encrypted).current

  const currentlyDecrypting = useRef({}).current
  useEffect(() => {
    Object.keys(items).forEach(uuid => currentlyDecrypting[uuid] = false)
  }, [])

  const importFiles = async pickedFiles => {
    const newItems = { ...items }
    const newEncryptedItems = { ...encrypted.items }
    for (let res of pickedFiles) {
      const newUUID = await getUUID()
      const { data, ...metadata } = await importDataFromFile(res)
      newItems[newUUID] = { data, itemPath: res.name, ...metadata }

      const encryptedItemData = await encrypt(data, key)
      newEncryptedItems[newUUID] = encryptedItemData
    }

    const newManifest = {}
    Object.entries(newItems)
      .forEach(([uuid, { itemPath, data, ...itemMetadata }]) => {
        newManifest[uuid] = { itemPath, ...itemMetadata }
      })

    const newEncryptedManifest = await encrypt(JSON.stringify(newManifest), key)
    encrypted.dataItems = newEncryptedItems
    encrypted.manifest = newEncryptedManifest

    await saveVaultFile(path, encrypted)
    await deleteMediaFiles(pickedFiles.map(({ uri }) => uri))
    setItems(newItems)
  }

  const decryptItem = async uuid => {
    const { data } = items[uuid]
    if (data !== undefined || currentlyDecrypting[uuid]) return

    currentlyDecrypting[uuid] = true
    const decryptedItem = await decrypt(encrypted.dataItems[uuid], key)
    const newItems = { ...items, [uuid]: { ...items[uuid], data: decryptedItem } }
    setItems(newItems)
    currentlyDecrypting[uuid] = false
  }

  return {
    items, importFiles, decryptItem
  }
}
