import React, { useState, useRef } from 'react'
import { StyleSheet, Image, Animated, Easing, useWindowDimensions } from 'react-native'
import { PinchGestureHandler, State, ScrollView } from 'react-native-gesture-handler'

const ZoomState = { OFF: 0, PINCHING: 1, ZOOMED: 2 }

export default ({ data, startIdx=0 }) => {
  const {width, height} = useWindowDimensions()
  const [currentItem, setCurrentItem] = useState(startIdx)
  const [zoom, setZoom] = useState({ state: ZoomState.OFF, value: 1 })

  const scrollRef = useRef()
  const pinchRef = useRef()

  const onScroll = ({ nativeEvent }) => {
    const scrollX = nativeEvent.contentOffset.x
    if (scrollX % width === 0) {
      console.log('scroll', scrollX/width)
      setCurrentItem(Math.round(scrollX/width))
    }
  }

  const pinchScale = useRef(new Animated.Value(1)).current
  const previousScale = useRef(new Animated.Value(1)).current
  const scale = useRef(Animated.multiply(pinchScale, previousScale)).current
  const scaleClamped = scale.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [0.5, 1, 2],
    extrapolate: 'clamp'
  })
  const scaleReversed = scale.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  })
  const pinchFocalXY = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current
  const translateXY = useRef({
    x: Animated.multiply(-1, Animated.multiply(scaleReversed, pinchFocalXY.x)),
    y: Animated.multiply(-1, Animated.multiply(scaleReversed, pinchFocalXY.y))
  }).current

  const resetScale = () => {
    Animated.timing(previousScale, { toValue: 1, duration: 200, easing: Easing.linear, useNativeDriver: true }).start()
    Animated.timing(pinchFocalXY, { toValue: { x: 0, y: 0 }, duration: 200, easing: Easing.linear, useNativeDriver: true }).start()
    setZoom({ state: ZoomState.OFF, value: 1 })
  }

  const onPinchGestureEvent = Animated.event([{
    nativeEvent: { scale: pinchScale }
  }], { useNativeDriver: true })

  const onPinchHandlerStateChange = ({ nativeEvent: { state, focalX, focalY, scale: lastPinchScale } }) => {
    if (state === State.ACTIVE) {
      scrollRef.current.scrollTo({ x: currentItem * width, animated: false })
      Animated.timing(pinchFocalXY, { toValue: { x: width/2-focalX, y: height/2-focalY }, duration: 200, easing: Easing.linear, useNativeDriver: true }).start()
      setZoom({ state: ZoomState.PINCHING, value: zoom.value })
    }
    if (state === State.END) {
      console.log('pinch end', lastPinchScale)
      const newScale = Math.min(lastPinchScale * zoom.value, 2)
      previousScale.setValue(newScale)
      pinchScale.setValue(1)

      if (newScale < 1.3) resetScale()
      else setZoom({ state: ZoomState.ZOOMED, value: newScale })
    }
  }

  return (
    <Animated.View>
      <PinchGestureHandler ref={pinchRef} minPointers={2} onGestureEvent={onPinchGestureEvent} onHandlerStateChange={onPinchHandlerStateChange} >
        <Animated.View>
          <ScrollView
            ref={scrollRef}
            scrollEnabled={zoom.state ===  ZoomState.OFF}
            contentOffset={{ x: startIdx*width, y: 0 }}
            snapToInterval={width}
            waitFor={pinchRef}
            onScroll={onScroll}
            horizontal
            disableIntervalMomentum
          >
            <Animated.View style={[{ width: width*data.length, height, flexDirection: 'row',  }]}>
              {data.map((src, idx) => ( currentItem === idx ?
                <Animated.Image
                  key={idx}
                  source={src}
                  style={[styles.viewImage, { width, transform: [{ translateX: translateXY.x }, { translateY: translateXY.y }, { scale: scaleClamped }, { perspective: 1000 }] }]}
                />
                :
                <Image key={idx} source={src} style={[styles.viewImage, { width }]}/>
              ))}
            </Animated.View>
          </ScrollView>
        </Animated.View>
      </PinchGestureHandler>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  viewImage: {
    width: '100%',
    height: '100%'
  },
}
