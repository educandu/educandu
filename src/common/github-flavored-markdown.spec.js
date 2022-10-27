import GithubFlavoredMarkdown from './github-flavored-markdown.js';

describe('GithubFlavoredMarkdown', () => {
  let sut;

  beforeEach(() => {
    sut = new GithubFlavoredMarkdown();
  });

  describe('render', () => {

    describe('when called with a mix of portable and accessible CDN URLs', () => {
      it('changes all portable URLs into accessible URLs', () => {
        const result = sut.render([
          '[1. Click here](cdn://media/12345/file-1.png)',
          '[2. Click here](cdn://rooms/12345/media/file-2.png)',
          '[3. Click here](https://cdn.my-domain.com/media/12345/file-3.png)',
          '[4. Click here](https://cdn.my-domain.com/rooms/12345/media/file-4.png)',
          '<cdn://media/12345/file-5.png>',
          '<cdn://rooms/12345/media/file-6.png>',
          '<https://cdn.my-domain.com/media/12345/file-7.png>',
          '<https://cdn.my-domain.com/rooms/12345/media/file-8.png>',
          '![1. Alt text](cdn://media/12345/another-file-1.png)',
          '![2. Alt text](cdn://rooms/12345/media/another-file-2.png)',
          '![3. Alt text](https://cdn.my-domain.com/media/12345/another-file-3.png)',
          '![4. Alt text](https://cdn.my-domain.com/rooms/12345/media/another-file-4.png)',
          '[Go to Google](https://google.com)',
          '<https://google.com>'
        ].join('\n\n'), { cdnRootUrl: 'https://cdn.my-domain.com' });

        expect(result.trim()).toBe([
          '<p><a href="https://cdn.my-domain.com/media/12345/file-1.png">1. Click here</a></p>',
          '<p><a href="https://cdn.my-domain.com/rooms/12345/media/file-2.png">2. Click here</a></p>',
          '<p><a href="https://cdn.my-domain.com/media/12345/file-3.png">3. Click here</a></p>',
          '<p><a href="https://cdn.my-domain.com/rooms/12345/media/file-4.png">4. Click here</a></p>',
          '<p><a href="https://cdn.my-domain.com/media/12345/file-5.png">https://cdn.my-domain.com/media/12345/file-5.png</a></p>',
          '<p><a href="https://cdn.my-domain.com/rooms/12345/media/file-6.png">https://cdn.my-domain.com/rooms/12345/media/file-6.png</a></p>',
          '<p><a href="https://cdn.my-domain.com/media/12345/file-7.png">https://cdn.my-domain.com/media/12345/file-7.png</a></p>',
          '<p><a href="https://cdn.my-domain.com/rooms/12345/media/file-8.png">https://cdn.my-domain.com/rooms/12345/media/file-8.png</a></p>',
          '<p><img src="https://cdn.my-domain.com/media/12345/another-file-1.png" alt="1. Alt text"></p>',
          '<p><img src="https://cdn.my-domain.com/rooms/12345/media/another-file-2.png" alt="2. Alt text"></p>',
          '<p><img src="https://cdn.my-domain.com/media/12345/another-file-3.png" alt="3. Alt text"></p>',
          '<p><img src="https://cdn.my-domain.com/rooms/12345/media/another-file-4.png" alt="4. Alt text"></p>',
          '<p><a href="https://google.com">Go to Google</a></p>',
          '<p><a href="https://google.com">https://google.com</a></p>'
        ].join('\n'));
      });
    });

    describe('when called with HTML5 media enabled', () => {
      it('renders videos and audios using HTML5 video and audio tags', () => {
        const result = sut.render([
          '![](https://somedomain.com/file-1.mp4)',
          '![](cdn://media/12345/file-2.mp3)',
          '![](cdn://rooms/12345/media/file-3.mp3)',
          '![](https://somedomain.com/not-a-video.pdf)'
        ].join('\n\n'), { cdnRootUrl: 'https://cdn.my-domain.com', renderMedia: true });
        expect(result.trim()).toBe([
          '<p><video src="https://somedomain.com/file-1.mp4" controls></video></p>',
          '<p><audio src="https://cdn.my-domain.com/media/12345/file-2.mp3" controls></audio></p>',
          '<p><audio src="https://cdn.my-domain.com/rooms/12345/media/file-3.mp3" controls></audio></p>',
          '<p><img src="https://somedomain.com/not-a-video.pdf" alt=""></p>'
        ].join('\n'));
      });
    });

  });

  describe('redactCdnResources', () => {
    it('redacts all links and images starting with the cdn protocol only', () => {
      const result = sut.redactCdnResources([
        'This is a [hyperlink](cdn://) and',
        'this is a [hyperlink](cdn://media/12345/example.png) and',
        'this is too: <cdn://media/12345/example.png>, and',
        'this is an image: ![](cdn://media/12345/example.png  ) and',
        'this is an image: ![alt](cdn://media/12345/example.png  "") and',
        'this is an image: ![alt](cdn://media/12345/example.png "image title") and',
        'this is an image inside a hyperlink: [![alt](cdn://example.png "image title")](cdn://example-target);',
        'this, too: [![alt](https://example.com/file.png "image title")](cdn://example-target);',
        'this, too: [![alt](cdn://example.png "image title")](https://example.com/example-target);'
      ].join('\n\n'), url => url.replace(/example/, 'redacted'));
      expect(result).toEqual([
        'This is a [hyperlink](cdn://) and',
        'this is a [hyperlink](cdn://media/12345/redacted.png) and',
        'this is too: <cdn://media/12345/redacted.png>, and',
        'this is an image: ![](cdn://media/12345/redacted.png  ) and',
        'this is an image: ![alt](cdn://media/12345/redacted.png  "") and',
        'this is an image: ![alt](cdn://media/12345/redacted.png "image title") and',
        'this is an image inside a hyperlink: [![alt](cdn://redacted.png "image title")](cdn://redacted-target);',
        'this, too: [![alt](https://example.com/file.png "image title")](cdn://redacted-target);',
        'this, too: [![alt](cdn://redacted.png "image title")](https://example.com/example-target);'
      ].join('\n\n'));
    });
  });

  describe('extractCdnResources', () => {
    it('extracts all links and images starting with the cdn protocol only', () => {
      const result = sut.extractCdnResources([
        '[Click here](cdn://media/12345/file-1.png)',
        '[Click here](cdn://rooms/12345/media/file-2.png)',
        '[Click here](https://cdn.my-domain.com/media/12345/file-x.png)',
        '[Click here](https://cdn.my-domain.com/rooms/12345/media/file-x.png)',
        'Download this: <cdn://media/12345/file-3.pdf>',
        'Download this: <cdn://rooms/12345/media/file-4.pdf>',
        '* Image inside a **bold section ![Alt text](cdn://media/12345/file-5.png) within** a list item',
        '* Image inside a **bold section ![Alt text](cdn://rooms/12345/media/file-6.png) within** a list item',
        '[Go to Google](https://google.com)',
        '[Missing image](cdn://)'
      ].join('\n\n'));

      expect(result).toEqual([
        'cdn://media/12345/file-1.png',
        'cdn://rooms/12345/media/file-2.png',
        'cdn://media/12345/file-3.pdf',
        'cdn://rooms/12345/media/file-4.pdf',
        'cdn://media/12345/file-5.png',
        'cdn://rooms/12345/media/file-6.png'
      ]);
    });
  });
});
