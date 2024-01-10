export const preloadImage = (url, minAcceptedWidth = 0) => {
  if (!url) {
    return Promise.resolve(false);
  }

  const element = new Image();
  element.style.display = 'none';
  element.src = url;

  const promise = new Promise(resolve => {
    element.onload = () => {
      element.remove();
      resolve(element.naturalWidth >= minAcceptedWidth);
    };
    element.onerror = () => {
      element.remove();
      resolve(false);
    };
  });

  window.document.body.appendChild(element);

  return promise;
};

export const drawImageToCanvas = (url, canvas, withCredentials = false) => {
  if (!url) {
    return Promise.resolve(canvas);
  }

  const element = new Image();
  element.crossOrigin = withCredentials ? 'use-credentials' : 'anonymous';
  element.style.display = 'none';
  element.src = url;

  const promise = new Promise(resolve => {
    element.onload = () => {
      const scaleFactor  = Math.min(canvas.width  / element.width, canvas.height / element.height);
      const xOffset = (canvas.width - element.width * scaleFactor) / 2;
      const yOffset = (canvas.height - element.height * scaleFactor) / 2;
      const targetWidth = element.width * scaleFactor;
      const targetHeight = element.height * scaleFactor;
      canvas.getContext('2d').drawImage(element, 0, 0, element.width, element.height, xOffset, yOffset, targetWidth, targetHeight);
      element.remove();
      resolve(canvas);
    };
    element.onerror = () => {
      element.remove();
      resolve(canvas);
    };
  });

  window.document.body.appendChild(element);

  return promise;
};
