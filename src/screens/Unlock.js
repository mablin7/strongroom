import React, {useEffect, useState} from 'react'
import { View, StyleSheet, Text } from 'react-native'

import { openVault } from '../vault'
import { BG_COLOR } from '../utils/constants'
import { vaultExists } from '../utils/vaultFile'

import CreateVault from '../components/UnlockCreateVault'

export default ({ vaultPath, onVaultOpen }) => {
  const [createNewVault, setCreateNewVault] = useState(undefined)
  useEffect(() => {
    vaultExists(vaultPath).then(exists => setCreateNewVault(!exists))
  }, [vaultPath])

  const onDone = async password => {
    onVaultOpen(await openVault(vaultPath, password))
  }

  let screen
  if (createNewVault === true) screen = <CreateVault onDone={onDone}/>
  // TODO: unlock screen if vault exists
  else if (createNewVault === false) screen = <Text>Unlock screen</Text>

    return (
      <View style={styles.container}>
        {screen}
      </View>
    )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: BG_COLOR,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  }
})
