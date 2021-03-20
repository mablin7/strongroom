import React, { useEffect, useState } from 'react'
import { StyleSheet, TextInput } from 'react-native'

import CustomButton from './CustomButton'
import globalStyles from '../utils/styles'
import { FAILURE_COLOR, TEXT_COLOR } from '../utils/constants'

const VERTICAL_PADDING = 10

const isPwdValid = pwd => {
  const words = pwd.split(/ +/g)
  return words.length === 4 && words.every(w => w.length >= 2)
}

const normalizeText = text => {
  const onlyLetters = text.replace(/[^a-z ]+/gi, '')
  const normalizedSpaces = onlyLetters.replace(/ +/g, ' ')
  const lower = normalizedSpaces.toLowerCase()
  return lower
}

export default React.forwardRef(({ btnTitle='Submit', autoFocus=true, clear=false, style={}, onDone }, ref) => {
  const [value, setValue] = useState('')
  const [failed, setFailed] = useState(false)
  const onChangeText = text => {
    if (failed) setFailed(false)
    if (text.endsWith(' ')) text = normalizeText(text)
    setValue(text)
  }

  const _onDone = async text => {
    const normalized = normalizeText(text)
    const success = await Promise.resolve(onDone(normalized))
    if (success === false) {
      setValue(normalized)
      setFailed(true)
    }
  }

  useEffect(() => {
    if(clear) setValue('')
  }, [clear])

  return (
    <>
      <TextInput
        ref={ref}
        autoCapitalize="none"
        autoCorrect={false}
        autoCompleteType="off"
        autoFocus={autoFocus}
        keyboardType="visible-password"
        style={[styles.passwordInput, failed && styles.passwordInputFailed, style]}
        multiline
        numberOfLines={2}
        onChangeText={text => onChangeText(text)}
        onSubmitEditing={({ nativeEvent: { text } }) => isPwdValid(text) && _onDone(text)}
        value={value}
        placeholder="Password"
        placeholderTextColor={TEXT_COLOR + '40'}
      />

      <CustomButton title={btnTitle} hidden={!isPwdValid(value) || failed} onPress={() => _onDone(value)}/>
    </>
  )
})

const styles = StyleSheet.create({
  passwordInput: {
    ...globalStyles.largeText,
    borderColor: TEXT_COLOR,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: VERTICAL_PADDING,
    width: '95%',
    marginBottom: 15
  },
  passwordInputFailed: {
    borderColor: FAILURE_COLOR,
    color: FAILURE_COLOR
  }
})

