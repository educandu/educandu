import React from 'react';
import { parse } from 'parse5';
import memoizee from 'memoizee';
import PropTypes from 'prop-types';
import { kebabCaseToCamelCase } from '../../utils/string-utils.js';

const parseElementDefinitions = memoizee(html => {
  const headElem = parse(html).childNodes[0].childNodes[0];
  return headElem.childNodes
    .filter(({ nodeName }) => !nodeName.startsWith('#'))
    .map(({ tagName, attrs }) => {
      const attributes = attrs.reduce((accu, { name, value }) => ({
        ...accu,
        [kebabCaseToCamelCase(name)]: value
      }), {});

      return { tagName, attributes };
    });
});

function PageTemplate({ uiLanguage, title, content, styles, themeStylesData, scripts, additionalHeadHtml }) {
  const additionalHeadElementDefinitions = parseElementDefinitions(additionalHeadHtml);

  const additionalHeadElements = additionalHeadElementDefinitions.map((elem, index) => {
    return React.createElement(elem.tagName, { key: index.toString(), ...elem.attributes });
  });

  const styleElements = styles.map((style, index) => {
    return style.href
      ? (<link key={index.toString()} rel="stylesheet" href={style.href} />)
      : (<style key={index.toString()} dangerouslySetInnerHTML={{ __html: style.content }} />);
  });

  const themeStyleElements = themeStylesData.map((styleData, index) => {
    return <style key={`theme-${index}`} {...styleData.attributes} dangerouslySetInnerHTML={{ __html: styleData.content }} />;
  });

  const scriptElements = scripts.map((script, index) => {
    return script.src
      ? (<script key={index.toString()} type="module" src={script.src} />)
      : (<script key={index.toString()} type="module" dangerouslySetInnerHTML={{ __html: script.content }} />);
  });

  return (
    <html language={uiLanguage}>
      <head>
        <title>{ title }</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="height=device-height, width=device-width, initial-scale=1.0, minimum-scale=1.0" />
        {additionalHeadElements}
        {styleElements}
        {themeStyleElements}
      </head>
      <body>
        <div id="root" dangerouslySetInnerHTML={{ __html: content }} />
        {scriptElements}
      </body>
    </html>
  );
}

PageTemplate.propTypes = {
  additionalHeadHtml: PropTypes.string,
  content: PropTypes.string.isRequired,
  scripts: PropTypes.array,
  styles: PropTypes.array,
  themeStylesData: PropTypes.arrayOf(PropTypes.shape({
    attributes: PropTypes.object.isRequired,
    content: PropTypes.string.isRequired
  })).isRequired,
  title: PropTypes.string.isRequired,
  uiLanguage: PropTypes.string.isRequired
};

PageTemplate.defaultProps = {
  additionalHeadHtml: '',
  scripts: [],
  styles: []
};

export default PageTemplate;
