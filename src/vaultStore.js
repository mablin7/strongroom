import { saveVaultFile, readVaultFile, vaultExists } from './utils/vaultFile'
import { getKey, decrypt, encrypt, getUUID, getSalt } from './utils/crypto'
import { isVaultOpen } from './utils/store-utils'

export const defaultStore = {
  vaultPath: '',
  vaultExists: undefined,
  vaultKey: '',
  manifest: {},
  items: {},
  encryptedVault: undefined,
  isVaultOpenInProgress: false,
  isDecryptInProgress: false,
  isEncryptInProgress: false
}

export const actions = store => ({
  async checkVault(state, vaultPath) {
    if(isVaultOpen(state)) return
    return { vaultExists: await vaultExists(vaultPath) }
  },

  async openVault(state, vaultPath, password) {
    if (isVaultOpen(state)) throw new Error('A vault is already open!')

    if (await vaultExists(vaultPath)) {
      store.setState({ isVaultOpenInProgress: true })
      let encryptedVault = await readVaultFile(vaultPath)
      const vaultKey = await getKey(password, encryptedVault.salt)
      let manifest = JSON.parse(await decrypt(encryptedVault.manifest, vaultKey))
      return {
        vaultPath, manifest, vaultKey, encryptedVault, items: {}, isVaultOpenInProgress: false
      }
    } else {
      const salt = getSalt()
      let encryptedVault = {
        salt, dataItems: {}, manifest: {cipher: '', iv: '', hmac: ''}
      }
      const vaultKey = await getKey(password, salt)
      return {
        vaultPath, manifest: {}, vaultKey, encryptedVault, items: {}
      }
    }
  },

  async addItemToVault(state, itemData, itemPathInVault) {
    const { vaultKey } = state
    if (vaultKey === '') throw new Error('No open vault found!')

    const uuid = await getUUID()
    const manifest = { ...state.manifest, [itemPathInVault]: { uuid } }
    const manifestEnc = await encrypt(JSON.stringify(manifest), vaultKey)
    const itemEnc = await encrypt(itemData, vaultKey)
    const encryptedVault = {
      ...state.encryptedVault,
      dataItems: { ...state.encryptedVault.dataItems, [uuid]: itemEnc },
      manifest: manifestEnc
    }

    await saveVaultFile(state.vaultPath, encryptedVault)

    return {
      manifest, items: { ...state.items, [uuid]: itemData }, encryptedVault
    }
  },

  async decryptItem(state, itemPath) {
    const { vaultKey, manifest, items, encryptedVault } = state
    if (vaultKey === '') throw new Error('No open vault found!')
    if (!(itemPath in manifest)) throw new Error('Item not found')

    const uuid = manifest[itemPath].uuid
    if (uuid in items) return state

    const itemDec = await decrypt(encryptedVault.dataItems[uuid], vaultKey)
    return {
      ...state, items: { ...items, [uuid]: itemDec }
    }
  },

  closeVault() {
    return defaultStore
  }
})
