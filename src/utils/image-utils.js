export const preloadImage = url => {
  if (!url) {
    return Promise.resolve(false);
  }

  const element = window.document.createElement('img');
  element.style.display = 'none';
  element.src = url;

  const promise = new Promise(resolve => {
    element.onload = () => {
      element.remove();
      resolve(true);
    };
    element.onerror = () => {
      element.remove();
      resolve(false);
    };
  });

  window.document.body.appendChild(element);

  return promise;
};
