import React  from 'react'
import { View, StyleSheet, Image, Pressable, useWindowDimensions } from 'react-native'

export default ({ data, minNCols=3, maxItemWidth=200, margin=2, onItemPress=undefined }) => {
  const _onItemPress = onItemPress || (()=>{})
  const {width} = useWindowDimensions()
  const nCols = Math.floor(width/minNCols) > maxItemWidth ? Math.floor(width/maxItemWidth) : minNCols
  const itemSize = (width/nCols)-margin*2

  return (
    <ScrollView>
      <View style={styles.gridContainer}>
        {data.map((src, idx) => (
          <Pressable key={idx} onPress={() => _onItemPress(idx)}>
            <View style={{ width: itemSize, height: itemSize, margin }}>
              <Image source={src} style={styles.thumb}/>
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
