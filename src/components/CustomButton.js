import React, { useRef, useState }  from 'react'
import { Pressable, StyleSheet, Text, Animated } from 'react-native'

import globalStyles from '../utils/styles'
import { BG_COLOR, TEXT_COLOR } from '../utils/constants'

export default ({ title, onPress, hidden=false }) => {
  const opacity = useRef(new Animated.Value(hidden ? 0 : 1)).current
  const [currentlyHidden, setCurrentlyHidden] = useState(hidden)
  if (currentlyHidden !== hidden) {
    Animated.timing(opacity, { toValue: hidden ? 0 : 1, duration: 200, useNativeDriver: true }).start()
    setCurrentlyHidden(hidden)
  }

  return (
    <Animated.View style={{ opacity }}>
      <Pressable
        onPress={onPress}
        disabled={hidden}
        style={({ pressed }) => [
          {
            backgroundColor: pressed
              ? 'rgba(255, 255, 255, 119)'
              : BG_COLOR
          },
          styles.button,
        ]}
      >
        {
          ({ pressed }) => pressed 
            ? <Text style={[styles.text, { color: BG_COLOR }]}>{title}</Text>
            : <Text style={styles.text}>{title}</Text>
        }
      </Pressable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  text: {
    ...globalStyles.normalText,
    fontSize: 20,
  },
  button: {
    alignItems: 'center',
    borderColor: TEXT_COLOR,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginTop: 20
  }
})

