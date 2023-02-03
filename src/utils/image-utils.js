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
