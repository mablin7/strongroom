import { StyleSheet } from 'react-native'

import { TEXT_COLOR } from './constants'

export default StyleSheet.create({
  normalText: {
    color: TEXT_COLOR,
    fontSize: 16
  },
  largeText: {
    color: TEXT_COLOR,
    fontSize: 25,
    textAlign: 'center'
  },

  center: {
    alignItems: 'center',
    justifyContent: 'center'
  }
})
