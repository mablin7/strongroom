import React, { useEffect, useState } from 'react'
import { Alert, PermissionsAndroid, Platform } from 'react-native'
import { useBackHandler, useAppState } from '@react-native-community/hooks'

import SlideTransition from './components/SlideTransition'

import UnlockScreen from './screens/Unlock'
import VaultScreen from './screens/Vault'
import {DEFAULT_VAULT} from './utils/constants'

import {Vault} from './types'

async function hasAndroidPermission() {
  const permissions = [
    PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
    PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
  ]

  let allGranted = true
  for (let permission of permissions) {
    const hasPermission = await PermissionsAndroid.check(permission);
    if (!hasPermission) {
      const status = await PermissionsAndroid.request(permission);
      allGranted = status === 'granted'
    }
  }
  return allGranted
}

export default () => {   
  const [vault, setVault] = useState<Vault | undefined>(undefined)
  const [shouldLockOnBg, setShouldLockOnBg] = useState(true)

  useEffect(() => {
    if (Platform.OS === 'android' && Platform.Version < 30)
      hasAndroidPermission()
        .then(granted => {
          if (!granted)
            Alert.alert('Without permission, we won\'t be able to remove your unprotected sensitive information from the system!')
        })
  }, [])

  useEffect(() => {
    // if(!shouldLockOnBg) setTimeout(() => setShouldLockOnBg(true), 3*60*1000)
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
      { vault === undefined && <UnlockScreen vaultPath={DEFAULT_VAULT} onVaultOpen={setVault}/> }
      { vault !== undefined && <VaultScreen initialVault={vault} setShouldLockOnBg={setShouldLockOnBg}/> }
    </SlideTransition>
  )
}

