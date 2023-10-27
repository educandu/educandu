import React from 'react';
import memoizee from 'memoizee';
import ReactDOMClient from 'react-dom/client';
import { preloadImage } from './image-utils.js';
import { getResourceType } from './resource-utils.js';
import { RESOURCE_TYPE } from '../domain/constants.js';
import MediaDurationIdentifier from '../components/media-player/media-duration-identifier.js';

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

    return {
      sanitizedUrl: `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`,
      youtubeVideoId: videoId,
      resourceType: RESOURCE_TYPE.video
    };
  }

  if (parsedUrl?.origin === 'https://youtu.be' && parsedUrl?.pathname && !parsedUrl?.pathname.slice(1).includes('/')) {
    const videoId = parsedUrl.pathname.slice(1);

    return {
      sanitizedUrl: `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`,
      youtubeVideoId: videoId,
      resourceType: RESOURCE_TYPE.video
    };
  }

  return {
    sanitizedUrl: parsedUrl?.href || url,
    youtubeVideoId: null,
    resourceType: getResourceType(url)
  };
}

export const determineMediaDuration = memoizee(async url => {
  const element = window.document.createElement('div');
  element.style.display = 'none';
  window.document.body.appendChild(element);

  const root = ReactDOMClient.createRoot(element);

  let cleanedUp = false;
  const ensureCleanup = () => {
    if (!cleanedUp) {
      root.unmount();
      element.remove();
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
      const player = React.createElement(MediaDurationIdentifier, {
        sourceUrl: validUrl,
        onDuration: durationInMiliseconds => {
          resolve(durationInMiliseconds);
          ensureCleanup();
        }
      });
      root.render(player);
    } catch (error) {
      ensureCleanup();
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

export const verifyMediaThumbnailUrl = memoizee((url, minAcceptedWidth) => {
  const imagePromise = preloadImage(url, minAcceptedWidth);

  const timeoutPromise = new Promise((_resolve, reject) => {
    setTimeout(() => reject(new Error(`Timeout verifying thumbnail URL ${url}`)), MEDIA_TIMEOUT_IN_MS);
  });

  return Promise.race([imagePromise, timeoutPromise]);
}, { promise: true });

export function formatMillisecondsAsDuration(milliseconds, { millisecondsLength } = {}) {
  const millisecondsToFormat = !Number.isFinite(milliseconds) || milliseconds < 1 ? 0 : milliseconds;

  const totalSeconds = Math.floor(millisecondsToFormat / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);

  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  const minutes = (totalMinutes % 60).toString().padStart(2, '0');
  const hours = totalHours.toString().padStart(2, '0');

  const durationParts = [];
  if (totalHours) {
    durationParts.push(hours);
  }
  durationParts.push(minutes);
  durationParts.push(seconds);

  const remainingMilliseconds = (millisecondsToFormat % 1000).toFixed(0).padStart(3, '0');
  const millisecondsText = remainingMilliseconds.slice(0, millisecondsLength);

  return millisecondsLength ? `${durationParts.join(':')}.${millisecondsText}` : durationParts.join(':');
}

export function tryConvertDurationToMilliseconds(duration) {
  const durationRegexp = /(?<segment3>[0-9]+:)?(?<segment2>[0-9]+:)?(?<segment1>[0-9]+)?(?<milliseconds>\.[0-9]+)?/;

  const tooManyMillisecondSegments = (duration.match(/\./g) || []).length > 1;
  const tooManyTimeSegments = (duration.match(/:/g) || []).length > 2;
  const illegalCharacters = (duration.match(/[^0-9,.,:]/g) || []).length > 0;

  if (tooManyMillisecondSegments || tooManyTimeSegments || illegalCharacters) {
    return null;
  }

  const groups = (duration || '').match(durationRegexp)?.groups;

  if (!groups.milliseconds && !groups.segment1 && !groups.segment2 && !groups.segment3) {
    return null;
  }

  const millisecondsValue = parseInt((groups.milliseconds || '').replace('.', '').padEnd(3, '0'), 10);
  const segment1Value = parseInt(groups.segment1, 10);
  const segment2Value = parseInt(groups.segment2, 10);
  const segment3Value = parseInt(groups.segment3, 10);

  const areBothHoursAndMinutesGiven = !isNaN(segment2Value) && !isNaN(segment3Value);

  const milliseconds = millisecondsValue || 0;
  const seconds = segment1Value || 0;
  const minutes = (areBothHoursAndMinutesGiven ? segment2Value : segment3Value) || 0;
  const hours = (areBothHoursAndMinutesGiven ? segment3Value : null) || 0;

  if (milliseconds > 999 || seconds > 59 || minutes > 59) {
    return null;
  }

  return milliseconds + (seconds * 1000) + (minutes * 60 * 1000) + (hours * 60 * 60 * 1000);
}

export function ensureValidMediaPosition(position) {
  return Math.max(0, Math.min(1, Number(position)));
}

export function formatMediaPosition({ formatPercentage, position, duration = 0, millisecondsLength = 0 }) {
  return duration
    ? formatMillisecondsAsDuration(position * duration, { millisecondsLength })
    : formatPercentage(position);
}

export function shouldDisableVideo(sourceUrl) {
  const { resourceType } = analyzeMediaUrl(sourceUrl);
  return ![RESOURCE_TYPE.video, RESOURCE_TYPE.none, RESOURCE_TYPE.unknown].includes(resourceType);
}
