import { useEffect, useRef, useState } from 'react'
import { Image } from 'react-native'

import RNFS from 'react-native-fs'
import ImageResizer from 'react-native-image-resizer'

import { deleteMediaFiles } from './utils/media-deleter'
import { THUMBNAIL_SIZE } from './utils/constants'
import { vaultExists } from './utils/vaultFile'
import { getKey, readEncrypted, writeEncrypted, getUUID, getSalt } from './utils/crypto'
import {createItem, createVault} from './utils/vaultFile.android'

// Vault type:
// vault: {
//   path: "",
//   key: "",
//   items: {
//    [uuid]: {
//      data: "",
//      itemPath: "",
//      type: "",
//      size: {},
//      metadata: {
//        [field]: ""
//      }
//    }
//   },
//   salt: ""
// }
//
// File structure:
// |
// |- {vault name}
//   |- manifest.json <cipher>
//   |- {item uuid}
//     |- data.json <cipher>
//     |- thumbnail.json <cipher>
//   ...
//
// manifest.json <plaintext>
// {
//  "{uuid}": {
//    "itemPath": "{itemPath}",
//    "type": "",
//    "size": {width, height},
//    "metadata": ["{fieldName}"]
//  }
// }
//
// <cipher> json file
// {
//  "cipher": "",
//  "iv": "",
//  "hmac": ""
// }

async function saveManifest(key, items, vaultName) {
  const newManifest = {}
  Object.entries(items).forEach(([uuid, item]) => {
    newManifest[uuid] = {
      itemPath: item.itemPath,
      type: item.type,
      size: item.size,
      metadata: Object.keys(item.metadata)
    }
  })

  await writeEncrypted(key, newManifest, vaultName, 'manifest')
}

const getImgSize = uri => new Promise(res => Image.getSize(uri, (width, height) => res({ width, height })))
async function importDataFromFile({ name, type, uri }) {
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
export async function openVault(vaultName, password) {
  const salt = getSalt()
  const key = await getKey(password, salt)
  if (await vaultExists(vaultName)) {
    const manifestDecrypted = await readEncrypted(key, vaultName, 'manifest')
    if (manifestDecrypted === undefined) return

    const items = {}
    Object.entries(manifestDecrypted).forEach(([uuid, item]) => {
      const metadata = {}
      item.metadata.forEach(field => metadata[field] = '')
      items[uuid] = {
        itemPath: item.itemPath,
        type: item.type,
        size: item.size,
        metadata 
      }
    })

    return {
      path: vaultName,
      key, items, salt
    }
  } else {
    await createVault(vaultName)
    await writeEncrypted(key, {}, vaultName, 'manifest')

    return {
      path: vaultName,
      items: {}, key, salt
    }
  }
}

/**
 * Hook that keeps track of the vault, decrypts files, encrypts and saves changes.
*/
export function useVault(initialVault={}, maxCached=10) {
  const { key, path } = initialVault
  const [items, setItems] = useState(initialVault.items)
  const lastOpened = useRef([]).current
  const currentlyDecrypting = useRef({}).current

  useEffect(() => {
    (async function() {
      let didChange = false
      let newItems = { ...items }

      for (let uuid in items) {
        const item = items[uuid]
        for (let field in item.metadata) {
          const val = item.metadata[field]
          if (val === '' || val === undefined) {
            didChange = true
            newItems[uuid].metadata[field] = await readEncrypted(key, path, uuid, field)
          }
        }

        if (!(uuid in currentlyDecrypting)) {
          currentlyDecrypting[uuid] = false
        }
      }

      if (didChange) setItems(newItems)
    })()
  }, [items])

  const importFiles = async pickedFiles => {
    const newItems = { ...items }
    for (let res of pickedFiles) {
      const newUUID = await getUUID()
      const { data, type, size, ...metadata } = await importDataFromFile(res)
      newItems[newUUID] = { itemPath: res.name, type, size, metadata }

      await createItem(path, newUUID)
      await writeEncrypted(key, data, path, newUUID, 'data')
      
      for (let field in metadata) {
        const md = metadata[field]
        await writeEncrypted(key, md, path, newUUID, field)
      }
    }

    await deleteMediaFiles(pickedFiles.map(({ uri }) => uri))
    await saveManifest(key, newItems, path)
    setItems(newItems)
  }

  const decryptItem = async uuid => {
    if (lastOpened.includes(uuid)) {
      lastOpened.splice(lastOpened.indexOf(uuid), 1)
    }
    lastOpened.push(uuid)

    const { data } = items[uuid]
    if (data !== undefined || currentlyDecrypting[uuid]) return

    currentlyDecrypting[uuid] = true
    const decryptedData = await readEncrypted(key, path, uuid, 'data')
    const newItems = { ...items, [uuid]: { ...items[uuid], data: decryptedData } }

    if (lastOpened.length === maxCached) {
      const toPop = lastOpened.shift()
      delete newItems[toPop].data
    }

    setItems(newItems)
    currentlyDecrypting[uuid] = false
  }

  return {
    items, importFiles, decryptItem
  }
}
