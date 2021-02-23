import React, { useState, useRef } from 'react'
import { Text, View, StyleSheet, Button, TextInput } from 'react-native'
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons'
import { useBackHandler } from '@react-native-community/hooks'

import { connect } from 'unistore/full/react'

import { actions } from '../vaultStore'
import generatePassword from '../utils/generatePassword'
import { DEFAULT_VAULT } from '../utils/constants'
import globalStyles from '../utils/styles'
import IntroSlide from './IntroSlide'

const WARNING_COLOR = '#ECC30B'
const STATES = { INTRO:1, SELECTING:2, PRACTICE:3 }

export default connect('', actions)(({ openVault }) => {
    const [currentPasswd, setPasswd] = useState(generatePassword())
    const [state, setState] = useState(STATES.INTRO)
    const [newPage, jumpToPage] = useState(0)
    const [practicePwd, onPwdInput] = useState('')
    const passwordInput = useRef()

    const onScroll = page => {
        if (page < 2 && state !== STATES.INTRO) setState(STATES.INTRO)
        else if (page === 2 && state !== STATES.SELECTING) setState(STATES.SELECTING)
        else if( page === 3 && state !== STATES.PRACTICE) {
            passwordInput.current?.focus()
            setState(STATES.PRACTICE)
        }
    }

    const onPwdSubmit = () => {
        if (practicePwd === currentPasswd) openVault(DEFAULT_VAULT, currentPasswd)
        else jumpToPage(2)
    }
    
    useBackHandler(() => state === STATES.PRACTICE ? (jumpToPage(2), true) : undefined)

    const PasswordSelector = (
        <View style={[StyleSheet.absoluteFill, globalStyles.center, { flexDirection: 'column' }]}>
            <Text style={globalStyles.largeText}>Here's a password for you:</Text>
            <View style={styles.passwordShowContainer}>
                <Text style={styles.passwordShow}>{currentPasswd}</Text>
            </View>
            <View style={{ flexDirection: 'row' }}>
                <Button onPress={() => setPasswd(generatePassword())} title="Generate a new one"/>
                <Button onPress={() => jumpToPage(3)} title="I've memorized it!"/>
            </View>
            <View style={styles.warningTextContainer}>
                <FontAwesomeIcon icon={faExclamationTriangle} size={30} color={WARNING_COLOR}/>
                <Text style={styles.warningText}>If you forget your password your data will be lost forever!</Text>
            </View>
        </View>
    )

    const passwordPractice = (
        <View style={[StyleSheet.absoluteFill, globalStyles.center, { flexDirection: 'column' }]}>
            <Text style={globalStyles.largeText}>Let's make sure you've got it</Text>
            <TextInput
                ref={passwordInput}
                autoCapitalize="none"
                autoCorrect={false}
                autoCompleteType="off"
                style={styles.passwordInput}
                onChangeText={text => onPwdInput(text)}
                onEndEditing={onPwdSubmit}
            />
        </View>
    )

    return (
        <View style={StyleSheet.absoluteFill}>
            <IntroSlide page={newPage} scrollEnabled={state === STATES.INTRO} onNewPage={onScroll}>
                <Text style={globalStyles.largeText}>Let's secure your files!</Text>
                <Text style={globalStyles.largeText}>We'll help you choose a secure password</Text>
                { PasswordSelector }
                { passwordPractice }
            </IntroSlide>
        </View>
    )
})

const styles = StyleSheet.create({
    warningTextContainer: {
        marginVertical: 20,
        marginLeft: 30,
        marginRight: 20,
        flexDirection: 'row',
        alignItems: 'center'
    },
    warningText: {
        ...globalStyles.normalText,
        color: WARNING_COLOR,
        marginLeft: 10
    },
    passwordShowContainer: {
        ...globalStyles.center,
        alignSelf: 'stretch',
        marginVertical: 20,
        marginHorizontal: 10,
        // padding: 10,
        height: globalStyles.largeText.fontSize * 2 + 40,
        backgroundColor: '#322A2625',
        borderColor: '#322A26',
        borderWidth: 1,
        borderRadius: 5
    },
    passwordShow: {
        ...globalStyles.largeText,
        fontFamily: 'monospace',
        fontSize: 20,
        color: '#C0E0DE'
    },
    newPasswordButton: {

    }
})
