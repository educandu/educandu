const CDN_PORTABLE_URL_PREFIX = 'cdn://';
const CDN_ACCESSIBLE_URL_REGEX = /https:\/\/cdn\.[^/]+\//;

const OLD_ROOMS_CDN_PREFIX = 'cdn://rooms/';
const OLD_MEDIA_CDN_PREFIX = 'cdn://media/';

// Matches both URLs in e.g.: [![alt](cdn://image.png "image title")](cdn://some-target)
const imageInsideOfLinkPattern = /(\[!\[[^\]]*\]\()(\S*?)((?:\s+[^)]*)?\s*\)]\()(\S*?)((?:\s+[^)]*)?\s*\))(?!\])/g;

// Matches the URL in e.g.: ![alt](cdn://image.png "image title")
const simpleLinkOrImagePattern = /(!?\[[^\]]*\]\()(\S*?)((?:\s+[^)]*)?\s*\))(?!\])/g;

// Matches the URL in e.g.: <cdn://image.png>
const autoLinkPattern = /(<)([a-zA-Z][a-zA-Z0-9+.-]{1,31}:[^<>]*)(>)/g;

const redactUrlsInMarkdown = (markdown, redact) => {
  if (!markdown) {
    return markdown;
  }

  return markdown
    .replace(imageInsideOfLinkPattern, (_match, g1, g2, g3, g4, g5) => `${g1}${redact(g2)}${g3}${redact(g4)}${g5}`)
    .replace(simpleLinkOrImagePattern, (_match, g1, g2, g3) => `${g1}${redact(g2)}${g3}`)
    .replace(autoLinkPattern, (_match, g1, g2, g3) => `${g1}${redact(g2)}${g3}`);
};

const redactUrl = (url = '') => {
  let portableUrl = url;

  if (CDN_ACCESSIBLE_URL_REGEX.test(url)) {
    portableUrl = url.replace(CDN_ACCESSIBLE_URL_REGEX, CDN_PORTABLE_URL_PREFIX);
  }

  if (portableUrl.startsWith(OLD_ROOMS_CDN_PREFIX)) {
    portableUrl = portableUrl
      .replace(OLD_ROOMS_CDN_PREFIX, 'cdn://room-media/')
      .replace('/media/', '/');
  }

  if (portableUrl.startsWith(OLD_MEDIA_CDN_PREFIX)) {
    portableUrl = portableUrl.replace(OLD_MEDIA_CDN_PREFIX, 'cdn://document-media/');
  }

  return portableUrl;
};

const redactMarkdown = text => {
  let isRedacted = false;

  const redactedMarkdown = redactUrlsInMarkdown(text, url => {
    const redactedUrl = redactUrl(url);
    if (redactedUrl !== url) {
      isRedacted = true;
      console.log(`Redacted:\n  ${url}\n  ${redactedUrl}`);
    }
    return redactedUrl;
  });

  return {
    markdown: redactedMarkdown,
    isRedacted
  };
};

export default class Educandu_2023_02_08_01_change_cdn_urls_in_rooms {
  constructor(db) {
    this.db = db;
  }

  async redactRoomDescription(room) {
    const result = await redactMarkdown(room.description);

    if (result.isRedacted) {
      // eslint-disable-next-line require-atomic-updates
      room.description = result.markdown;
    }

    return result.isRedacted;
  }

  async up() {
    const cursor = this.db.collection('rooms').find({ $and: [{ description: { $ne: '' } }, { description: { $ne: null } }] });

    let counter = 0;
    while (await cursor.hasNext()) {
      const room = await cursor.next();
      const isRedacted = await this.redactRoomDescription(room);

      if (isRedacted) {
        counter += 1;
        await this.db.collection('rooms').replaceOne({ _id: room._id }, room);
        console.log(`Updated description for room ${room._id}`);
      }
    }

    console.log(`Updated ${counter} rooms`);
  }

  down() {
    throw new Error('Not supported');
  }
}
