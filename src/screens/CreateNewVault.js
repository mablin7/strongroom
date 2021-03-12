import React, { useState, useRef, useEffect } from 'react'
import { Text, View, StyleSheet, Button, ScrollView, useWindowDimensions, Pressable } from 'react-native'
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons'
import { useBackHandler } from '@react-native-community/hooks'

import CustomButton from '../components/CustomButton'
import PasswordInput from '../components/PasswordInput'

import generatePassword from '../utils/generatePassword'
import globalStyles from '../utils/styles'
import { BG_COLOR, TEXT_COLOR } from '../utils/constants'

const Intro1 = ({ onNext }) => (
  <>
    <View style={{ width: '60%', height: '30%', backgroundColor: 'green', marginBottom: 40 }}>
      <Text>Cool image here</Text>
    </View>
    <Text style={globalStyles.largeText}>
      Strongroom keeps your photos safe by encrypting them
    </Text>
    <View style={styles.bottomContainer}>
      <CustomButton title="Let's go!" onPress={onNext}/>
    </View>
  </>
)

const WARNING_COLOR = '#ECC30B'
const PASSWORD_BG_COLOR = '#322A2625'
const PASSWORD_COLOR = '#C0E0DE'

const PasswordSelection = ({ onNext }) => {
  const [selectedPwd, setPasswd] = useState(generatePassword())

  return (
    <>
      <Text style={globalStyles.largeText}>Here's a password for you:</Text>
      <View style={styles.passwordShowContainer}>
        <View style={styles.passwordContainer}>
          <Text style={styles.password}>{selectedPwd}</Text>
        </View>
        <CustomButton
          style={styles.newPwdBtn}
          backgroundColor={PASSWORD_BG_COLOR}
          title="Generate a new one"
          onPress={() => setPasswd(generatePassword())}
        />
      </View>
      <View style={styles.warningTextContainer}>
        <FontAwesomeIcon icon={faExclamationTriangle} size={30} color={WARNING_COLOR}/>
        <Text style={styles.warningText}>If you forget your password, your data will be lost forever!</Text>
      </View>
      <CustomButton onPress={() => onNext(selectedPwd)} title="I've memorized it!"/>
    </>
  )
}

const PasswordPractice = ({ selectedPwd, onNext, onFail, visible }) => {
  const textInputRef = useRef()
  useEffect(() => {
    if (visible) textInputRef.current?.focus()
    else textInputRef.current?.blur()
  }, [visible, textInputRef])

  const onInput = pwd => {
    if (pwd === selectedPwd) onNext()
    else onFail()
  }

  return (
    <>
      <Text style={globalStyles.largeText}>Let's make sure you got it</Text>
      <PasswordInput
        ref={textInputRef}
        style={styles.passwordInput}
        autoFocus={false}
        clear={!visible}
        onDone={onInput}
      />
    </>
  )
}

const Pages = [
  Intro1, PasswordSelection, PasswordPractice
]
export default ({ onDone }) => {
  const { width } = useWindowDimensions()
  const [pageIdx, setPage] = useState(0)
  const [selectedPwd, setSelectedPwd] = useState()

  const scrollRef = useRef()
  useEffect(() => {
    scrollRef.current?.scrollTo({ x: width*pageIdx })
  }, [pageIdx, scrollRef])

  const scrollBy = d => {
    const newPageIdx = Math.max(0, Math.min(pageIdx + d, Pages.length - 1))
    setPage(newPageIdx)
  }

  const onNext = (password=undefined) => {
    if (pageIdx === Pages.length -1) onDone(selectedPwd)
    else {
      if (password !== undefined) setSelectedPwd(password)
      scrollBy(+1)
    }    
  }

  useBackHandler(() => {
    if (pageIdx !== 0) {
      scrollBy(-1)
      return true
    } 
    return false
  })

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      scrollEnabled={false}
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      style={styles.scrollView}
    >
      {Pages.map((Page, idx) => (
        <View key={idx} style={[{ width }, styles.pageContainer]}>
          <Page
            onNext={onNext}
            onFail={() => setPage(1)}
            selectedPwd={selectedPwd}
            visible={idx === pageIdx}
          />
        </View>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  // Root styles
  scrollView: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: BG_COLOR,
  },
  pageContainer: {
    ...globalStyles.center,
    flexDirection: 'column'
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    padding: 20
  },

  // PasswordSelection styles
  warningTextContainer: {
    alignSelf: 'stretch',
    marginVertical: 20,
    marginHorizontal: 10,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: WARNING_COLOR,
    borderRadius: 10
  },
  warningText: {
    ...globalStyles.normalText,
    color: WARNING_COLOR,
    marginHorizontal: 15,
    fontWeight: 'bold'
  },
  passwordShowContainer: {
    alignSelf: 'stretch',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    marginTop: 20,
    marginHorizontal: 10,
    backgroundColor: PASSWORD_BG_COLOR,
    borderColor: TEXT_COLOR,//'#322A26',
    borderWidth: 1,
    borderRadius: 10
  },
  newPwdBtn: {
    paddingVertical: 10,
    alignSelf: 'stretch',
    borderRadius: 0,
    borderBottomRightRadius: 10,
    borderBottomLeftRadius: 10,
    borderWidth: 0,
    borderTopWidth: 1
  },
  passwordContainer: {
    height: globalStyles.largeText.fontSize * 2 + 40,
    ...globalStyles.center
  },
  password: {
    ...globalStyles.largeText,
    fontFamily: 'monospace',
    fontSize: 20,
    color: PASSWORD_COLOR
  },

  // PasswordPractice styles
  passwordInput: {
    marginTop: 15
  }
})
