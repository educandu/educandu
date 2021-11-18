import cloneDeep from '../../utils/clone-deep.js';
import { MEDIA_KIND, MEDIA_TYPE } from './constants.js';

export default {
  type: 'anavis',
  getName: t => t('anavis:name'),
  getDefaultContent: t => ({
    width: 100,
    parts: [
      {
        color: '#4582b4',
        name: t('anavis:defaultPartName'),
        length: 1000,
        annotations: []
      }
    ],
    media: {
      kind: MEDIA_KIND.video,
      type: MEDIA_TYPE.youtube,
      url: '',
      text: '',
      aspectRatio: {
        h: 16,
        v: 9
      }
    }
  }),
  cloneContent: content => cloneDeep(content),
  getCdnResources: content => content.media?.type === MEDIA_TYPE.internal && content.media.url ? [content.media.url] : []
};
