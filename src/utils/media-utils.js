import React from 'react';
import memoizee from 'memoizee';
import ReactDOM from 'react-dom';
import reactPlayerNs from 'react-player';
import { getResourceType } from './resource-utils.js';
import { RESOURCE_TYPE } from '../domain/constants.js';

const ReactPlayer = reactPlayerNs.default || reactPlayerNs;

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
