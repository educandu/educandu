import joi from 'joi';
import React from 'react';
import cloneDeep from '../../utils/clone-deep.js';
import WhiteboardIcon from './whiteboard-icon.js';
import { OPTIMAL_VIEWPORT_WIDTH_FACTOR } from './constants.js';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';
import { EXTENDED_ASPECT_RATIO, PLUGIN_GROUP } from '../../domain/constants.js';
import { couldAccessUrlFromRoom, isInternalSourceType } from '../../utils/source-utils.js';

class WhiteboardInfo {
  static dependencies = [GithubFlavoredMarkdown];

  static typeName = 'whiteboard';

  allowsInput = true;

  constructor(gfm) {
    this.gfm = gfm;
  }

  getDisplayName(t) {
    return t('whiteboard:name');
  }

  getIcon() {
    return <WhiteboardIcon />;
  }

  getGroups() {
    return [PLUGIN_GROUP.userInput];
  }

  async resolveDisplayComponent() {
    return (await import('./whiteboard-display.js')).default;
  }

  async resolveEditorComponent() {
    return (await import('./whiteboard-editor.js')).default;
  }

  getDefaultContent() {
    const defaultWidth = 100;
    return {
      label: '',
      width: defaultWidth,
      viewportWidth: defaultWidth * OPTIMAL_VIEWPORT_WIDTH_FACTOR,
      aspectRatio: EXTENDED_ASPECT_RATIO.sixteenToNine,
      image: {
        sourceUrl: '',
        copyrightNotice: ''
      },
      isBorderVisible: true
    };
  }

  validateContent(content) {
    const schema = joi.object({
      label: joi.string().allow('').required(),
      width: joi.number().integer().min(0).max(100).required(),
      viewportWidth: joi.number().min(0).max(1000).required(),
      aspectRatio: joi.string().valid(...Object.values(EXTENDED_ASPECT_RATIO)).required(),
      image: joi.object({
        sourceUrl: joi.string().allow('').required(),
        copyrightNotice: joi.string().allow('').required()
      }).required(),
      isBorderVisible: joi.boolean().required()
    });

    joi.attempt(content, schema, { abortEarly: false, convert: false, noDefaults: true });
  }

  cloneContent(content) {
    return cloneDeep(content);
  }

  redactContent(content, targetRoomId) {
    const redactedContent = cloneDeep(content);

    redactedContent.label = this.gfm.redactCdnResources(
      redactedContent.label,
      url => couldAccessUrlFromRoom(url, targetRoomId) ? url : ''
    );

    redactedContent.image.copyrightNotice = this.gfm.redactCdnResources(
      redactedContent.image.copyrightNotice,
      url => couldAccessUrlFromRoom(url, targetRoomId) ? url : ''
    );

    if (!couldAccessUrlFromRoom(redactedContent.image.sourceUrl, targetRoomId)) {
      redactedContent.image.sourceUrl = '';
    }

    return redactedContent;
  }

  getCdnResources(content) {
    const cdnResources = [];

    cdnResources.push(...this.gfm.extractCdnResources(content.label));
    cdnResources.push(...this.gfm.extractCdnResources(content.image.copyrightNotice));

    if (isInternalSourceType({ url: content.image.sourceUrl })) {
      cdnResources.push(content.image.sourceUrl);
    }

    return [...new Set(cdnResources)].filter(cdnResource => cdnResource);
  }
}

export default WhiteboardInfo;
