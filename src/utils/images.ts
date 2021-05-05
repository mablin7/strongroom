export function getContainedDims (width: number, height: number, viewWidth: number, viewHeight: number) {
    const containedDims = { width: 0, height: 0 }
    if (width !== 0 && height !== 0) {
      let scale = viewWidth / width
      if (scale * height > viewHeight) {
        scale = viewHeight / height
        containedDims.height = viewHeight
        containedDims.width = scale * width
      } else {
        containedDims.width = viewWidth
        containedDims.height = scale * height
      }
    }
    return containedDims
}
