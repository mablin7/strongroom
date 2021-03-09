import React, { useState } from 'react'
import { UIManager, LayoutAnimation } from 'react-native'

import Unlock from './screens/Unlock'
import Vault from './screens/Vault'
import {DEFAULT_VAULT} from './utils/constants'

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

export default () => {   
  const [vault, setVault] = useState(undefined)
  const onVaultOpen = newVault => {
    if (vault !== newVault) LayoutAnimation.configureNext(LayoutAnimation.Presets.linear)
    setVault(newVault)
  }

  return (
    vault === undefined ? <Unlock vaultPath={DEFAULT_VAULT} onVaultOpen={onVaultOpen}/> : <Vault initialVault={vault}/>
  )
}

