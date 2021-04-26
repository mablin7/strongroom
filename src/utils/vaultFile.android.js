import RNFS from 'react-native-fs'

const VAULTSDIR = RNFS.DocumentDirectoryPath + '/vaults/'

async function ensureVaultsDir() {
  if (!await RNFS.exists(VAULTSDIR)) {
    await RNFS.mkdir(VAULTSDIR)
  }
}

export async function readFile(...pathParts) {
  const path = VAULTSDIR + pathParts.join('/') + '.json'
  const contents = await RNFS.readFile(path)
  return JSON.parse(contents)
}

export async function writeFile(contents, ...pathParts) {
  const path = VAULTSDIR + pathParts.join('/') + '.json'
  await RNFS.writeFile(path, JSON.stringify(contents))
}

export async function createVault(vaultName) {
  ensureVaultsDir()

  const path = VAULTSDIR + vaultName
  if (!await RNFS.exists(path)) {
    await RNFS.mkdir(path)
  }
}

export async function createItem(vaultName, itemUUID) {
  const path = VAULTSDIR + vaultName + '/' + itemUUID
  if (!await RNFS.exists(path)) {
    await RNFS.mkdir(path)
  }
}

export function vaultExists(vaultName) {
  return RNFS.exists(VAULTSDIR + vaultName + '/manifest.json')
}

// export async function readVaultFile(filename) {
//   const path = VAULTSDIR + filename
//   const fileCont = await RNFS.readFile(path)

//   return JSON.parse(fileCont)
// }

// export async function saveVaultFile(filename, encryptedVault) {
//   if (! await RNFS.exists(VAULTSDIR)) {
//     await RNFS.mkdir(VAULTSDIR)
//   }

//   const path = VAULTSDIR + filename
//   await RNFS.writeFile(path, JSON.stringify(encryptedVault))
// }

// export function vaultExists(filename) {
//   return RNFS.exists(VAULTSDIR + filename)
// }
