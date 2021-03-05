import { NativeModules } from 'react-native'

const { MediaDeleter } = NativeModules

export const deleteMediaFiles = uris => MediaDeleter.deleteMedia(uris)

