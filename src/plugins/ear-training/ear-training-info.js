import joi from 'joi';
import React from 'react';
import uniqueId from '../../utils/unique-id.js';
import cloneDeep from '../../utils/clone-deep.js';
import EarTrainingIcon from './ear-training-icon.js';
import { SOUND_MODE, TESTS_ORDER, TEST_MODE } from './constants.js';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';
import { isInternalSourceType, couldAccessUrlFromRoom } from '../../utils/source-utils.js';

class EarTrainingInfo {
  static dependencies = [GithubFlavoredMarkdown];

  static typeName = 'ear-training';

  constructor(gfm) {
    this.gfm = gfm;
  }

  getDisplayName(t) {
    return t('earTraining:name');
  }

  getIcon() {
    return <EarTrainingIcon />;
  }

  async resolveDisplayComponent() {
    return (await import('./ear-training-display.js')).default;
  }

  async resolveEditorComponent() {
    return (await import('./ear-training-editor.js')).default;
  }

  getDefaultImage() {
    return {
      sourceUrl: '',
      copyrightNotice: ''
    };
  }

  getDefaultSourceSound() {
    return {
      sourceUrl: '',
      copyrightNotice: '',
      playbackRange: [0, 1],
      initialVolume: 1
    };
  }

  getDefaultAbcMidiSound() {
    return {
      initialVolume: 1
    };
  }

  getDefaultTest() {
    return {
      key: uniqueId.create(),
      testMode: TEST_MODE.image,
      questionImage: this.getDefaultImage(),
      answerImage: this.getDefaultImage(),
      questionAbcCode: '',
      answerAbcCode: '',
      soundMode: SOUND_MODE.source,
      sourceSound: this.getDefaultSourceSound(),
      abcMidiSound: this.getDefaultAbcMidiSound()
    };
  }

  getDefaultContent() {
    return {
      title: '',
      width: 100,
      tests: [this.getDefaultTest()],
      testsOrder: TESTS_ORDER.given
    };
  }

  validateContent(content) {
    const schema = joi.object({
      title: joi.string().allow('').required(),
      width: joi.number().min(0).max(100).required(),
      tests: joi.array().items(joi.object({
        key: joi.string().required(),
        testMode: joi.string().valid(...Object.values(TEST_MODE)).required(),
        questionImage: joi.object({
          sourceUrl: joi.string().allow('').required(),
          copyrightNotice: joi.string().allow('').required()
        }).required(),
        answerImage: joi.object({
          sourceUrl: joi.string().allow('').required(),
          copyrightNotice: joi.string().allow('').required()
        }).required(),
        questionAbcCode: joi.string().allow('').required(),
        answerAbcCode: joi.string().allow('').required(),
        soundMode: joi.string().valid(...Object.values(SOUND_MODE)).required(),
        sourceSound: joi.object({
          sourceUrl: joi.string().allow('').required(),
          copyrightNotice: joi.string().allow('').required(),
          playbackRange: joi.array().items(joi.number().min(0).max(1)).required(),
          initialVolume: joi.number().min(0).max(1).required()
        }).required(),
        abcMidiSound: joi.object({
          initialVolume: joi.number().min(0).max(1).required()
        }).required()
      })).required(),
      testsOrder: joi.string().valid(...Object.values(TESTS_ORDER)).required()
    });

    joi.attempt(content, schema, { abortEarly: false, convert: false, noDefaults: true });
  }

  cloneContent(content) {
    return cloneDeep(content);
  }

  redactContent(content, targetRoomId) {
    const redactedContent = cloneDeep(content);

    redactedContent.title = this.gfm.redactCdnResources(
      redactedContent.title,
      url => couldAccessUrlFromRoom(url, targetRoomId) ? url : ''
    );

    for (const test of redactedContent.tests) {
      test.sourceSound.copyrightNotice = this.gfm.redactCdnResources(
        test.sourceSound.copyrightNotice,
        url => couldAccessUrlFromRoom(url, targetRoomId) ? url : ''
      );
      test.questionImage.copyrightNotice = this.gfm.redactCdnResources(
        test.questionImage.copyrightNotice,
        url => couldAccessUrlFromRoom(url, targetRoomId) ? url : ''
      );
      test.answerImage.copyrightNotice = this.gfm.redactCdnResources(
        test.answerImage.copyrightNotice,
        url => couldAccessUrlFromRoom(url, targetRoomId) ? url : ''
      );

      if (!couldAccessUrlFromRoom(test.sourceSound.sourceUrl, targetRoomId)) {
        test.sourceSound.sourceUrl = '';
      }
      if (!couldAccessUrlFromRoom(test.questionImage.sourceUrl, targetRoomId)) {
        test.questionImage.sourceUrl = '';
      }
      if (!couldAccessUrlFromRoom(test.answerImage.sourceUrl, targetRoomId)) {
        test.answerImage.sourceUrl = '';
      }
    }

    return redactedContent;
  }

  getCdnResources(content) {
    const cdnResources = [];

    cdnResources.push(...this.gfm.extractCdnResources(content.title));

    for (const test of content.tests) {
      cdnResources.push(...this.gfm.extractCdnResources(test.sourceSound.copyrightNotice));
      cdnResources.push(...this.gfm.extractCdnResources(test.questionImage.copyrightNotice));
      cdnResources.push(...this.gfm.extractCdnResources(test.answerImage.copyrightNotice));

      if (isInternalSourceType({ url: test.sourceSound.sourceUrl })) {
        cdnResources.push(test.sourceSound.sourceUrl);
      }
      if (isInternalSourceType({ url: test.questionImage.sourceUrl })) {
        cdnResources.push(test.questionImage.sourceUrl);
      }
      if (isInternalSourceType({ url: test.answerImage.sourceUrl })) {
        cdnResources.push(test.answerImage.sourceUrl);
      }
    }
    return [...new Set(cdnResources)].filter(cdnResource => cdnResource);
  }
}

export default EarTrainingInfo;
