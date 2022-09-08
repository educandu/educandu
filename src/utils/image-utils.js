import ReactDOM from 'react-dom';

export const preloadImage = async url => {
  if (!url) {
    return;
  }

  const element = window.document.createElement('img');
  element.style.display = 'none';
  element.src = url;

  await new Promise(resolve => {
    element.onloadeddata = () => {
      ReactDOM.unmountComponentAtNode(element);
      element.remove();
      resolve();
    };
    element.onerror = () => {
      ReactDOM.unmountComponentAtNode(element);
      element.remove();
      resolve();
    };
  });

  window.document.body.appendChild(element);
};
