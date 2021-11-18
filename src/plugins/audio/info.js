import { SOURCE_TYPE } from './constants.js';
import cloneDeep from '../../utils/clone-deep.js';

export default {
  type: 'audio',
  getName: t => t('audio:name'),
  getDefaultContent: () => ({
    type: SOURCE_TYPE.internal,
    url: '',
    text: ''
  }),
  cloneContent: content => cloneDeep(content),
  getCdnResources: content => content.type === SOURCE_TYPE.internal && content.url ? [content.url] : []
};
