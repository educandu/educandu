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

  getDefaultImage() {
    return {
      sourceType: IMAGE_SOURCE_TYPE.internal,
      sourceUrl: null,
      text: null
    };
  }

  getDefaultSound() {
    return {
      sourceType: SOUND_SOURCE_TYPE.internal,
      sourceUrl: null,
      text: null
    };
  }

  getDefaultTest() {
    return {
      mode: TEST_MODE.image,
      questionImage: this.getDefaultImage(),
      answerImage: this.getDefaultImage(),
      questionAbcCode: '',
      answerAbcCode: '',
      sound: this.getDefaultSound()
    };
  }

  getDefaultContent(t) {
    return {
      title: `[${t('common:title')}]`,
      width: 100,
      tests: [this.getDefaultTest()],
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
      if (test.questionImage) {
        test.questionImage.text = this.gfm.redactCdnResources(
          test.questionImage.text,
          url => isAccessibleStoragePath(url, targetRoomId) ? url : ''
        );
      }
      if (test.answerImage) {
        test.answerImage.text = this.gfm.redactCdnResources(
          test.answerImage.text,
          url => isAccessibleStoragePath(url, targetRoomId) ? url : ''
        );
      }

      if (test.sound?.sourceType === SOUND_SOURCE_TYPE.internal && !isAccessibleStoragePath(test.sound.sourceUrl, targetRoomId)) {
        test.sound.sourceUrl = '';
      }
      if (test.questionImage?.sourceType === IMAGE_SOURCE_TYPE.internal && !isAccessibleStoragePath(test.questionImage.sourceUrl, targetRoomId)) {
        test.questionImage.sourceUrl = '';
      }
      if (test.answerImage?.sourceType === IMAGE_SOURCE_TYPE.internal && !isAccessibleStoragePath(test.answerImage.sourceUrl, targetRoomId)) {
        test.answerImage.sourceUrl = '';
      }
    }

    return redactedContent;
  }

  getCdnResources(content) {
    const cdnResources = [];

    cdnResources.push(...this.gfm.extractCdnResources(content.title || ''));

    for (const test of content.tests) {
      cdnResources.push(...this.gfm.extractCdnResources(test.sound?.text || ''));
      cdnResources.push(...this.gfm.extractCdnResources(test.questionImage?.text || ''));
      cdnResources.push(...this.gfm.extractCdnResources(test.answerImage?.text || ''));

      if (test.sound?.sourceType === SOUND_SOURCE_TYPE.internal && test.sound.sourceUrl) {
        cdnResources.push(test.sound.sourceUrl);
      }
      if (test.questionImage?.sourceType === IMAGE_SOURCE_TYPE.internal && test.questionImage.sourceUrl) {
        cdnResources.push(test.questionImage.sourceUrl);
      }
      if (test.answerImage?.sourceType === IMAGE_SOURCE_TYPE.internal && test.answerImage.sourceUrl) {
        cdnResources.push(test.answerImage.sourceUrl);
      }
    }

    return cdnResources;
  }
}

export default EarTrainingInfo;
