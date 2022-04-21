import React from 'react';
import cloneDeep from '../../utils/clone-deep.js';
import EarTrainingIcon from './ear-training-icon.js';
import { SOURCE_TYPE, TESTS_ORDER } from './constants.js';
import EarTrainingDisplay from './ear-training-display.js';
import { isAccessibleStoragePath } from '../../ui/path-helper.js';
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
      maxWidth: 100,
      tests: [
        {
          startAbcCode: 'X:1',
          fullAbcCode: 'X:1',
          sound: {
            sourceType: SOURCE_TYPE.midi,
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

      if (test.sound?.sourceType === SOURCE_TYPE.internal && !isAccessibleStoragePath(test.sound.sourceUrl, targetRoomId)) {
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

      if (test.sound?.sourceType === SOURCE_TYPE.internal && test.sound.sourceUrl) {
        cdnResources.push(test.sound.sourceUrl);
      }
    }

    return cdnResources;
  }
}

export default EarTrainingInfo;
