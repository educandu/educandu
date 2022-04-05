import {
  IMAGE_OPTIMIZATION_THRESHOLD_WIDTH,
  IMAGE_OPTIMIZATION_MAX_SIZE_OVER_THRESHOLD_WIDTH_IN_BYTES,
  IMAGE_OPTIMIZATION_MAX_SIZE_UNDER_THRESHOLD_WIDTH_IN_BYTES
} from '../domain/constants.js';

const getScaledDownDimensions = img => {
  if (img.naturalWidth <= IMAGE_OPTIMIZATION_THRESHOLD_WIDTH) {
    return { width: img.naturalWidth, height: img.naturalHeight };
  }

  const ratio = img.naturalWidth / IMAGE_OPTIMIZATION_THRESHOLD_WIDTH;
  return { width: IMAGE_OPTIMIZATION_THRESHOLD_WIDTH, height: Math.round(((img.naturalHeight / ratio) + Number.EPSILON) * 100) / 100 };
};

const scalableFileTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/webp'];

const shouldOptimizeImage = ({ naturalSize, naturalWidth }) => {
  const widthIsTooBig = naturalWidth > IMAGE_OPTIMIZATION_THRESHOLD_WIDTH && naturalSize > IMAGE_OPTIMIZATION_MAX_SIZE_OVER_THRESHOLD_WIDTH_IN_BYTES;
  const sizeIsTooBig = naturalSize > IMAGE_OPTIMIZATION_MAX_SIZE_UNDER_THRESHOLD_WIDTH_IN_BYTES;

  return widthIsTooBig || sizeIsTooBig;
};

const optimizeImage = file => {
  if (!scalableFileTypes.includes(file.type)) {
    return file;
  }

  return new Promise(resolve => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = () => {
      const img = new Image();
      img.src = reader.result;
      img.onload = () => {
        if (!shouldOptimizeImage({ naturalSize: file.size, naturalWidth: img.naturalWidth })) {
          resolve(file);
          return;
        }
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        const size = getScaledDownDimensions(img);
        canvas.width = size.width;
        canvas.height = size.height;
        context.drawImage(img, 0, 0, size.width, size.height);

        canvas.toBlob(blob => {
          const processedFile = new File([blob], file.name);
          resolve(processedFile);
        }, file.type, 0.5);
      };
    };
  });
};

export const processFilesBeforeUpload = ({ files, optimizeImages }) => {
  if (!optimizeImages) {
    return files;
  }
  return Promise.all(files.map(file => optimizeImage(file)));
};
