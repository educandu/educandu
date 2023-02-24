import joi from 'joi';
import React from 'react';
import VideoIcon from './video-icon.js';
import cloneDeep from '../../utils/clone-deep.js';
import { MEDIA_ASPECT_RATIO } from '../../domain/constants.js';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';
import { isInternalSourceType, couldAccessUrlFromRoom } from '../../utils/source-utils.js';

class VideoInfo {
  static dependencies = [GithubFlavoredMarkdown];

  static typeName = 'video';

  constructor(gfm) {
    this.gfm = gfm;
  }

  getDisplayName(t) {
    return t('video:name');
  }

  getIcon() {
    return <VideoIcon />;
  }

  async resolveDisplayComponent() {
    return (await import('./video-display.js')).default;
  }

  async resolveEditorComponent() {
    return (await import('./video-editor.js')).default;
  }

  getDefaultContent() {
    return {
      sourceUrl: '',
      copyrightNotice: '',
      width: 100,
      aspectRatio: MEDIA_ASPECT_RATIO.sixteenToNine,
      posterImage: {
        sourceUrl: ''
      },
      playbackRange: [0, 1],
      initialVolume: 1
    };
  }

  validateContent(content) {
    const schema = joi.object({
      sourceUrl: joi.string().allow('').required(),
      copyrightNotice: joi.string().allow('').required(),
      width: joi.number().min(0).max(100).required(),
      aspectRatio: joi.string().valid(...Object.values(MEDIA_ASPECT_RATIO)).required(),
      posterImage: joi.object({
        sourceUrl: joi.string().allow('').required()
      }).required(),
      playbackRange: joi.array().items(joi.number().min(0).max(1)).required(),
      initialVolume: joi.number().min(0).max(1).required()
    });

    joi.attempt(content, schema, { abortEarly: false, convert: false, noDefaults: true });
  }

  cloneContent(content) {
    return cloneDeep(content);
  }

  redactContent(content, targetRoomId) {
    const redactedContent = cloneDeep(content);

    redactedContent.copyrightNotice = this.gfm.redactCdnResources(
      redactedContent.copyrightNotice,
      url => couldAccessUrlFromRoom(url, targetRoomId) ? url : ''
    );

    if (!couldAccessUrlFromRoom(redactedContent.sourceUrl, targetRoomId)) {
      redactedContent.sourceUrl = '';
    }

    if (!couldAccessUrlFromRoom(redactedContent.posterImage.sourceUrl, targetRoomId)) {
      redactedContent.posterImage.sourceUrl = '';
    }

    return redactedContent;
  }

  getCdnResources(content) {
    const cdnResources = [];

    cdnResources.push(...this.gfm.extractCdnResources(content.copyrightNotice));

    if (isInternalSourceType({ url: content.sourceUrl })) {
      cdnResources.push(content.sourceUrl);
    }

    if (isInternalSourceType({ url: content.posterImage.sourceUrl })) {
      cdnResources.push(content.posterImage.sourceUrl);
    }

    return [...new Set(cdnResources)].filter(cdnResource => cdnResource);
  }
}

export default VideoInfo;
