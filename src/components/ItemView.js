import React  from 'react'
import { StyleSheet, Image, View } from 'react-native'

const Placeholder = () => (
  <View style={styles.placeholder}/>
)

function ItemViewFull_({ item: { type, data, size }, width: viewWidth, height: viewHeight }) {
  if (data === undefined) return <Placeholder/>
  else if (type.startsWith('image/')) {
    const { width, height } = size
    const containedDims = { width: 0, height: 0 }
    if (width !== 0 && height !== 0) {
      if (width > height) {
        containedDims.width = viewWidth
        containedDims.height = (viewWidth / width) * height
      } else {
        containedDims.height = viewHeight
        containedDims.width = (viewHeight / height) * width
      }
    }
    return <Image style={containedDims} source={{ uri: data }}/>
  }
  throw new Error('Unkown item type ' + type + '!')
}
function areEqual({ item: prevItem }, { item: newItem }) {
  return prevItem.type === newItem.type && prevItem.data === newItem.data
}
export const ItemViewFull = React.memo(ItemViewFull_, areEqual)

export const ItemViewThumbnail = ({ item }) => {
  const { type } = item
  if (type.startsWith('image/')) {
    if (item.thumbnail !== undefined && item.thumbnail !== '')
      return <Image style={styles.thumbnail} source={{ uri: item.thumbnail }}/>
    return <View style={[styles.thumbnail, { backgroundColor: 'gray' }]}/>
  }
  else throw new Error('Unkown item type!')
}

const styles = StyleSheet.create({
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'gray'
  },
  thumbnail: {
    width: '100%',
    height: '100%'
  }
})
