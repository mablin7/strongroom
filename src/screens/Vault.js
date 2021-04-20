import React, { useState } from 'react'
import { View, StyleSheet, Button, Pressable } from 'react-native'
import DocumentPicker from 'react-native-document-picker'
import { useBackHandler } from '@react-native-community/hooks'
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { faPlus } from '@fortawesome/free-solid-svg-icons'

import { useVault } from '../vault'
import { BG_COLOR } from '../utils/constants'
import globalStyles from '../utils/styles'

import GridView from '../components/GridView'
import GallerySwiper from '../components/GallerySwiper'

function ImportButton({ onPress }) {
  return (
    <Pressable
      style={({ pressed }) => [
        {
          backgroundColor: pressed
            ? BG_COLOR
            : BG_COLOR
        },
        styles.fab,
      ]}
      android_ripple={{
        color: 'rgba(255, 255, 255, 0.3)',
        borderless: false,
        radius: 30
      }}
      onPress={onPress}
    >
      <FontAwesomeIcon size={30} color="#273353" icon={faPlus}/>
    </Pressable>
  )
}

export default ({ initialVault, setShouldLockOnBg }) => {
  const { items, decryptItem, importFiles } = useVault(initialVault)
  const itemsList = Object.keys(items).sort().map(uuid => ({ uuid, ...items[uuid] }))

  const setIsImporting = v => {
    if (v) setShouldLockOnBg(false)
    else setTimeout(() => setShouldLockOnBg(true), 100)
  }
  const onAddBtnPress = async () => {
    setIsImporting(true)
    try {
      const results = await DocumentPicker.pickMultiple({
        type: DocumentPicker.types.images
      })
      await importFiles(results)
      setIsImporting(false)
    } catch (err) {
      if (DocumentPicker.isCancel(err)) setIsImporting(false)
      else throw err
    }
  }

  const [viewerPage, openViewerAt] = useState(-1)
  const onItemPress = pressedUUID => openViewerAt(itemsList.findIndex(({uuid}) => pressedUUID === uuid))
  useBackHandler(() => {
    if (viewerPage !== -1) {
      openViewerAt(-1)
      return true
    } else return false
  })
  
  return (
    <View style={styles.container}>
      {
        viewerPage === -1
          ? <GridView itemsList={itemsList} onItemPress={onItemPress}/>
          : <GallerySwiper itemsList={itemsList} onScroll={decryptItem} startIdx={viewerPage}/>
      }
      <ImportButton onPress={onAddBtnPress}/>
    </View>

  )
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#322A26'
  },
  fab: {
    ...globalStyles.center,
    position: 'absolute',
    bottom: 15,
    right: 15,
    width: 60,
    height: 60,
    borderRadius: 50,
  }
})
