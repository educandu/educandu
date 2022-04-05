import { IMAGE_DOWN_SCALING_WIDTH } from '../domain/constants.js';

const getScaledDownDimensions = (img, widthThreshold) => {
  if (img.naturalWidth <= widthThreshold) {
    return { width: img.naturalWidth, height: img.naturalHeight };
  }
  const ratio = img.naturalWidth / widthThreshold;
  return { width: widthThreshold, height: Math.round(((img.naturalHeight / ratio) + Number.EPSILON) * 100) / 100 };
};

const scalableFileTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/webp'];

const shouldOptimizeImage = ({ naturalSize, naturalWidth, widthThreshold }) => {
  const optimize = (naturalWidth > widthThreshold && (naturalSize > 500 * 1000)) || (naturalSize > 1.5 * 1000 * 1000);
  return optimize;
};

const optimizeImage = ({ file, widthThreshold }) => {
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
        if (!shouldOptimizeImage({ naturalSize: file.size, naturalWidth: img.naturalWidth, widthThreshold })) {
          resolve(file);
          return;
        }
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        const size = getScaledDownDimensions(img, widthThreshold);
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
  return Promise.all(files.map(file => optimizeImage({ file, widthThreshold: IMAGE_DOWN_SCALING_WIDTH })));
};
