import { IMAGE_DOWN_SCALING_WIDTH } from '../domain/constants.js';

const getScaledDimensions = (img, width) => {
  const ratio = img.naturalWidth / width;
  return { width, height: Math.round(((img.naturalHeight / ratio) + Number.EPSILON) * 100) / 100 };
};

const isImage = file => file && file.type.startsWith('image');

const scaleDownImage = ({ file, width }) => {
  if (!isImage(file)) {
    return file;
  }

  return new Promise(resolve => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = () => {
      const img = new Image();
      img.src = reader.result;
      img.onload = () => {
        if (img.naturalWidth <= width) {
          resolve(file);
          return;
        }
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        const size = getScaledDimensions(img, width);
        canvas.width = size.width;
        canvas.height = size.height;
        context.drawImage(img, 0, 0, size.width, size.height);

        canvas.toBlob(blob => {
          const processedFile = new File([blob], file.name);
          resolve(processedFile);
        }, file.type, 1);
      };
    };
  });
};

export const processFilesBeforeUpload = ({ files, scaleDownImages }) => {
  if (!scaleDownImages) {
    return files;
  }
  return Promise.all(files.map(file => scaleDownImage({ file, width: IMAGE_DOWN_SCALING_WIDTH })));
};
