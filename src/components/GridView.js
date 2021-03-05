import React  from 'react'
import { View, ScrollView, StyleSheet, Pressable, useWindowDimensions } from 'react-native'

import { ItemViewThumbnail } from './ItemView'

export default ({ itemsList, minNCols=3, maxItemWidth=200, margin=2, onItemPress=undefined }) => {
  const _onItemPress = onItemPress || (()=>{})
  const {width} = useWindowDimensions()
  const nCols = Math.floor(width/minNCols) > maxItemWidth ? Math.floor(width/maxItemWidth) : minNCols
  const itemSize = (width/nCols)-margin*2

  return (
    <ScrollView>
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
