function parseThemeText(stylesText) {
  const stylesTexts = stylesText.split(/<\/style>/).filter(value => value);

  return stylesTexts.reduce((stylesData, styleText) => {
    const groups = (/<style([^>]*)>(.*)/g).exec(styleText);

    const attributePairs = groups[1].split(' ').filter(value => value);
    const attributes = attributePairs.reduce((accu, pair) => {
      const keyValue = pair.replaceAll('"', '').split('=');
      accu[keyValue[0]] = keyValue[1];
      return accu;
    }, {});

    return [...stylesData, { attributes, content: groups[2] }];
  }, []);
}

export default {
  parseThemeText
};
