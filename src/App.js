import React from 'react'

import { createStore, Provider, connect } from 'unistore/full/react'

import { defaultStore, actions } from './vaultStore'
import { isVaultOpen } from './utils/store-utils'
import Unlock from './screens/Unlock'
import Vault from './screens/Vault'

const store = createStore(defaultStore)

const App = connect(['vaultKey', 'items', 'manifest'], actions)(({ vaultKey, items, manifest }) => {   
  const vaultOpen = isVaultOpen({ vaultKey, items, manifest })

  return (
    vaultOpen ? <Vault/> : <Unlock/>
  )
})


export default () => (<Provider store={store}><App/></Provider>)
