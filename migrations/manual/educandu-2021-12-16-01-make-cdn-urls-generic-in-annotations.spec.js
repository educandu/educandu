import { processSection } from './educandu-2021-12-16-01-make-cdn-urls-generic-in-annotations.js';

const text = `
# Dear World,

here we have a link to [elmu staging](https://staging.cdn.elmu.online/media/my-image.png),
and this is an image from elmu production:
![Cat falling from tree](https://cdn.elmu.online/media/falling-cat.jpg)

Here is plain text link to elmu staging (https://staging.cdn.elmu.online/media/smth.pdf), which should not be replaced!

Also a few pictures with URL encoded characters from Open Music Academy:

![Cat falling from tree](https://cdn.integration.openmusic.academy/media/falling%20cat.jpg)
![Cat falling from tree](https://cdn.staging.openmusic.academy/media/falling%20cat.jpg)
![Cat falling from tree](https://cdn.openmusic.academy/media/falling%20cat.jpg)

The end!
`;

const expectedResult = `
# Dear World,

here we have a link to [elmu staging](cdn://media/my-image.png),
and this is an image from elmu production:
![Cat falling from tree](cdn://media/falling-cat.jpg)

Here is plain text link to elmu staging (https://staging.cdn.elmu.online/media/smth.pdf), which should not be replaced!

Also a few pictures with URL encoded characters from Open Music Academy:

![Cat falling from tree](cdn://media/falling%20cat.jpg)
![Cat falling from tree](cdn://media/falling%20cat.jpg)
![Cat falling from tree](cdn://media/falling%20cat.jpg)

The end!
`;

describe('processSection', () => {

  it('should replace all links and images that match a CDN root URL', () => {
    const section = { type: 'annotation', content: { text } };
    const updateCount = processSection(section);
    expect(updateCount).toBe(5);
    expect(section.content.text).toBe(expectedResult);
  });

});
