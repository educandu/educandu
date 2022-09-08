export const preloadImage = async url => {
  if (!url) {
    return;
  }

  const element = window.document.createElement('img');
  element.style.display = 'none';
  element.src = url;

  await new Promise(resolve => {
    element.onloadeddata = () => {
      element.remove();
      resolve();
    };
    element.onerror = () => {
      element.remove();
      resolve();
    };
  });

  window.document.body.appendChild(element);
};
