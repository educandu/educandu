import React from 'react';
import cloneDeep from '../../utils/clone-deep.js';
import EarTrainingIcon from './ear-training-icon.js';
import EarTrainingDisplay from './ear-training-display.js';
import { IMAGE_SOURCE_TYPE } from '../../domain/constants.js';
import { isAccessibleStoragePath } from '../../utils/storage-utils.js';
import { SOUND_SOURCE_TYPE, TESTS_ORDER, TEST_MODE } from './constants.js';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';

class EarTrainingInfo {
  static get inject() { return [GithubFlavoredMarkdown]; }

  static get typeName() { return 'ear-training'; }

  constructor(gfm) {
    this.gfm = gfm;
    this.type = 'ear-training';
  }

  getName(t) {
    return t('earTraining:name');
  }

  getIcon() {
    return <EarTrainingIcon />;
  }

  getDisplayComponent() {
    return EarTrainingDisplay;
  }

  async resolveEditorComponent() {
    return (await import('./ear-training-editor.js')).default;
  }

  getDefaultContent(t) {
    return {
      title: `[${t('common:title')}]`,
      width: 100,
      tests: [
        {
          mode: TEST_MODE.image,
          questionImage: {
            sourceType: IMAGE_SOURCE_TYPE.internal,
            sourceUrl: null,
            text: null
          },
          answerImage: {
            sourceType: IMAGE_SOURCE_TYPE.internal,
            sourceUrl: null,
            text: null
          },
          questionAbcCode: '',
          answerAbcCode: '',
          sound: {
            sourceType: SOUND_SOURCE_TYPE.midi,
            sourceUrl: null,
            text: null
          }
        }
      ],
      testsOrder: TESTS_ORDER.given
    };
  }

  cloneContent(content) {
    return cloneDeep(content);
  }

  redactContent(content, targetRoomId) {
    const redactedContent = cloneDeep(content);

    redactedContent.title = this.gfm.redactCdnResources(
      redactedContent.title,
      url => isAccessibleStoragePath(url, targetRoomId) ? url : ''
    );

    for (const test of redactedContent.tests) {
      if (test.sound) {
        test.sound.text = this.gfm.redactCdnResources(
          test.sound.text,
          url => isAccessibleStoragePath(url, targetRoomId) ? url : ''
        );
      }

      if (test.sound?.sourceType === SOUND_SOURCE_TYPE.internal && !isAccessibleStoragePath(test.sound.sourceUrl, targetRoomId)) {
        test.sound.sourceUrl = '';
      }
    }

    return redactedContent;
  }

  getCdnResources(content) {
    const cdnResources = [];

    cdnResources.push(...this.gfm.extractCdnResources(content.title || ''));

    for (const test of content.tests) {
      cdnResources.push(...this.gfm.extractCdnResources(test.text || ''));

      if (test.sound?.sourceType === SOUND_SOURCE_TYPE.internal && test.sound.sourceUrl) {
        cdnResources.push(test.sound.sourceUrl);
      }
    }

    return cdnResources;
  }
}

export default EarTrainingInfo;
