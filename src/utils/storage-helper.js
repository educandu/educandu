import { IMAGE_DOWN_SCALING_WIDTH } from '../domain/constants.js';

const getScaledDownDimensions = (img, width) => {
  if (img.naturalWidth <= width) {
    return { width: img.naturalWidth, height: img.naturalHeight };
  }
  const ratio = img.naturalWidth / width;
  return { width, height: Math.round(((img.naturalHeight / ratio) + Number.EPSILON) * 100) / 100 };
};

const scalableFileTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/webp'];

const shouldOptimizeImage = ({ naturalSize, naturalWidth, width }) => {
  const optimize = (naturalWidth > width && (naturalSize > 500 * 1000)) || (naturalSize > 1.5 * 1000 * 1000);
  return optimize;
};

const optimizeImage = ({ file, width }) => {
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
        if (!shouldOptimizeImage({ naturalSize: file.size, naturalWidth: img.naturalWidth, width })) {
          resolve(file);
          return;
        }
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        const size = getScaledDownDimensions(img, width);
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
  return Promise.all(files.map(file => optimizeImage({ file, width: IMAGE_DOWN_SCALING_WIDTH })));
};
