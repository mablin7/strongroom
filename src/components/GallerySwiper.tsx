import React, { useState, useRef, useCallback } from 'react'
import { StyleSheet, Animated, Easing, useWindowDimensions, FlatList as RNFlatList, ViewToken } from 'react-native'
import { PinchGestureHandler, State, FlatList, PinchGestureHandlerGestureEvent } from 'react-native-gesture-handler'

import { ItemViewFull } from './ItemView'

import { VaultItem } from '../types'

const ZoomState = { OFF: 0, PINCHING: 1, ZOOMED: 2 }
const animConfig = { duration: 200, easing: Easing.linear, useNativeDriver: true }

type ListItem = VaultItem & { uuid: string }
type GallerySwiperProps = {
  itemsList: ListItem[],
  loadItem: (uuid: string) => Promise<string>,
  startIdx: number
}

export default ({ itemsList, loadItem, startIdx=0 }: GallerySwiperProps): JSX.Element => {
  const {width, height} = useWindowDimensions()
  const [zoom, setZoom] = useState({ state: ZoomState.OFF, value: 1 })

  const scrollRef= useRef<RNFlatList<ListItem>|null>(null)
  const pinchRef = useRef()

  const [currentItem, setCurrentItem] = useState(startIdx)
  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const [ viewableItem ] = viewableItems
    if (viewableItem && viewableItem.index !== null) setCurrentItem(viewableItem.index)
  }, [])

  const pinchScale = useRef(new Animated.Value(1)).current
  const onPinchGestureEvent = Animated.event([{
    nativeEvent: { scale: pinchScale }
  }], { useNativeDriver: true })

  const previousScale = useRef(new Animated.Value(1)).current

  const currentScale = useRef(Animated.multiply(pinchScale, previousScale)).current
  // Clamp zoom between 0.5x and 2x. This is applied to the actual image.
  const actualScale = currentScale.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [0.5, 1, 2],
    extrapolate: 'clamp'
  })

  // This is used for the offset, to calculate how close we get to the focal point.
  // scale=2 => offset=0.5*focalPoint i.e. we go halfway
  const reversedScale = currentScale.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  })
  const pinchFocalXY = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current
  const translateXY = useRef({
    x: Animated.multiply(-1, Animated.multiply(reversedScale, pinchFocalXY.x)),
    y: Animated.multiply(-1, Animated.multiply(reversedScale, pinchFocalXY.y))
  }).current

  const resetScale = () => {
    Animated.timing(previousScale, { toValue: 1, ...animConfig }).start(() => previousScale.setValue(1))
    Animated.timing(pinchFocalXY, { toValue: { x: 0, y: 0 }, ...animConfig }).start()
    setZoom({ state: ZoomState.OFF, value: 1 })
  }

  const onPinchHandlerStateChange = ({ nativeEvent: { state, focalX, focalY, scale: lastPinchScale } }: PinchGestureHandlerGestureEvent) => {
    if (state === State.ACTIVE) {
      if (scrollRef.current) scrollRef.current.scrollToIndex({ index: currentItem, animated: false })
      Animated.timing(pinchFocalXY, { toValue: { x: width/2-focalX, y: height/2-focalY }, ...animConfig }).start()
      setZoom({ state: ZoomState.PINCHING, value: zoom.value })
    }
    if (state === State.END) {
      const newScale = Math.min(lastPinchScale * zoom.value, 2)
      previousScale.setValue(newScale)
      pinchScale.setValue(1)

      if (newScale < 1.3) resetScale()
      else setZoom({ state: ZoomState.ZOOMED, value: newScale })
    }
  }

  const animatedTransform = useRef({
    transform: [
      { translateX: translateXY.x }, 
      { translateY: translateXY.y }, 
      { scale: actualScale }, 
      { perspective: 1000 }
    ] 
  }).current
  
  return (
    <PinchGestureHandler
      ref={pinchRef}
      minPointers={2}
      onGestureEvent={onPinchGestureEvent}
      onHandlerStateChange={onPinchHandlerStateChange}
    >
      <Animated.View>
        <FlatList
          ref={scrollRef}
          scrollEnabled={zoom.state ===  ZoomState.OFF}
          contentOffset={{ x: startIdx*width, y: 0 }}
          snapToInterval={width}
          /*@ts-ignore */
          waitFor={pinchRef}
          horizontal
          disableIntervalMomentum
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{
            itemVisiblePercentThreshold: 90
          }}

          style={{ width, height }}

          data={itemsList}
          keyExtractor={({ uuid }: ListItem) => uuid}
          extraData={currentItem}
          renderItem={({ item, index }) => (
            <Animated.View style={[styles.viewImage, { width }, currentItem === index ? animatedTransform : {}]}>
              <ItemViewFull item={item} loadItem={loadItem} width={width} height={height} distanceFromVisible={Math.abs(currentItem - index)}/>
            </Animated.View>
          )}
        />
      </Animated.View>
    </PinchGestureHandler>
  )
}

const styles = StyleSheet.create({
  viewImage: {
    width: '100%',
    height: '100%',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
})
