import React from 'react';
import memoizee from 'memoizee';
import ReactDOM from 'react-dom';
import reactPlayerNs from 'react-player';
import { getResourceType } from './resource-utils.js';
import { RESOURCE_TYPE } from '../domain/constants.js';
import validation, { URL_VALIDATION_STATUS } from '../ui/validation.js';
import { getAccessibleUrl, isInternalSourceType } from './source-utils.js';

const ReactPlayer = reactPlayerNs.default || reactPlayerNs;

const MEDIA_TIMEOUT_IN_MS = 5000;

export function analyzeMediaUrl(url) {
  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    parsedUrl = null;
  }

  if (parsedUrl?.origin === 'https://www.youtube.com' && parsedUrl?.pathname === '/watch' && parsedUrl?.searchParams.has('v')) {
    const videoId = parsedUrl.searchParams.get('v');
    const startSecond = Number.parseInt(parsedUrl.searchParams.get('start'), 10);
    const endSecond = Number.parseInt(parsedUrl.searchParams.get('end'), 10);

    return {
      sanitizedUrl: `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`,
      isYoutube: true,
      startTimecode: Number.isInteger(startSecond) ? startSecond * 1000 : null,
      stopTimecode: Number.isInteger(endSecond) ? endSecond * 1000 : null,
      resourceType: RESOURCE_TYPE.video
    };
  }

  if (parsedUrl?.origin === 'https://youtu.be' && parsedUrl?.pathname && !parsedUrl?.pathname.slice(1).includes('/')) {
    const videoId = parsedUrl.pathname.slice(1);
    const startSecond = Number.parseInt(parsedUrl.searchParams.get('t'), 10);

    return {
      sanitizedUrl: `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`,
      isYoutube: true,
      startTimecode: Number.isInteger(startSecond) ? startSecond * 1000 : null,
      stopTimecode: null,
      resourceType: RESOURCE_TYPE.video
    };
  }

  return {
    sanitizedUrl: parsedUrl?.href || url,
    isYoutube: false,
    startTimecode: null,
    stopTimecode: null,
    resourceType: getResourceType(url)
  };
}

export const determineMediaDuration = memoizee(async url => {
  const div = window.document.createElement('div');
  div.style.display = 'none';
  window.document.body.appendChild(div);
  let cleanedUp = false;
  const ensureCleanup = () => {
    if (!cleanedUp) {
      ReactDOM.unmountComponentAtNode(div);
      div.remove();
      cleanedUp = true;
    }
  };

  // This function should never throw synchronously,
  // so we have to await for a little moment here!
  await Promise.resolve();

  const playerPromise = new Promise((resolve, reject) => {
    let validUrl;
    if (!url) {
      resolve(null);
    }

    try {
      validUrl = new URL(url).href;
    } catch {
      resolve(null);
    }

    try {
      const element = React.createElement(ReactPlayer, {
        url: validUrl,
        light: false,
        playing: false,
        onDuration: durationInSeconds => {
          const durationInMiliseconds = Math.ceil(durationInSeconds * 1000);
          resolve(durationInMiliseconds);
          ensureCleanup();
        },
        onError: error => {
          reject(error);
          ensureCleanup();
        }
      });
      ReactDOM.render(element, div);
    } catch (error) {
      reject(error);
    }
  });
  const timeoutPromise = new Promise((_resolve, reject) => {
    setTimeout(() => {
      reject(new Error(`Timeout determining duration of ${url}`));
      ensureCleanup();
    }, MEDIA_TIMEOUT_IN_MS);
  });
  return Promise.race([playerPromise, timeoutPromise]);
}, { promise: true });

export function formatMillisecondsAsDuration(milliseconds, { millisecondsLength } = {}) {
  const millisecondsToFormat = !Number.isFinite(milliseconds) || milliseconds < 1 ? 0 : milliseconds;

  const totalSeconds = Math.floor(millisecondsToFormat / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);

  const remainingMilliseconds = (millisecondsToFormat % 1000).toString().padStart(3, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  const minutes = (totalMinutes % 60).toString().padStart(2, '0');
  const hours = totalHours.toString().padStart(2, '0');

  const durationParts = [];
  if (totalHours) {
    durationParts.push(hours);
  }
  durationParts.push(minutes);
  durationParts.push(seconds);

  const millisecondsText = remainingMilliseconds.toString().slice(0, millisecondsLength);

  return millisecondsLength ? `${durationParts.join(':')}.${millisecondsText}` : durationParts.join(':');
}

export function ensureValidMediaPosition(position) {
  return Math.max(0, Math.min(1, Number(position)));
}

export function formatMediaPosition({ formatPercentage, position, duration = 0 }) {
  return duration
    ? formatMillisecondsAsDuration(position * duration)
    : formatPercentage(position);
}

export function getSourcePositionFromTrackPosition(trackPosition, playbackRange) {
  return playbackRange[0] + ((playbackRange[1] - playbackRange[0]) * trackPosition);
}

export function getTrackDurationFromSourceDuration(sourceDuration, playbackRange) {
  return (playbackRange[1] - playbackRange[0]) * sourceDuration;
}

export async function getMediaInformation({ url, playbackRange, cdnRootUrl }) {
  const defaultResult = {
    sanitizedUrl: url,
    duration: 0,
    range: [0, 1],
    resourceType: RESOURCE_TYPE.unknown,
    error: null
  };

  if (!url) {
    return defaultResult;
  }

  try {
    const isInvalidSourceUrl = !isInternalSourceType({ url, cdnRootUrl })
      && validation.getUrlValidationStatus(url) === URL_VALIDATION_STATUS.error;

    if (isInvalidSourceUrl) {
      return defaultResult;
    }

    const completeUrl = getAccessibleUrl({ url, cdnRootUrl });

    const { sanitizedUrl, startTimecode, stopTimecode, resourceType } = analyzeMediaUrl(completeUrl);
    const duration = await determineMediaDuration(completeUrl);
    const range = [
      startTimecode ? ensureValidMediaPosition(startTimecode / duration) : playbackRange[0],
      stopTimecode ? ensureValidMediaPosition(stopTimecode / duration) : playbackRange[1]
    ];
    return { ...defaultResult, sanitizedUrl, duration, range, resourceType };
  } catch (error) {
    return { ...defaultResult, error };
  }
}
