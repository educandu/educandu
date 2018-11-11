module.exports = [
  {
    name: 'Markdown',
    type: 'markdown',
    defaultContent: {
      text: ''
    }
  },
  {
    name: 'Image',
    type: 'image',
    defaultContent: {
      type: 'internal',
      url: '',
      maxWidth: 100
    }
  },
  {
    name: 'Audio',
    type: 'audio',
    defaultContent: {
      type: 'internal',
      url: ''
    }
  },
  {
    name: 'Youtube-Video',
    type: 'youtube-video',
    defaultContent: {
      videoId: '',
      maxWidth: 100
    }
  },
  {
    name: 'Quick-Tester',
    type: 'quick-tester',
    defaultContent: {
      title: '',
      teaser: '',
      tests: []
    }
  },
  {
    name: 'H5P-Player',
    type: 'h5p-player',
    defaultContent: {
      contentId: null,
      maxWidth: 100
    }
  },
  {
    name: 'Annotation',
    type: 'annotation',
    defaultContent: {
      title: '',
      text: ''
    }
  },
  {
    name: 'Intervall-Trainer',
    type: 'interval-trainer',
    defaultContent: {
      title: '',
      keyboardShortcuts: 'Q2W3ER5T6Z7UYSXDCVGBHNJM',
      keyboardStart: 0,
      keyboardEnd: 24,
      keyboardOffset: 48,
      tests: []
    }
  }
];
