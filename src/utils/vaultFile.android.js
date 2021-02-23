import RNFS from 'react-native-fs'

const VAULTSDIR = RNFS.DocumentDirectoryPath + '/vaults/'

export async function readVaultFile(filename) {
  const path = VAULTSDIR + filename
  const fileCont = await RNFS.readFile(path)

  return JSON.parse(fileCont)
}

export async function saveVaultFile(filename, encryptedVault) {
  if (! await RNFS.exists(VAULTSDIR)) {
    await RNFS.mkdir(VAULTSDIR)
  }

  const path = VAULTSDIR + filename
  await RNFS.writeFile(path, JSON.stringify(encryptedVault))
}

export function vaultExists(filename) {
  return RNFS.exists(VAULTSDIR + filename)
}
