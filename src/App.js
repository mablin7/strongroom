import React, { useState } from 'react'
import { useBackHandler } from '@react-native-community/hooks'

import SlideTransition from './components/SlideTransition'

import Unlock from './screens/Unlock'
import Vault from './screens/Vault'
import {DEFAULT_VAULT} from './utils/constants'

export default () => {   
  const [vault, setVault] = useState(undefined)
  useBackHandler(() => {
    if (vault !== undefined) {
      setVault(undefined)
      return true
    } else return false
  })

  return (
    <SlideTransition goTo={vault === undefined ? 0 : 1} >
      <Unlock vaultPath={DEFAULT_VAULT} onVaultOpen={setVault}/>
      <Vault initialVault={vault}/>
    </SlideTransition>
  )
}

