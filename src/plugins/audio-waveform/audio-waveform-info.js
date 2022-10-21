import joi from 'joi';
import React from 'react';
import { DISPLAY_MODE } from './constants.js';
import cloneDeep from '../../utils/clone-deep.js';
import AudioWaveformIcon from './audio-waveform-icon.js';
import { getDefaultContent } from './audio-waveform-utils.js';
import AudioWaveformDisplay from './audio-waveform-display.js';
import { isInternalSourceType, couldAccessUrlFromRoom } from '../../utils/source-utils.js';

class AudioWaveformInfo {
  static get inject() { return []; }

  static get typeName() { return 'audio-waveform'; }

  constructor() {
    this.type = 'audio-waveform';
  }

  getName(t) {
    return t('audioWaveform:name');
  }

  getIcon() {
    return <AudioWaveformIcon />;
  }

  getDisplayComponent() {
    return AudioWaveformDisplay;
  }

  async resolveEditorComponent() {
    return (await import('./audio-waveform-editor.js')).default;
  }

  getDefaultContent() {
    return getDefaultContent();
  }

  validateContent(content) {
    const schema = joi.object({
      sourceUrl: joi.string().allow('').required(),
      width: joi.number().min(0).max(100).required(),
      displayMode: joi.string().valid(...Object.values(DISPLAY_MODE)).required(),
      interactivityConfig: joi.object({
        penColor: joi.string().required(),
        baselineColor: joi.string().required(),
        backgroundColor: joi.string().required(),
        opacityWhenResolved: joi.number().min(0).max(1).required()
      }).required()
    });

    joi.attempt(content, schema, { abortEarly: false, convert: false, noDefaults: true });
  }

  cloneContent(content) {
    return cloneDeep(content);
  }

  redactContent(content, targetRoomId) {
    const redactedContent = cloneDeep(content);

    if (!couldAccessUrlFromRoom(redactedContent.sourceUrl, targetRoomId)) {
      redactedContent.sourceUrl = '';
    }

    return redactedContent;
  }

  getCdnResources(content) {
    const cdnResources = [];

    if (isInternalSourceType({ url: content.sourceUrl })) {
      cdnResources.push(content.sourceUrl);
    }

    return [...new Set(cdnResources)].filter(cdnResource => cdnResource);
  }
}

export default AudioWaveformInfo;
