import React from 'react';
import ImageIcon from './image-icon.js';
import ImageDisplay from './image-display.js';
import cloneDeep from '../../utils/clone-deep.js';
import { IMAGE_SOURCE_TYPE } from '../../domain/constants.js';
import { isAccessibleStoragePath } from '../../utils/storage-utils.js';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';

class ImageInfo {
  static get inject() { return [GithubFlavoredMarkdown]; }

  static get typeName() { return 'image'; }

  constructor(gfm) {
    this.gfm = gfm;
    this.type = 'image';
  }

  getName(t) {
    return t('image:name');
  }

  getIcon() {
    return <ImageIcon />;
  }

  getDisplayComponent() {
    return ImageDisplay;
  }

  async resolveEditorComponent() {
    return (await import('./image-editor.js')).default;
  }

  getDefaultContent() {
    return {
      sourceType: IMAGE_SOURCE_TYPE.internal,
      sourceUrl: '',
      width: 100,
      copyrightNotice: '',
      effect: null
    };
  }

  cloneContent(content) {
    return cloneDeep(content);
  }

  redactContent(content, targetRoomId) {
    const redactedContent = cloneDeep(content);

    redactedContent.copyrightNotice = this.gfm.redactCdnResources(
      redactedContent.copyrightNotice,
      url => isAccessibleStoragePath(url, targetRoomId) ? url : ''
    );

    if (redactedContent.effect) {
      redactedContent.effect.copyrightNotice = this.gfm.redactCdnResources(
        redactedContent.effect.copyrightNotice,
        url => isAccessibleStoragePath(url, targetRoomId) ? url : ''
      );
    }

    if (redactedContent.sourceType === IMAGE_SOURCE_TYPE.internal && !isAccessibleStoragePath(redactedContent.sourceUrl, targetRoomId)) {
      redactedContent.sourceUrl = '';
    }

    if (redactedContent.effect?.sourceType === IMAGE_SOURCE_TYPE.internal && !isAccessibleStoragePath(redactedContent.effect.sourceUrl, targetRoomId)) {
      redactedContent.effect.sourceUrl = '';
    }

    return redactedContent;
  }

  getCdnResources(content) {
    const cdnResources = [];

    cdnResources.push(...this.gfm.extractCdnResources(content.copyrightNotice));
    cdnResources.push(...this.gfm.extractCdnResources(content.effect?.copyrightNotice));

    if (content.sourceType === IMAGE_SOURCE_TYPE.internal && content.sourceUrl) {
      cdnResources.push(content.sourceUrl);
    }
    if (content.effect?.sourceType === IMAGE_SOURCE_TYPE.internal && content.effect.sourceUrl) {
      cdnResources.push(content.effect.sourceUrl);
    }
    return [...new Set(cdnResources)].filter(cdnResource => cdnResource);
  }
}

export default ImageInfo;
