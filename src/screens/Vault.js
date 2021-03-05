import React, { useState } from 'react'
import { View, StyleSheet, Button } from 'react-native'

import { useVault } from '../vault'

import GridView from '../components/GridView'
import GallerySwiper from '../components/GallerySwiper'

export default ({ initialVault }) => {
  const { items, decryptItem, importFiles } = useVault(initialVault)
  const itemsList = Object.keys(items).sort().map(uuid => ({ uuid, ...items[uuid] }))

  const [isImporting, setIsImporting] = useState(false)
  const onAddBtnPress = async () => {
    setIsImporting(true)
    await importFiles()
    setIsImporting(false)
  }
  const [viewerPage, openViewerAt] = useState(-1)
  const onItemPress = pressedUUID => openViewerAt(itemsList.findIndex(({uuid}) => pressedUUID === uuid))
  
  return (
    <View style={styles.container}>
      { (viewerPage === -1 && !isImporting) && <GridView itemsList={itemsList} onItemPress={onItemPress}/> }
      { (viewerPage !== -1 && !isImporting) && <GallerySwiper itemsList={itemsList} onScroll={decryptItem} startIdx={viewerPage}/> }
      { !isImporting && <Button style={styles.fab} title="Import Files" onPress={onAddBtnPress}/> }
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
