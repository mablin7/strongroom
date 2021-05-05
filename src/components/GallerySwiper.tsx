import React, { useState, useRef, useCallback, useEffect } from 'react'
import { StyleSheet, Animated, Easing, useWindowDimensions, FlatList as RNFlatList, ViewToken } from 'react-native'
import { PinchGestureHandler, State, FlatList, PinchGestureHandlerGestureEvent, PanGestureHandler, PanGestureHandlerStateChangeEvent } from 'react-native-gesture-handler'

import { ItemViewFull } from './ItemView'

import { VaultItem } from '../types'
import {getContainedDims} from '../utils/images'

enum ZoomState {
  OFF, PINCHING, ZOOMED
}

type ListItem = VaultItem & { uuid: string }
type GallerySwiperProps = {
  itemsList: ListItem[],
  loadItem: (uuid: string) => Promise<string>,
  startIdx: number
}
type Zoom = {
  state: ZoomState,
  value: number,
  focalX?: number,
  focalY?: number
}

const animConfig = { duration: 200, easing: Easing.linear, useNativeDriver: true }

export default ({ itemsList, loadItem, startIdx=0 }: GallerySwiperProps): JSX.Element => {
  const {width, height} = useWindowDimensions()
  const [zoom, setZoom] = useState<Zoom>({ state: ZoomState.OFF, value: 1 })

  const scrollRef= useRef<RNFlatList<ListItem>|null>(null)
  const pinchRef = useRef()
  const panRef = useRef()

  const [currentItem, setCurrentItem] = useState(startIdx)
  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const [ viewableItem ] = viewableItems
    if (viewableItem && viewableItem.index !== null) setCurrentItem(viewableItem.index)
  }, [])

  const pinchScale = useRef(new Animated.Value(1)).current
  const previousScale = useRef(new Animated.Value(1)).current
  const pinchFocal = useRef(new Animated.ValueXY()).current
  const pinchFocalAdjusted = useRef(({
    x: Animated.subtract(pinchFocal.x, width / 2),
    y: Animated.subtract(pinchFocal.y, height / 2),
  })).current

  const panXY = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current
  const onPanEvent = useRef(Animated.event([{
    nativeEvent: {
      translationX: panXY.x,
      translationY: panXY.y
    }
  }], { useNativeDriver: true })).current

  const sumTranslateXY = useRef({
    x: Animated.add(pinchFocalAdjusted.x, panXY.x),
    y: Animated.add(pinchFocalAdjusted.y, panXY.y)
  }).current

  const {width: imageWidht, height: imageHeight} = itemsList[currentItem].size
  const {width: containedWidht, height: containedHeight} = getContainedDims(imageWidht, imageHeight, width, height)
  const scaledImageWidth = containedWidht * zoom.value
  const scaledImageHeight = containedHeight * zoom.value
  const maxXTrans = scaledImageWidth > width ? scaledImageWidth / 2 - width / 2 : 0
  const maxYTrans = scaledImageHeight > height ? scaledImageHeight / 2 - height / 2 : 0

  const translateXYClamped = {
    x: Animated.diffClamp(sumTranslateXY.x, -maxXTrans, maxXTrans),
    y: Animated.diffClamp(sumTranslateXY.y, -maxYTrans, maxYTrans)
  }

  const panTranslateXY = {
    x: Animated.subtract(translateXYClamped.x, pinchFocalAdjusted.x),
    y: Animated.subtract(translateXYClamped.y, pinchFocalAdjusted.y)
  }

  const resetScale = () => {
    Animated.timing(previousScale, { toValue: 1, ...animConfig }).start(() => previousScale.setValue(1))
    Animated.timing(pinchFocal, { toValue: { x: 0, y: 0 }, ...animConfig }).start()
    Animated.timing(panXY, { toValue: { x: 0, y: 0 }, ...animConfig }).start()
    setZoom({ state: ZoomState.OFF, value: 1 })
  }
  const detachHandler = useRef<() => void|undefined>()

  const onPinchHandlerStateChange = ({ nativeEvent: { state, focalX, focalY, scale: lastPinchScale } }: PinchGestureHandlerGestureEvent) => {
    if (state === State.ACTIVE) {
      if (scrollRef.current) scrollRef.current.scrollToIndex({ index: currentItem, animated: false })

      //@ts-ignore
      detachHandler.current = Animated.attachNativeEvent(pinchRef.current, 'onGestureHandlerEvent', [{
        nativeEvent: {
          scale: pinchScale,
        }
      }]).detach

      pinchFocal.setValue({
        x: focalX,
        y: focalY
      })

      setZoom({ state: ZoomState.PINCHING, value: zoom.value, focalX, focalY })
    }
    if (state === State.END) {
      const newScale = Math.min(lastPinchScale * zoom.value, 3)
      previousScale.setValue(newScale)

      if (detachHandler.current) detachHandler.current()
      pinchScale.setValue(1)

      if (newScale < 1.3) resetScale()
      else setZoom({ state: ZoomState.ZOOMED, value: newScale, focalX, focalY })
    }
  }

  const lastTranslate = useRef({ x: 0, y: 0 }).current
  const onPanHandlerStateChange = ({ nativeEvent: { state, translationX, translationY } }: PanGestureHandlerStateChangeEvent) => {
    if (state === State.END) {
      const focalX = ((zoom.focalX || 0))
      const focalY = (zoom.focalY || 0)
      const newX = Math.min(Math.max(lastTranslate.x + translationX, -maxXTrans), maxXTrans)
      const newY = Math.min(Math.max(lastTranslate.y + translationY, -maxYTrans), maxYTrans)

      lastTranslate.x = newX
      lastTranslate.y = newY
      panXY.extractOffset()
      panXY.setOffset(lastTranslate)
    }
  }

  const animatedTransform = {
    transform: [
      { translateX: pinchFocalAdjusted.x }, 
      { translateY: pinchFocalAdjusted.y }, 
      { scale: Animated.multiply(pinchScale, previousScale) }, 
      { translateX: Animated.multiply(-1, pinchFocalAdjusted.x) }, 
      { translateY: Animated.multiply(-1, pinchFocalAdjusted.y) },

      { translateX: panXY.x },
      { translateY: panXY.y },

      { perspective: 1000 }
    ] 
  }

  return (
    <PinchGestureHandler
      ref={pinchRef}
      minPointers={2}
      waitFor={panRef}
      onHandlerStateChange={onPinchHandlerStateChange}
    >
      <Animated.View>
        <PanGestureHandler
          ref={panRef}
          enabled={zoom.state === ZoomState.ZOOMED}
          maxPointers={1}
          onHandlerStateChange={onPanHandlerStateChange}
          onGestureEvent={onPanEvent}
        >
          <Animated.View>
            <FlatList
              ref={scrollRef}
              scrollEnabled={zoom.state ===  ZoomState.OFF}
              contentOffset={{ x: startIdx*width, y: 0 }}
              snapToInterval={width}
              //@ts-ignore
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
        </PanGestureHandler>
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
