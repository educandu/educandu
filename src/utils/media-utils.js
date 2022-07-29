import React from 'react';
import memoizee from 'memoizee';
import ReactDOM from 'react-dom';
import reactPlayerNs from 'react-player';
import { getResourceType } from './resource-utils.js';
import { RESOURCE_TYPE } from '../domain/constants.js';

const ReactPlayer = reactPlayerNs.default || reactPlayerNs;

const MEDIA_TIMEOUT_IN_MS = 5000;

export function analyzeMediaUrl(url) {
  const parsedUrl = new URL(url);

  if (parsedUrl.origin === 'https://www.youtube.com' && parsedUrl.pathname === '/watch' && parsedUrl.searchParams.has('v')) {
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

  if (parsedUrl.origin === 'https://youtu.be' && parsedUrl.pathname && !parsedUrl.pathname.slice(1).includes('/')) {
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
    sanitizedUrl: parsedUrl.href,
    isYoutube: false,
    startTimecode: null,
    stopTimecode: null,
    resourceType: getResourceType(url)
  };
}

export const determineMediaDuration = memoizee(url => {
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
  const playerPromise = new Promise((resolve, reject) => {
    try {
      const element = React.createElement(ReactPlayer, {
        url,
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

export function formatMillisecondsAsDuration(milliseconds) {
  if (!Number.isFinite(milliseconds) || milliseconds < 1) {
    return '00:00';
  }

  const totalSeconds = Math.round(milliseconds / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);

  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  const minutes = (totalMinutes % 60).toString().padStart(2, '0');
  const hours = totalHours.toString().padStart(2, '0');

  return totalHours ? `${hours}:${minutes}:${seconds}` : `${minutes}:${seconds}`;
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
