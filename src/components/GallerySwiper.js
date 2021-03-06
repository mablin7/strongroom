import React, { useState, useRef, useEffect } from 'react'
import { View, StyleSheet, Animated, Easing, useWindowDimensions } from 'react-native'
import { PinchGestureHandler, State, ScrollView } from 'react-native-gesture-handler'

import { ItemViewFull } from './ItemView'

const ZoomState = { OFF: 0, PINCHING: 1, ZOOMED: 2 }
const animConfig = { duration: 200, easing: Easing.linear, useNativeDriver: true }

export default ({ itemsList, startIdx=0, onScroll }) => {
  const {width, height} = useWindowDimensions()
  const [zoom, setZoom] = useState({ state: ZoomState.OFF, value: 1 })

  const scrollRef = useRef()
  const pinchRef = useRef()

  const [currentItem, setCurrentItem] = useState(startIdx)
  const _onScroll = ({ nativeEvent }) => {
    const scrollX = Math.ceil(nativeEvent.contentOffset.x)
    if (scrollX % Math.round(width) === 0) {
      const newIdx = Math.round(scrollX/width)
      onScroll(itemsList[newIdx].uuid)
      setCurrentItem(newIdx)
    }
  }
  useEffect(() => {
    // If starting at 0 _onScroll event is not called, so the image doesn't get decrypted
    if (startIdx === 0) onScroll(itemsList[0].uuid)
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
    Animated.timing(previousScale, { toValue: 1, ...animConfig }).start()
    Animated.timing(pinchFocalXY, { toValue: { x: 0, y: 0 }, ...animConfig }).start()
    setZoom({ state: ZoomState.OFF, value: 1 })
  }

  const onPinchHandlerStateChange = ({ nativeEvent: { state, focalX, focalY, scale: lastPinchScale } }) => {
    if (state === State.ACTIVE) {
      scrollRef.current.scrollTo({ x: currentItem * width, animated: false })
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

  const animatedTransform = {
    transform: [
      { translateX: translateXY.x }, 
      { translateY: translateXY.y }, 
      { scale: actualScale }, 
      { perspective: 1000 }
    ] 
  }
  return (
    <PinchGestureHandler
      ref={pinchRef}
      minPointers={2}
      onGestureEvent={onPinchGestureEvent}
      onHandlerStateChange={onPinchHandlerStateChange}
    >
      <Animated.View>
        <ScrollView
          ref={scrollRef}
          scrollEnabled={zoom.state ===  ZoomState.OFF}
          contentOffset={{ x: startIdx*width, y: 0 }}
          snapToInterval={width}
          waitFor={pinchRef}
          onScroll={_onScroll}
          horizontal
          disableIntervalMomentum
        >
          <Animated.View style={{ width: width*itemsList.length, height, flexDirection: 'row' }}>
            {itemsList.map((item, idx) => (
              <View key={item.uuid}>
                {
                  currentItem === idx ?
                    <Animated.View style={[styles.viewImage, { width }, animatedTransform]}>
                      <ItemViewFull item={item} width={width} height={height}/>
                    </Animated.View>
                    :
                    <View style={[styles.viewImage, { width }]}>
                      <ItemViewFull item={item} width={width} height={height}/>
                    </View>
                }
              </View>
            ))}
          </Animated.View>
        </ScrollView>
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
