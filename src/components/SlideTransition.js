import React, { useEffect, useRef, useState } from 'react'
import { Animated, useWindowDimensions, StyleSheet } from 'react-native'

export default ({ goTo, children }) => {
  const { width } = useWindowDimensions()
  const [currentIdx, setCurrentIdx] = useState(goTo)
  const translateX = useRef(new Animated.Value(0)).current

  const toValue = goTo > currentIdx ? -width : width
  useEffect(() => {
    if (currentIdx !== goTo)
      Animated.timing(translateX, { toValue, duration: 150, useNativeDriver: true }).start(() => {
        translateX.setValue(0)
        setCurrentIdx(goTo)
      })
  }, [goTo])

  return (
    <>
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX }, { perspective: 1000 }] }]}>
        { children[currentIdx] }
      </Animated.View>
      { currentIdx !== goTo && (
        <Animated.View
          style={[StyleSheet.absoluteFill, {
            transform: [{ translateX: Animated.multiply(-1, Animated.subtract(toValue, translateX)) }, { perspective: 1000 }]
          }]}
        >
          { children[goTo] }
        </Animated.View>
      )}
    </>
  )
}
