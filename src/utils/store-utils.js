export const isVaultOpen = ({ vaultKey, items, manifest }) => !(vaultKey === '' && Object.keys(items).length === 0 && Object.keys(manifest).length === 0)
