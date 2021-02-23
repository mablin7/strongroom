import React from 'react'
import { View, StyleSheet } from 'react-native'

import { connect } from 'unistore/full/react'

import { actions } from '../vaultStore'
import { DEFAULT_VAULT, BG_COLOR } from '../utils/constants'

import CreateVault from '../components/UnlockCreateVault'

export default connect(['vaultExists'], actions)(({ vaultExists, checkVault }) => {
  let screen
  if (vaultExists === undefined) checkVault(DEFAULT_VAULT)
  else if (vaultExists === false) screen = <CreateVault/>
  // TODO: unlock screen if vault exists

    return (
      <View style={styles.container}>
        {screen}
      </View>
    )
})

const styles = StyleSheet.create({
  container: {
    backgroundColor: BG_COLOR,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  }
})
