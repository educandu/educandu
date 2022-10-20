import joi from 'joi';
import React from 'react';
import cloneDeep from '../../utils/clone-deep.js';
import EarTrainingIcon from './ear-training-icon.js';
import { TESTS_ORDER, TEST_MODE } from './constants.js';
import EarTrainingDisplay from './ear-training-display.js';
import { isInternalSourceType } from '../../utils/source-utils.js';
import { isAccessibleStoragePath } from '../../utils/storage-utils.js';
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
      sourceUrl: '',
      copyrightNotice: ''
    };
  }

  getDefaultSound() {
    return {
      useMidi: false,
      sourceUrl: '',
      copyrightNotice: ''
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

  validateContent(content) {
    const schema = joi.object({
      title: joi.string().allow('').required(),
      width: joi.number().min(0).max(100).required(),
      tests: joi.array().items(joi.object({
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
          useMidi: joi.boolean().required(),
          sourceUrl: joi.string().allow('').required(),
          copyrightNotice: joi.string().allow('').required()
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
      url => isAccessibleStoragePath(url, targetRoomId) ? url : ''
    );

    for (const test of redactedContent.tests) {
      if (test.sound) {
        test.sound.copyrightNotice = this.gfm.redactCdnResources(
          test.sound.copyrightNotice,
          url => isAccessibleStoragePath(url, targetRoomId) ? url : ''
        );
      }
      if (test.questionImage) {
        test.questionImage.copyrightNotice = this.gfm.redactCdnResources(
          test.questionImage.copyrightNotice,
          url => isAccessibleStoragePath(url, targetRoomId) ? url : ''
        );
      }
      if (test.answerImage) {
        test.answerImage.copyrightNotice = this.gfm.redactCdnResources(
          test.answerImage.copyrightNotice,
          url => isAccessibleStoragePath(url, targetRoomId) ? url : ''
        );
      }

      if (!isAccessibleStoragePath(test.sound.sourceUrl, targetRoomId)) {
        test.sound.sourceUrl = '';
      }
      if (!isAccessibleStoragePath(test.questionImage.sourceUrl, targetRoomId)) {
        test.questionImage.sourceUrl = '';
      }
      if (!isAccessibleStoragePath(test.answerImage.sourceUrl, targetRoomId)) {
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
