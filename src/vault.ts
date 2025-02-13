import { useRef, useState } from 'react'
import { Image } from 'react-native'

import RNFS from 'react-native-fs'
import ImageResizer from 'react-native-image-resizer'

import { Manifest, Vault, VaultItems } from './types'
import { DocumentPickerResponse } from 'react-native-document-picker'

import { deleteMediaFiles } from './utils/media-deleter'
import { THUMBNAIL_SIZE } from './utils/constants'
import { vaultExists } from './utils/vaultFile.android'
import { getKey, readEncrypted, writeEncrypted, getUUID, getSalt } from './utils/crypto'
import {createItem, createVault} from './utils/vaultFile.android'

// File structure:
// |
// |- {vault name}
//   |- manifest.json <cipher>
//   |- {item uuid}
//     |- data.json <cipher>
//     |- thumbnail.json <cipher>
//   ...

async function saveManifest(key: string, items: VaultItems, vaultName: string) {
  const newManifest: Manifest = {}
  Object.entries(items).forEach(([uuid, item]) => {
    newManifest[uuid] = {
      itemPath: item.itemPath,
      type: item.type,
      size: item.size
    }
  })

  await writeEncrypted(key, newManifest, vaultName, 'manifest')
}

type ImportedItem = {
  type: string,
  data: string,
  thumbnail?: string,
  size: { width: number, height: number }
}

const getImgSize = (uri: string) : Promise<ImportedItem['size']> => new Promise(res => Image.getSize(uri, (width, height) => res({ width, height })))
async function importDataFromFile({ name, type, uri }: DocumentPickerResponse) : Promise<ImportedItem> {
  if (typeof type !== 'string') {
    if (name.endsWith('.png')) type = 'image/png'
    else if (name.endsWith('.jpg') || name.endsWith('.jpeg')) type = 'image/jpeg'
    else throw new Error('Unknown file type! ' + name)
  }
  if (type.startsWith('image/')) {
    const data = `data:${type};base64, ${await RNFS.readFile(uri, 'base64')}`
    const size = await getImgSize(data)
    if (type === 'image/jpeg' || type === 'image/png') {
      const { uri: thumbnailUri } = await ImageResizer.createResizedImage(data, THUMBNAIL_SIZE, THUMBNAIL_SIZE, 'JPEG', 100)
      const thumbnailData = `data:image=jpeg;base64, ${await RNFS.readFile(thumbnailUri, 'base64')}`
      await RNFS.unlink(thumbnailUri)
      return { type, data, thumbnail: thumbnailData, size }
    } else return { type, data, size }
  }
  else throw new Error('Unknown file type! ' + name + ' ' + type)
}

/**
 * Tries to open vault at given path.
 * If it exists decrypts manifest and returns encrypted items
 * if not returns a new empty vault.
 */
export async function openVault(name: string, password: string): Promise<Vault|undefined> {
  const salt = getSalt()
  const key = await getKey(password, salt)
  if (await vaultExists(name)) {
    const manifestDecrypted: Manifest = await readEncrypted(key, name, 'manifest')
    if (manifestDecrypted === undefined) return

    const items: VaultItems = {}
    Object.entries(manifestDecrypted).forEach(([uuid, item]) => {
      items[uuid] = {
        itemPath: item.itemPath,
        type: item.type,
        size: item.size,
      }
    })

    return {
      name, key, items, salt
    }
  } else {
    await createVault(name)
    await writeEncrypted(key, {}, name, 'manifest')

    return {
      name, items: {}, key, salt
    }
  }
}

type CacheItem = {
  uuid: string,
  data: string
}

/**
 * Hook that keeps track of the vault, decrypts files, encrypts and saves changes.
*/
export function useVault(initialVault: Vault = {key: '', name: '', salt: '', items: {}}, maxCached=10) {
  const { key = '', name = '' } = initialVault
  const [items, setItems] = useState(initialVault.items)
  const currentlyDecrypting: { [uuid: string]: boolean } = useRef({}).current
  const lastOpened = useRef<CacheItem[]>([]).current

  const loadThumbnail = (uuid: string) => readEncrypted(key, name, uuid, 'thumbnail')

  const importFiles = async (pickedFiles: DocumentPickerResponse[]) => {
    const newItems: VaultItems = { ...items }
    for (let res of pickedFiles) {
      const newUUID = await getUUID()
      const { data, thumbnail, ...metadata } = await importDataFromFile(res)
      newItems[newUUID] = { itemPath: res.name, ...metadata }

      await createItem(name, newUUID)
      await writeEncrypted(key, data, name, newUUID, 'data')
      if (thumbnail)
        await writeEncrypted(key, thumbnail, name, newUUID, 'thumbnail')
    }

    await deleteMediaFiles(pickedFiles.map(({ uri }) => uri))
    await saveManifest(key, newItems, name)
    setItems(newItems)
  }

  const loadItem = async (uuid: string): Promise<string|undefined> => {
    const cacheIdx = lastOpened.findIndex(item => item.uuid === uuid)
    if (cacheIdx !== -1) {
      const cacheItem = lastOpened[cacheIdx]
      lastOpened.splice(cacheIdx, 1)
      lastOpened.push(cacheItem)
      return cacheItem.data
    }

    if (currentlyDecrypting[uuid]) return

    currentlyDecrypting[uuid] = true
    const data = await readEncrypted(key, name, uuid, 'data')

    if (lastOpened.length >= maxCached) {
      lastOpened.shift()
    }
    lastOpened.push({
      uuid, data
    })

    currentlyDecrypting[uuid] = false

    return data
  }

  return {
    items, importFiles, loadItem, loadThumbnail
  }
}
