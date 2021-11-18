import { SOURCE_TYPE } from './constants.js';
import cloneDeep from '../../utils/clone-deep.js';

export default {
  type: 'video',
  getName: t => t('video:name'),
  getDefaultContent: () => ({
    type: SOURCE_TYPE.internal,
    url: '',
    text: '',
    width: 100,
    aspectRatio: {
      h: 16,
      v: 9
    },
    showVideo: true
  }),
  cloneContent: content => cloneDeep(content),
  getCdnResources: content => content.type === SOURCE_TYPE.internal && content.url ? [content.url] : []
};
