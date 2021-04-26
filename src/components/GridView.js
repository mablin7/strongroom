import React from 'react'
import { FlatList, useWindowDimensions } from 'react-native'

import { ItemViewThumbnail } from './ItemView'

export default ({ itemsList, loadThumbnail, minNCols=3, maxItemWidth=200, margin=2, onItemPress=undefined }) => {
  const _onItemPress = onItemPress || (()=>{})
  const { width } = useWindowDimensions()
  const nCols = Math.floor(width/minNCols) > maxItemWidth ? Math.floor(width/maxItemWidth) : minNCols
  const itemSize = (width/nCols)-margin*2

  return (
    <FlatList
      numColumns={nCols}
      data={itemsList}
      keyExtractor={item => item.uuid}
      renderItem={({ item: { uuid, type } }) => (
        <ItemViewThumbnail
          uuid={uuid}
          type={type}
          loadThumbnail={loadThumbnail}
          itemSize={itemSize}
          margin={margin}
          onItemPress={_onItemPress}
        />
      )}
    />
  )
}

