import React, { useEffect, useState } from 'react'
import { useBackHandler, useAppState } from '@react-native-community/hooks'

import SlideTransition from './components/SlideTransition'

import Unlock from './screens/Unlock'
import Vault from './screens/Vault'
import {DEFAULT_VAULT} from './utils/constants'

export default () => {   
  const [vault, setVault] = useState(undefined)
  const [shouldLockOnBg, setShouldLockOnBg] = useState(true)

  useEffect(() => {
    if(!shouldLockOnBg) setTimeout(() => setShouldLockOnBg(true), 3*60*1000)
  }, [shouldLockOnBg])

  const appState = useAppState()
  if (vault !== undefined && shouldLockOnBg && appState !== 'active') {
    setVault(undefined)
  }

  useBackHandler(() => {
    if (vault !== undefined) {
      setVault(undefined)
      return true
    } else return false
  })

  return (
    <SlideTransition goTo={vault === undefined ? 0 : 1} >
      <Unlock vaultPath={DEFAULT_VAULT} onVaultOpen={setVault}/>
      <Vault initialVault={vault} setShouldLockOnBg={setShouldLockOnBg}/>
    </SlideTransition>
  )
}

