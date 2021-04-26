import React, {useEffect, useRef}  from 'react'
import { View, ScrollView, StyleSheet, Pressable, useWindowDimensions } from 'react-native'

import { ItemViewThumbnail } from './ItemView'

export default ({ itemsList, minNCols=3, maxItemWidth=200, margin=2, onItemPress=undefined, loadThumbnails, thumbnailsBuffer=.5 }) => {
  const _onItemPress = onItemPress || (()=>{})
  const {width, height} = useWindowDimensions()
  const nCols = Math.floor(width/minNCols) > maxItemWidth ? Math.floor(width/maxItemWidth) : minNCols
  const itemSize = (width/nCols)-margin*2
  const numVisible = Math.ceil(nCols * (height / itemSize))

  const timer = useRef()
  const yOffset = useRef()
  const uuidList = itemsList.map(i => i.uuid)
  const onScroll = ({ nativeEvent }) => {
    yOffset.current = nativeEvent.contentOffset.y

    if (timer.current) return
    timer.current = setTimeout(() => {
      if (uuidList.length < numVisible) return loadThumbnails(uuidList)

      const firstVisibleIdx = Math.max(0, Math.floor((nCols * (yOffset.current / itemSize)) - thumbnailsBuffer * numVisible))
      const lastVisibleIdx = Math.min(itemsList.length, Math.ceil(firstVisibleIdx + numVisible + 2 * thumbnailsBuffer * numVisible) + 1)
      loadThumbnails(uuidList.slice(firstVisibleIdx, lastVisibleIdx))

      timer.current = undefined
    }, 300)
  }
  useEffect(() => {
    onScroll({ nativeEvent: { contentOffset: { y: 0 } }})
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  return (
    <ScrollView onScroll={onScroll}>
      <View style={styles.gridContainer}>
        {itemsList.map(item => (
          <Pressable key={item.uuid} onPress={() => _onItemPress(item.uuid)}>
            <View style={{ width: itemSize, height: itemSize, margin }}>
              <ItemViewThumbnail item={item}/>
            </View>
          </Pressable>
        ))}
        </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  thumb: {
    width: '100%',
    height: '100%'
  }
})
