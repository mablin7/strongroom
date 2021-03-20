import React, { useState } from 'react'
import { View, StyleSheet, Button } from 'react-native'
import DocumentPicker from 'react-native-document-picker'
import { useBackHandler } from '@react-native-community/hooks'

import { useVault } from '../vault'

import GridView from '../components/GridView'
import GallerySwiper from '../components/GallerySwiper'

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
      <Button style={styles.fab} title="Import Files" onPress={onAddBtnPress}/>
    </View>

  )
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#322A26'
  },
  fab: {
    position: 'absolute',
    bottom: 10,
    right: 10
  }
})
