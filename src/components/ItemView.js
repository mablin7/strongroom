import React  from 'react'
import { StyleSheet, Image } from 'react-native'

const Placeholder = () => (
  <View style={styles.placeholder}/>
)

export const ItemViewFull = ({ item: { type, data } }) => {
  if (data === undefined) return <Placeholder/>
  else if (type.startsWith('image/')) return <Image style={StyleSheet.absoluteFill} source={{ uri: data }} resizeMode="contain"/>
  else throw new Error('Unkown item type!')
}

export const ItemViewThumbnail = ({ item }) => {
  const { type } = item
  if (type.startsWith('image/')) return <Image style={styles.thumbnail} source={{ uri: item.thumbnail }}/>
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
