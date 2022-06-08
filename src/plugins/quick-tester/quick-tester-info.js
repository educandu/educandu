import React from 'react';
import { TESTS_ORDER } from './constants.js';
import cloneDeep from '../../utils/clone-deep.js';
import QuickTesterIcon from './quick-tester-icon.js';
import QuickTesterDisplay from './quick-tester-display.js';
import { isAccessibleStoragePath } from '../../utils/storage-utils.js';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';

class QuickTesterInfo {
  static get inject() { return [GithubFlavoredMarkdown]; }

  static get typeName() { return 'quick-tester'; }

  constructor(gfm) {
    this.gfm = gfm;
    this.type = 'quick-tester';
  }

  getName(t) {
    return t('quickTester:name');
  }

  getIcon() {
    return <QuickTesterIcon />;
  }

  getDisplayComponent() {
    return QuickTesterDisplay;
  }

  async resolveEditorComponent() {
    return (await import('./quick-tester-editor.js')).default;
  }

  getDefaultContent(t) {
    return {
      title: `[${t('common:title')}]`,
      teaser: `[${t('quickTester:teaserLabel')}]`,
      tests: [
        {
          question: `[${t('common:question')}]`,
          answer: `[${t('common:answer')}]`
        }
      ],
      testsOrder: TESTS_ORDER.given,
      renderMedia: false
    };
  }

  cloneContent(content) {
    return cloneDeep(content);
  }

  redactContent(content, targetRoomId) {
    const redactedContent = cloneDeep(content);

    redactedContent.title = this.gfm.extractCdnResources(
      redactedContent.title,
      url => isAccessibleStoragePath(url, targetRoomId) ? url : ''
    );

    redactedContent.teaser = this.gfm.extractCdnResources(
      redactedContent.teaser,
      url => isAccessibleStoragePath(url, targetRoomId) ? url : ''
    );

    for (const test of redactedContent.tests) {
      test.question = this.gfm.extractCdnResources(
        test.question,
        url => isAccessibleStoragePath(url, targetRoomId) ? url : ''
      );
      test.answer = this.gfm.extractCdnResources(
        test.answer,
        url => isAccessibleStoragePath(url, targetRoomId) ? url : ''
      );
    }

    return redactedContent;
  }

  getCdnResources(content) {
    const cdnResources = [];

    cdnResources.push(...this.gfm.extractCdnResources(content.title || ''));
    cdnResources.push(...this.gfm.extractCdnResources(content.teaser || ''));

    for (const test of content.tests) {
      cdnResources.push(...this.gfm.extractCdnResources(test.question || ''));
      cdnResources.push(...this.gfm.extractCdnResources(test.answer || ''));
    }

    return [...new Set(cdnResources)];
  }
}

export default QuickTesterInfo;
