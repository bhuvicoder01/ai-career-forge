export const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.setAttribute('crossOrigin', 'anonymous') // needed to avoid cross-origin issues on CodeSandbox
    image.src = url
  })

export function getRadianAngle(degreeValue: number) {
  return (degreeValue * Math.PI) / 180
}

/**
 * Returns the new bounding area of a rotated rectangle.
 */
export function rotateSize(width: number, height: number, rotation: number) {
  const rotRad = getRadianAngle(rotation)

  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  }
}

/**
 * This function was adapted from the one in the react-easy-crop tutorial
 * with some modifications.
 */
export default async function getCroppedImg(
  imageSrc: string,
  pixelCrop: any,
  rotation = 0,
  flip = { horizontal: false, vertical: false }
): Promise<Blob | null> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    return null
  }

  const rotRad = getRadianAngle(rotation)

  // calculate bounding box of the rotated image
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation
  )

  // set canvas size to match the bounding box
  canvas.width = Math.ceil(bBoxWidth)
  canvas.height = Math.ceil(bBoxHeight)

  // translate canvas context to a central location to allow rotating and flipping around the center
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2)
  ctx.rotate(rotRad)
  ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1)
  ctx.translate(-image.width / 2, -image.height / 2)

  // draw rotated image
  ctx.drawImage(image, 0, 0)

  // croppedAreaPixels values are bounding box relative
  // extract the cropped image using these values
  const roundedX = Math.floor(pixelCrop.x);
  const roundedY = Math.floor(pixelCrop.y);
  const roundedWidth = Math.ceil(pixelCrop.width);
  const roundedHeight = Math.ceil(pixelCrop.height);

  if (isNaN(roundedX) || isNaN(roundedY) || isNaN(roundedWidth) || isNaN(roundedHeight)) {
    throw new Error("Crop dimensions contain NaN values");
  }

  if (roundedWidth <= 0 || roundedHeight <= 0) {
    throw new Error("Crop width and height must be greater than 0");
  }

  console.log("getCroppedImg input:", { pixelCrop, canvas: { w: canvas.width, h: canvas.height } });

  // Ensure they don't exceed canvas bounds
  const safeX = Math.max(0, roundedX);
  const safeY = Math.max(0, roundedY);
  const safeWidth = Math.max(1, Math.min(canvas.width - safeX, roundedWidth));
  const safeHeight = Math.max(1, Math.min(canvas.height - safeY, roundedHeight));

  if (safeWidth <= 0 || safeHeight <= 0) {
    throw new Error("Calculated crop area is outside image bounds");
  }

  const data = ctx.getImageData(
    safeX | 0,
    safeY | 0,
    safeWidth | 0,
    safeHeight | 0
  )

  // set canvas width to final desired crop size - this will clear existing context
  canvas.width = safeWidth
  canvas.height = safeHeight

  // paste generated rotate image at the top left corner
  ctx.putImageData(data, 0, 0)

  // As Base64 string
  // return canvas.toDataURL('image/jpeg');

  // As a blob
  return new Promise((resolve, reject) => {
    canvas.toBlob((file) => {
      resolve(file)
    }, 'image/jpeg')
  })
}
