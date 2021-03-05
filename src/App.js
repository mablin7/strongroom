import React, { useState } from 'react'

import Unlock from './screens/Unlock'
import Vault from './screens/Vault'
import {DEFAULT_VAULT} from './utils/constants'

export default () => {   
  const [vault, setVault] = useState(undefined)

  return (
    vault === undefined ? <Unlock vaultPath={DEFAULT_VAULT} onVaultOpen={setVault}/> : <Vault initialVault={vault}/>
  )
}

