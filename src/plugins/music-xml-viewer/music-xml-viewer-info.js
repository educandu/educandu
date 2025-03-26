import joi from 'joi';
import React from 'react';
import cloneDeep from '../../utils/clone-deep.js';
import { PLUGIN_GROUP } from '../../domain/constants.js';
import MusicXmlViewerIcon from './music-xml-viewer-icon.js';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';
import { DEFAULT_ZOOM_VALUE, MAX_ZOOM_VALUE, MIN_ZOOM_VALUE } from './constants.js';
import { isInternalSourceType, couldAccessUrlFromRoom } from '../../utils/source-utils.js';

class MusicXmlViewerInfo {
  static dependencies = [GithubFlavoredMarkdown];

  static typeName = 'music-xml-viewer';

  constructor(gfm) {
    this.gfm = gfm;
  }

  getDisplayName(t) {
    return t('musicXmlViewer:name');
  }

  getIcon() {
    return <MusicXmlViewerIcon />;
  }

  getGroups() {
    return [PLUGIN_GROUP.other];
  }

  async resolveDisplayComponent() {
    return (await import('./music-xml-viewer-display.js')).default;
  }

  async resolveEditorComponent() {
    return (await import('./music-xml-viewer-editor.js')).default;
  }

  getDefaultContent() {
    return {
      sourceUrl: '',
      zoom: DEFAULT_ZOOM_VALUE,
      width: 100,
      caption: ''
    };
  }

  validateContent(content) {
    const schema = joi.object({
      sourceUrl: joi.string().allow('').required(),
      zoom: joi.number().min(MIN_ZOOM_VALUE).max(MAX_ZOOM_VALUE).required(),
      width: joi.number().min(0).max(100).required(),
      caption: joi.string().allow('').required()
    });

    joi.attempt(content, schema, { abortEarly: false, convert: false, noDefaults: true });
  }

  cloneContent(content) {
    return cloneDeep(content);
  }

  redactContent(content, targetRoomId) {
    const redactedContent = cloneDeep(content);

    redactedContent.caption = this.gfm.redactCdnResources(
      redactedContent.caption,
      url => couldAccessUrlFromRoom(url, targetRoomId) ? url : ''
    );

    if (!couldAccessUrlFromRoom(redactedContent.sourceUrl, targetRoomId)) {
      redactedContent.sourceUrl = '';
    }

    return redactedContent;
  }

  getCdnResources(content) {
    const cdnResources = [];

    cdnResources.push(...this.gfm.extractCdnResources(content.caption));

    if (isInternalSourceType({ url: content.sourceUrl })) {
      cdnResources.push(content.sourceUrl);
    }

    return [...new Set(cdnResources)].filter(cdnResource => cdnResource);
  }
}

export default MusicXmlViewerInfo;
