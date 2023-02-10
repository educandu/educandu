import joi from 'joi';
import React from 'react';
import uniqueId from '../../utils/unique-id.js';
import cloneDeep from '../../utils/clone-deep.js';
import EarTrainingIcon from './ear-training-icon.js';
import { TESTS_ORDER, TEST_MODE } from './constants.js';
import EarTrainingDisplay from './ear-training-display.js';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';
import { isInternalSourceType, couldAccessUrlFromRoom } from '../../utils/source-utils.js';

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
      sourceUrl: '',
      copyrightNotice: ''
    };
  }

  getDefaultSound() {
    return {
      sourceUrl: '',
      copyrightNotice: '',
      playbackRange: [0, 1],
      initialVolume: 1
    };
  }

  getDefaultTest() {
    return {
      key: uniqueId.create(),
      mode: TEST_MODE.image,
      questionImage: this.getDefaultImage(),
      answerImage: this.getDefaultImage(),
      questionAbcCode: '',
      answerAbcCode: '',
      sound: this.getDefaultSound()
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
        mode: joi.string().valid(...Object.values(TEST_MODE)).required(),
        questionImage: joi.alternatives().try(
          joi.object({
            sourceUrl: joi.string().allow('').required(),
            copyrightNotice: joi.string().allow('').required()
          }),
          joi.any().valid(null)
        ).required(),
        answerImage: joi.alternatives().try(
          joi.object({
            sourceUrl: joi.string().allow('').required(),
            copyrightNotice: joi.string().allow('').required()
          }),
          joi.any().valid(null)
        ).required(),
        questionAbcCode: joi.string().allow('').required(),
        answerAbcCode: joi.string().allow('').required(),
        sound: joi.object({
          sourceUrl: joi.string().allow('').required(),
          copyrightNotice: joi.string().allow('').required(),
          playbackRange: joi.array().items(joi.number().min(0).max(1)).required(),
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
      if (test.sound) {
        test.sound.copyrightNotice = this.gfm.redactCdnResources(
          test.sound.copyrightNotice,
          url => couldAccessUrlFromRoom(url, targetRoomId) ? url : ''
        );
      }
      if (test.questionImage) {
        test.questionImage.copyrightNotice = this.gfm.redactCdnResources(
          test.questionImage.copyrightNotice,
          url => couldAccessUrlFromRoom(url, targetRoomId) ? url : ''
        );
      }
      if (test.answerImage) {
        test.answerImage.copyrightNotice = this.gfm.redactCdnResources(
          test.answerImage.copyrightNotice,
          url => couldAccessUrlFromRoom(url, targetRoomId) ? url : ''
        );
      }

      if (!couldAccessUrlFromRoom(test.sound.sourceUrl, targetRoomId)) {
        test.sound.sourceUrl = '';
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
      cdnResources.push(...this.gfm.extractCdnResources(test.sound.copyrightNotice));
      cdnResources.push(...this.gfm.extractCdnResources(test.questionImage.copyrightNotice));
      cdnResources.push(...this.gfm.extractCdnResources(test.answerImage.copyrightNotice));

      if (isInternalSourceType({ url: test.sound.sourceUrl })) {
        cdnResources.push(test.sound.sourceUrl);
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
