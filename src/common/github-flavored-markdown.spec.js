import GithubFlavoredMarkdown from './github-flavored-markdown.js';

describe('GithubFlavoredMarkdown', () => {
  let sut;

  beforeEach(() => {
    sut = new GithubFlavoredMarkdown();
  });

  describe('render', () => {

    describe('when called without a CDN root url', () => {
      it('does not change any links', () => {
        const result = sut.render('[Click here](cdn://media/my-file.png)');
        expect(result.trim()).toBe('<p><a href="cdn://media/my-file.png">Click here</a></p>');
      });
    });

    describe('when called with a CDN root url', () => {
      it('changes links and images starting with the cdn protocol only', () => {
        const result = sut.render([
          '[Click here](cdn://media/my-file.png)',
          '<cdn://media/my-file.png>',
          '![Alt text](cdn://media/another-file.png)',
          '[Go to Google](https://google.com)',
          '<https://google.com>'
        ].join('\n\n'), { cdnRootUrl: 'https://cdn.my-domain.com' });
        expect(result.trim()).toBe([
          '<p><a href="https://cdn.my-domain.com/media/my-file.png">Click here</a></p>',
          '<p><a href="https://cdn.my-domain.com/media/my-file.png">https://cdn.my-domain.com/media/my-file.png</a></p>',
          '<p><img src="https://cdn.my-domain.com/media/another-file.png" alt="Alt text"></p>',
          '<p><a href="https://google.com">Go to Google</a></p>',
          '<p><a href="https://google.com">https://google.com</a></p>'
        ].join('\n'));
      });
    });

    describe('when called with HTML5 media enabled', () => {
      it('renders videos and audios using HTML5 video and audio tags', () => {
        const result = sut.render([
          '![](https://somedomain.com/my-file.mp4)',
          '![](cdn://media/another-file.mp3)',
          '![](https://somedomain.com/not-a-video.pdf)'
        ].join('\n\n'), { cdnRootUrl: 'https://cdn.my-domain.com', renderMedia: true });
        expect(result.trim()).toBe([
          '<p><video src="https://somedomain.com/my-file.mp4" controls></video></p>',
          '<p><audio src="https://cdn.my-domain.com/media/another-file.mp3" controls></audio></p>',
          '<p><img src="https://somedomain.com/not-a-video.pdf" alt=""></p>'
        ].join('\n'));
      });
    });

  });

  describe('redactCdnResources', () => {
    it('redacts all links and images starting with the cdn protocol only', () => {
      const result = sut.redactCdnResources([
        'This is a [hyperlink](cdn://) and',
        'this is a [hyperlink](cdn://media/example.png) and',
        'this is too: <cdn://media/example.png>, and',
        'this is an image: ![](cdn://media/example.png  ) and',
        'this is an image: ![alt](cdn://media/example.png  "") and',
        'this is an image: ![alt](cdn://media/example.png "image title") and',
        'this is an image inside a hyperlink: [![alt](cdn://example.png "image title")](cdn://example-target);',
        'this, too: [![alt](https://example.com/image.png "image title")](cdn://example-target);',
        'this, too: [![alt](cdn://example.png "image title")](https://example.com/example-target);'
      ].join('\n\n'), url => url.replace(/example/, 'redacted'));
      expect(result).toEqual([
        'This is a [hyperlink](cdn://) and',
        'this is a [hyperlink](cdn://media/redacted.png) and',
        'this is too: <cdn://media/redacted.png>, and',
        'this is an image: ![](cdn://media/redacted.png  ) and',
        'this is an image: ![alt](cdn://media/redacted.png  "") and',
        'this is an image: ![alt](cdn://media/redacted.png "image title") and',
        'this is an image inside a hyperlink: [![alt](cdn://redacted.png "image title")](cdn://redacted-target);',
        'this, too: [![alt](https://example.com/image.png "image title")](cdn://redacted-target);',
        'this, too: [![alt](cdn://redacted.png "image title")](https://example.com/example-target);'
      ].join('\n\n'));
    });
  });

  describe('extractCdnResources', () => {
    it('extracts all links and images starting with the cdn protocol only', () => {
      const result = sut.extractCdnResources([
        '[Click here](cdn://media/my-file.png)',
        'Download this: <cdn://media/my-pdf-file.pdf>',
        '* Image inside a **bold section ![Alt text](cdn://media/another-file.png) within** a list item',
        '[Go to Google](https://google.com)',
        '[Missing image](cdn://)'
      ].join('\n\n'));
      expect(result).toEqual(['media/my-file.png', 'media/my-pdf-file.pdf', 'media/another-file.png']);
    });
  });

});
