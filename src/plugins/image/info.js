import { SOURCE_TYPE } from './constants.js';
import cloneDeep from '../../utils/clone-deep.js';

export default {
  type: 'image',
  getName: t => t('image:name'),
  getDefaultContent: () => ({
    sourceType: SOURCE_TYPE.internal,
    sourceUrl: '',
    maxWidth: 100,
    text: '',
    effect: null
  }),
  cloneContent: content => cloneDeep(content),
  getCdnResources: content => {
    const resources = [];
    if (content.sourceType === SOURCE_TYPE.internal && content.sourceUrl) {
      resources.push(content.sourceUrl);
    }
    if (content.effect?.sourceType === SOURCE_TYPE.internal && content.effect.sourceUrl) {
      resources.push(content.effect.sourceUrl);
    }
    return resources;
  }
};
