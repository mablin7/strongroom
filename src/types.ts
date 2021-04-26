export type ManifestItem = {
  itemPath: string,
  type: string,
  size: {
    width: number,
    height: number
  },
  thumbnail?: string,
}

export type Manifest = {
  [uuid: string]: ManifestItem
}

export type VaultItem = ManifestItem & {
  data?: string
}

export type VaultItems = {
  [uuid: string]: VaultItem
}

export type Vault = {
  name: string,
  key: string,
  salt: string,
  items: VaultItems
}

export type EncryptedFile = {
  cipher: string,
  iv: string,
  hmac: string
}
