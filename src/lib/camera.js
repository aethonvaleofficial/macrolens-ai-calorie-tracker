import { Camera, CameraResultType, CameraSource, CameraDirection } from '@capacitor/camera';

function normalizePhoto(photo) {
  const format = photo.format || 'jpeg';
  const mimeType = `image/${format}`;

  return {
    base64: photo.base64String,
    mimeType,
    previewUrl: `data:${mimeType};base64,${photo.base64String}`,
  };
}

export async function takeFoodPhoto() {
  const photo = await Camera.getPhoto({
    quality: 75,
    allowEditing: false,
    resultType: CameraResultType.Base64,
    source: CameraSource.Camera,
    direction: CameraDirection.Rear,
    correctOrientation: true,
  });

  return normalizePhoto(photo);
}

export async function chooseFoodPhoto() {
  const photo = await Camera.getPhoto({
    quality: 75,
    allowEditing: false,
    resultType: CameraResultType.Base64,
    source: CameraSource.Photos,
    correctOrientation: true,
  });

  return normalizePhoto(photo);
}
