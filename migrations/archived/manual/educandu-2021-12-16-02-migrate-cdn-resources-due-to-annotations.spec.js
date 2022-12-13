import { describe, expect, it } from 'vitest';
import { aggregateSectionUrls } from './educandu-2021-12-16-02-migrate-cdn-resources-due-to-annotations.js';

const imageContent1 = {
  sourceType: 'internal',
  sourceUrl: 'media/image-content-1.jpg'
};
const imageContent2 = {
  sourceType: 'external',
  sourceUrl: 'media/image-content-2.jpg'
};
const videoContent1 = {
  sourceType: 'internal',
  sourceUrl: 'media/video-content-1.mov'
};
const videoContent2 = {
  sourceType: 'external',
  sourceUrl: 'media/video-content-3.mov'
};
const imageTilesContent = {
  tiles: [
    {
      image: {
        type: 'internal',
        url: 'media/image-tile-content-1.jpg'
      }
    },
    {
      image: {
        type: 'external',
        url: 'media/image-tile-content-2.jpg'
      }
    }
  ]
};
const earTrainingContent = {
  tests: [
    {
      sound: {
        type: 'internal',
        url: 'media/ear-training-content-1.mp3'
      }
    },
    {
      sound: {
        type: 'external',
        url: 'media/ear-training-content-2.mp3'
      }
    }
  ]
};
const anavisContent1 = {
  media: {
    type: 'internal',
    url: 'media/anavis-content-1.jpg'
  }
};
const anavisContent2 = {
  media: {
    type: 'external',
    url: 'media/anavis-content-1.jpg'
  }
};
const audioContent1 = {
  type: 'internal',
  url: 'media/audio-content-1.mp3'
};
const audioContent2 = {
  type: 'external',
  url: 'media/audio-content-2.mp3'
};
const markdownContent = {
  text: `
# The document contains
a [picture](cdn://media/markdown-content-1.png) from the CDN,
a [second picture](cdn://media/markdown-content-2.png) from the CDN,
and an image from [the-great-interwebs](https://amazing-domain.de/amazing-picture.jpeg)
`
};
const annotationContent = {
  text: `
# The document contains
a [picture](cdn://media/annotation-content-1.png) from the CDN,
a [second picture](cdn://media/annotation-content-2.png) from the CDN,
and an image from [the-great-interwebs](https://amazing-domain.de/amazing-picture.jpeg)
`
};

describe('aggregateSectionUrls', () => {

  it('should gather all CDN resources', () => {
    const sections = [
      { type: 'image', content: imageContent1 },
      { type: 'image', content: imageContent2 },
      { type: 'video', content: videoContent1 },
      { type: 'video', content: videoContent2 },
      { type: 'image-tiles', content: imageTilesContent },
      { type: 'ear-training', content: earTrainingContent },
      { type: 'anavis', content: anavisContent1 },
      { type: 'anavis', content: anavisContent2 },
      { type: 'audio', content: audioContent1 },
      { type: 'audio', content: audioContent2 },
      { type: 'markdown', content: markdownContent },
      { type: 'annotation', content: annotationContent }
    ];

    const resources = aggregateSectionUrls(sections);
    expect(resources).toEqual([
      'media/image-content-1.jpg',
      'media/video-content-1.mov',
      'media/image-tile-content-1.jpg',
      'media/ear-training-content-1.mp3',
      'media/anavis-content-1.jpg',
      'media/audio-content-1.mp3',
      'media/markdown-content-1.png',
      'media/markdown-content-2.png',
      'media/annotation-content-1.png',
      'media/annotation-content-2.png'
    ]);
  });

});
