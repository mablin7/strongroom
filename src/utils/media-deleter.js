import { NativeModules } from 'react-native'

const { MediaDeleter } = NativeModules

export const deleteMediaFile = uri => MediaDeleter.deleteMedia([uri])

