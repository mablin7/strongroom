import React, {useState, useRef, useEffect } from 'react'
import { View, StyleSheet, ScrollView, Pressable, useWindowDimensions } from 'react-native'
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { faArrowRight } from '@fortawesome/free-solid-svg-icons'

import { BG_COLOR } from '../utils/constants'
import globalStyles from '../utils/styles'

const FLOATING_BTN_SIZE = 50
const FLOATING_DOT_SIZE = 10

export default ({ children, page=undefined, scrollEnabled=true, totalPages=undefined, onNewPage=undefined }) => {
    totalPages = totalPages || children.length
    onNewPage = onNewPage || (()=>{})

    const {width, height} = useWindowDimensions()
    const [currentPage, setCurrentPage] = useState(0)
    const scrollView = useRef()
    const onscroll = ({ nativeEvent: { contentOffset: { x } } }) => {
        let newPage = Math.round(x/width)  
        if (newPage !== currentPage) {
            onNewPage(newPage)
            setCurrentPage(newPage)
        }
    } 

    useEffect(() => {
        if (page !== undefined && page !== currentPage) {
            scrollView.current?.scrollTo({ x: page * width })
            setCurrentPage(page)
        }
    }, [page, scrollView])

    return (
        <>
            <ScrollView
                ref={scrollView}
                horizontal
                snapToInterval={width}
                onScroll={onscroll}
                decelerationRate="fast"
                disableIntervalMomentum
                showsHorizontalScrollIndicator={false}
                scrollEnabled={scrollEnabled}
            >
                { children.map((child, i) => <View key={i} style={[ globalStyles.center, { width } ]}>{ child }</View>) }
            </ScrollView>
            {
                (currentPage !== children.length - 1 && scrollEnabled) && (
                    <View style={[styles.floatingContainer , { top: (height/2)-FLOATING_BTN_SIZE/2-15 }]}>
                        <Pressable
                            style={({ pressed }) => [styles.floatingButton, { backgroundColor: pressed ? 'rgb(210, 230, 255)' : 'white' }]}
                            onPress={() => scrollView.current?.scrollTo({ x: (currentPage+1)*width })}
                        >
                            <FontAwesomeIcon icon={faArrowRight} color={BG_COLOR} size={FLOATING_BTN_SIZE*0.45}/>
                        </Pressable>
                    </View>
                )
            }
            <View style={styles.floatingDotsContainer}>
                { Array(totalPages).fill(0).map((_, i) => <View key={i} style={[styles.floatingDot, { backgroundColor: i===currentPage ? 'white': BG_COLOR }]}/>) }
            </View>
        </>
    )
}

const styles = StyleSheet.create({
    floatingDot: {
        width: FLOATING_DOT_SIZE,
        marginHorizontal: 3,
        borderRadius: 100,
        borderColor: 'white',
        borderWidth: 1
    },
    floatingDotsContainer: {
        position: 'absolute',
        height: FLOATING_DOT_SIZE,
        right: 0,
        left: 0,
        bottom: 30,
        justifyContent: 'center',
        flexDirection: 'row',
    },
    floatingButton: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 100,
        justifyContent: 'center',
        alignItems: 'center'
    },
    floatingContainer: {
        position: 'absolute',
        height: FLOATING_BTN_SIZE,
        width: FLOATING_BTN_SIZE,
        right: 10,
    },
})
