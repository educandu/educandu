import React from 'react';
import memoizee from 'memoizee';
import ReactDOM from 'react-dom';
import reactPlayerNs from 'react-player';
import { MEDIA_TYPE } from '../domain/constants.js';

const ReactPlayer = reactPlayerNs.default || reactPlayerNs;

const audioUrlExtensions = ['aac', 'm4a', 'mp3', 'oga', 'ogg', 'wav', 'flac'];
const videoUrlExtensions = ['mp4', 'm4v', 'ogv', 'webm', 'mpg', 'mpeg', 'mov', 'avi', 'mkv'];

export const getMediaType = url => {
  const sanitizedUrl = (url || '').trim();
  const extensionMatches = sanitizedUrl.match(/\.([0-9a-z]+)$/i);
  const extension = extensionMatches?.[1]?.toLowerCase();

  if (!extension) {
    return MEDIA_TYPE.none;
  }
  if (audioUrlExtensions.includes(extension)) {
    return MEDIA_TYPE.audio;
  }
  if (videoUrlExtensions.includes(extension)) {
    return MEDIA_TYPE.video;
  }
  return MEDIA_TYPE.unknown;
};

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
      mediaType: MEDIA_TYPE.video
    };
  }

  return {
    sanitizedUrl: parsedUrl.href,
    isYoutube: false,
    startTimecode: null,
    stopTimecode: null,
    mediaType: getMediaType(url)
  };
}

export const determineMediaDuration = memoizee(url => {
  const div = window.document.createElement('div');
  div.style.display = 'none';
  window.document.body.appendChild(div);
  return new Promise((resolve, reject) => {
    try {
      const element = React.createElement(ReactPlayer, {
        url,
        light: false,
        playing: false,
        onDuration: durationInSeconds => {
          const durationInMiliseconds = durationInSeconds * 1000;
          resolve(durationInMiliseconds);
          ReactDOM.unmountComponentAtNode(div);
          div.remove();
        },
        onError: error => {
          reject(error);
          ReactDOM.unmountComponentAtNode(div);
          div.remove();
        }
      });
      ReactDOM.render(element, div);
    } catch (error) {
      reject(error);
    }
  });
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
