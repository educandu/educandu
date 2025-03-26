import React from 'react';
import CatalogIcon from './catalog-icon.js';
import cloneDeep from '../../utils/clone-deep.js';
import { PLUGIN_GROUP } from '../../domain/constants.js';
import { createDefaultContent, validateContent } from './catalog-utils.js';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';
import { isInternalSourceType, couldAccessUrlFromRoom } from '../../utils/source-utils.js';

export default class Catalog {
  static dependencies = [GithubFlavoredMarkdown];

  static typeName = 'catalog';

  constructor(gfm) {
    this.gfm = gfm;
  }

  getDisplayName(t) {
    return t('catalog:name');
  }

  getIcon() {
    return <CatalogIcon />;
  }

  getGroups() {
    return [PLUGIN_GROUP.textImage];
  }

  async resolveDisplayComponent() {
    return (await import('./catalog-display.js')).default;
  }

  async resolveEditorComponent() {
    return (await import('./catalog-editor.js')).default;
  }

  getDefaultContent() {
    return createDefaultContent();
  }

  validateContent(content) {
    validateContent(content);
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

    for (const item of redactedContent.items) {
      item.title = this.gfm.redactCdnResources(
        item.title,
        url => couldAccessUrlFromRoom(url, targetRoomId) ? url : ''
      );
      item.link.description = this.gfm.redactCdnResources(
        item.link.description,
        url => couldAccessUrlFromRoom(url, targetRoomId) ? url : ''
      );

      if (!couldAccessUrlFromRoom(item.image.sourceUrl, targetRoomId)) {
        item.image.sourceUrl = '';
      }
      if (!couldAccessUrlFromRoom(item.link.sourceUrl, targetRoomId)) {
        item.link.sourceUrl = '';
      }
    }

    return redactedContent;
  }

  getCdnResources(content) {
    const cdnResources = [];

    cdnResources.push(...this.gfm.extractCdnResources(content.title));

    for (const item of content.items) {
      cdnResources.push(...this.gfm.extractCdnResources(item.title));
      cdnResources.push(...this.gfm.extractCdnResources(item.link.description));

      if (isInternalSourceType({ url: item.image.sourceUrl })) {
        cdnResources.push(item.image.sourceUrl);
      }
      if (isInternalSourceType({ url: item.link.sourceUrl })) {
        cdnResources.push(item.link.sourceUrl);
      }
    }

    return [...new Set(cdnResources)].filter(cdnResource => cdnResource);
  }
}
