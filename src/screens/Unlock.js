import React, {useEffect, useState} from 'react'
import { View, StyleSheet } from 'react-native'

import { openVault } from '../vault'
import { BG_COLOR } from '../utils/constants'
import globalStyles from '../utils/styles'
import { vaultExists } from '../utils/vaultFile'

import PasswordInput from '../components/PasswordInput'
import CreateVault from './CreateNewVault'

export default ({ vaultPath, onVaultOpen }) => {
  const [createNewVault, setCreateNewVault] = useState(undefined)
  useEffect(() => {
    vaultExists(vaultPath).then(exists => setCreateNewVault(!exists))
  }, [vaultPath])

  const onDone = async password => {
    const vault = await openVault(vaultPath, password)
    if (vault === undefined) return false
    else onVaultOpen(vault)
  }

  return (
    <View style={styles.container}>
      { createNewVault === true && <CreateVault onDone={onDone}/> }
      { createNewVault === false && <PasswordInput onDone={onDone} btnTitle="Unlock!"/> }
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: BG_COLOR,
    ...globalStyles.center,
    flexDirection: 'column'
  }
})
