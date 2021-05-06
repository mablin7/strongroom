import React, { useState, useCallback } from 'react'
import { useWindowDimensions, FlatList, ViewToken } from 'react-native'

import { ItemViewFull } from './ItemView'

import { VaultItem } from '../types'

type ListItem = VaultItem & { uuid: string }
type GallerySwiperProps = {
  itemsList: ListItem[],
  loadItem: (uuid: string) => Promise<string>,
  startIdx: number
}


export default ({ itemsList, loadItem, startIdx=0 }: GallerySwiperProps): JSX.Element => {
  const {width, height} = useWindowDimensions()

  const [currentItem, setCurrentItem] = useState(startIdx)
  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const [ viewableItem ] = viewableItems
    if (viewableItem && viewableItem.index !== null) {
      setCurrentItem(viewableItem.index)
    }
  }, [])

  const [ zoomed, setZoomed ] = useState(false)

  return (
    <FlatList
      snapToInterval={width}
      scrollEnabled={!zoomed}
      horizontal
      disableIntervalMomentum
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={{
        itemVisiblePercentThreshold: 90
      }}

      style={{ width, height }}

      data={itemsList}
      getItemLayout={(_, index) => ({ length: width, offset: index * width, index })}
      initialScrollIndex={startIdx}
      keyExtractor={({ uuid }: ListItem) => uuid}
      extraData={currentItem}
      renderItem={({ item, index }) => (
        <ItemViewFull
          item={item}
          loadItem={loadItem}
          width={width}
          height={height}
          distanceFromVisible={Math.abs(currentItem - index)}
          onZoom={setZoomed}
        />
      )}
    />
  )
}

