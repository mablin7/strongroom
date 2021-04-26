import React, {useEffect, useState}  from 'react'
import { StyleSheet, Image, View, Pressable } from 'react-native'

import { readEncrypted } from '../utils/crypto'

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

const ItemViewThumbnail_ = ({ loadThumbnail, type, uuid, itemSize, onItemPress, margin }) => {
  const [thumbnail, setThumbnail] = useState()
  useEffect(() => {
    let unmounted = false
    loadThumbnail(uuid)
      .then(data => !unmounted && setThumbnail(data))

    return () => unmounted = true
  }, [uuid])

  if (type.startsWith('image/')) {
    return (
      <Pressable onPress={() => onItemPress(uuid)}>
        <View style={{ width: itemSize, height: itemSize, margin }}>
          { thumbnail && <Image style={styles.thumbnail} source={{ uri: thumbnail }}/> }
          { !thumbnail && <View style={[styles.thumbnail, { backgroundColor: 'gray' }]}/> }
        </View>
      </Pressable>
    )
  }
  else throw new Error('Unkown item type!')
}

const areThumbnailsEqual = ({ uuid: prevId }, { uuid: newId }) => prevId === newId

export const ItemViewThumbnail = React.memo(ItemViewThumbnail_, areThumbnailsEqual)

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
