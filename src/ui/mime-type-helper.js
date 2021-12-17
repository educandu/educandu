import mime from 'mime';

const CATEGORY_TEXT = 'text';
const CATEGORY_MARKUP = 'markup';
const CATEGORY_IMAGE = 'image';
const CATEGORY_VIDEO = 'video';
const CATEGORY_AUDIO = 'audio';
const CATEGORY_ARCHIVE = 'archive';
const CATEGORY_DOCUMENT = 'document';
const CATEGORY_SPREADSHEET = 'spreadsheet';
const CATEGORY_PRESENTATION = 'presentation';
const CATEGORY_PROGRAM = 'program';
const CATEGORY_FOLDER = 'folder';
const CATEGORY_UNKNOWN = 'unknown';

const predefinedMappings = {

  // Archive:
  'application/x-cpio': CATEGORY_ARCHIVE,
  'application/x-shar': CATEGORY_ARCHIVE,
  'application/x-sbx': CATEGORY_ARCHIVE,
  'application/x-tar': CATEGORY_ARCHIVE,
  'application/x-bzip2': CATEGORY_ARCHIVE,
  'application/gzip': CATEGORY_ARCHIVE,
  'application/x-lzip': CATEGORY_ARCHIVE,
  'application/x-lzma': CATEGORY_ARCHIVE,
  'application/x-lzop': CATEGORY_ARCHIVE,
  'application/x-snappy-framed': CATEGORY_ARCHIVE,
  'application/x-xz': CATEGORY_ARCHIVE,
  'application/x-compress': CATEGORY_ARCHIVE,
  'application/x-7z-compressed': CATEGORY_ARCHIVE,
  'application/x-ace-compressed': CATEGORY_ARCHIVE,
  'application/x-astrotite-afa': CATEGORY_ARCHIVE,
  'application/x-alz-compressed': CATEGORY_ARCHIVE,
  'application/vnd.android.package-archive': CATEGORY_ARCHIVE,
  'application/x-arj': CATEGORY_ARCHIVE,
  'application/x-b1': CATEGORY_ARCHIVE,
  'application/vnd.ms-cab-compressed': CATEGORY_ARCHIVE,
  'application/x-cfs-compressed': CATEGORY_ARCHIVE,
  'application/x-dar': CATEGORY_ARCHIVE,
  'application/x-dgc-compressed': CATEGORY_ARCHIVE,
  'application/x-apple-diskimage': CATEGORY_ARCHIVE,
  'application/x-gca-compressed': CATEGORY_ARCHIVE,
  'application/x-lzh': CATEGORY_ARCHIVE,
  'application/x-lzx': CATEGORY_ARCHIVE,
  'application/x-rar-compressed': CATEGORY_ARCHIVE,
  'application/x-stuffit': CATEGORY_ARCHIVE,
  'application/x-stuffitx': CATEGORY_ARCHIVE,
  'application/x-gtar': CATEGORY_ARCHIVE,
  'application/zip': CATEGORY_ARCHIVE,
  'application/x-zoo': CATEGORY_ARCHIVE,
  'application/x-par2': CATEGORY_ARCHIVE,
  'application/x-freearc': CATEGORY_ARCHIVE,
  'application/mac-compactpro': CATEGORY_ARCHIVE,
  'application/x-sea': CATEGORY_ARCHIVE,
  'application/java-archive': CATEGORY_ARCHIVE,
  'application/x-lzh-compressed': CATEGORY_ARCHIVE,
  'application/x-redhat-package-manager': CATEGORY_ARCHIVE,

  // Document
  'application/pdf': CATEGORY_DOCUMENT,
  'application/epub+zip': CATEGORY_DOCUMENT,
  'application/oxps': CATEGORY_DOCUMENT,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': CATEGORY_DOCUMENT,
  'application/x-mspublisher': CATEGORY_DOCUMENT,
  'application/vnd.ms-project': CATEGORY_DOCUMENT,
  'application/msword': CATEGORY_DOCUMENT,
  'application/andrew-inset': CATEGORY_DOCUMENT,
  'application/vnd.wordperfect': CATEGORY_DOCUMENT,
  'application/vnd.ms-xpsdocument': CATEGORY_DOCUMENT,
  'application/bdoc': CATEGORY_DOCUMENT,
  'application/vnd.ms-works': CATEGORY_DOCUMENT,
  'application/vnd.visio': CATEGORY_DOCUMENT,
  'application/vnd.fdf': CATEGORY_DOCUMENT,
  'application/postscript': CATEGORY_DOCUMENT,
  'application/x-mswrite': CATEGORY_DOCUMENT,
  'application/x-tex': CATEGORY_DOCUMENT,
  'application/vnd.fujixerox.docuworks': CATEGORY_DOCUMENT,
  'application/vnd.oasis.opendocument.text': CATEGORY_DOCUMENT,
  'application/vnd.geogebra.file': CATEGORY_DOCUMENT,
  'application/vnd.lotus-wordpro': CATEGORY_DOCUMENT,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.template': CATEGORY_DOCUMENT,
  'application/rtf': CATEGORY_DOCUMENT,
  'application/vnd.groove-tool-template': CATEGORY_DOCUMENT,
  'application/vnd.tcpdump.pcap': CATEGORY_DOCUMENT,
  'application/vnd.kde.kivio': CATEGORY_DOCUMENT,
  'application/vnd.xfdl': CATEGORY_DOCUMENT,
  'application/inkml+xml': CATEGORY_DOCUMENT,
  'application/vnd.sun.xml.writer': CATEGORY_DOCUMENT,
  'application/x-msbinder': CATEGORY_DOCUMENT,
  'application/vnd.lotus-freelance': CATEGORY_DOCUMENT,
  'application/vnd.ms-powerpoint.slideshow.macroenabled.12': CATEGORY_DOCUMENT,
  'application/vnd.openxmlformats-officedocument.presentationml.slideshow': CATEGORY_DOCUMENT,
  'application/vnd.ms-powerpoint.presentation.macroenabled.12': CATEGORY_DOCUMENT,
  'application/vnd.ms-htmlhelp': CATEGORY_DOCUMENT,
  'application/vnd.ms-word.document.macroenabled.12': CATEGORY_DOCUMENT,
  'application/x-mobipocket-ebook': CATEGORY_DOCUMENT,
  'application/x-director': CATEGORY_DOCUMENT,
  'application/vnd.micrografx.flo': CATEGORY_DOCUMENT,
  'application/x-abiword': CATEGORY_DOCUMENT,
  'application/vnd.osgi.dp': CATEGORY_DOCUMENT,
  'application/vnd.framemaker': CATEGORY_DOCUMENT,
  'application/vnd.stardivision.writer': CATEGORY_DOCUMENT,
  'application/vnd.groove-injector': CATEGORY_DOCUMENT,
  'application/vnd.pocketlearn': CATEGORY_DOCUMENT,
  'application/vnd.micrografx.igx': CATEGORY_DOCUMENT,
  'application/vnd.adobe.xdp+xml': CATEGORY_DOCUMENT,
  'application/x-msschedule': CATEGORY_DOCUMENT,
  'application/vnd.openxmlformats-officedocument.presentationml.template': CATEGORY_DOCUMENT,
  'application/vnd.smaf': CATEGORY_DOCUMENT,
  'application/vnd.oasis.opendocument.text-template': CATEGORY_DOCUMENT,
  'application/x-msmediaview': CATEGORY_DOCUMENT,
  'application/x-dvi': CATEGORY_DOCUMENT,
  'application/vnd.adobe.xfdf': CATEGORY_DOCUMENT,
  'application/vnd.oasis.opendocument.graphics-template': CATEGORY_DOCUMENT,
  'application/winhlp': CATEGORY_DOCUMENT,
  'application/vnd.mcd': CATEGORY_DOCUMENT,
  'application/vnd.oasis.opendocument.text-master': CATEGORY_DOCUMENT,
  'application/vnd.oasis.opendocument.chart-template': CATEGORY_DOCUMENT,
  'application/pkix-cert': CATEGORY_DOCUMENT,
  'application/vnd.ms-word.template.macroenabled.12': CATEGORY_DOCUMENT,
  'application/vnd.oasis.opendocument.chart': CATEGORY_DOCUMENT,
  'application/vnd.ctc-posml': CATEGORY_DOCUMENT,
  'application/vnd.gmx': CATEGORY_DOCUMENT,
  'application/vnd.oasis.opendocument.formula': CATEGORY_DOCUMENT,
  'application/x-texinfo': CATEGORY_DOCUMENT,
  'application/vnd.data-vision.rdz': CATEGORY_DOCUMENT,
  'application/vnd.stardivision.writer-global': CATEGORY_DOCUMENT,
  'application/vnd.groove-vcard': CATEGORY_DOCUMENT,
  'application/x-font-snf': CATEGORY_DOCUMENT,
  'application/sdp': CATEGORY_DOCUMENT,

  // Spreadsheet:
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': CATEGORY_SPREADSHEET,
  'application/vnd.ms-excel': CATEGORY_SPREADSHEET,
  'application/vnd.shana.informed.interchange': CATEGORY_SPREADSHEET,
  'application/vnd.lotus-1-2-3': CATEGORY_SPREADSHEET,
  'application/vnd.oasis.opendocument.spreadsheet': CATEGORY_SPREADSHEET,
  'application/vnd.ms-excel.sheet.macroenabled.12': CATEGORY_SPREADSHEET,
  'application/vnd.ms-excel.sheet.binary.macroenabled.12': CATEGORY_SPREADSHEET,
  'application/vnd.sun.xml.calc': CATEGORY_SPREADSHEET,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.template': CATEGORY_SPREADSHEET,
  'application/vnd.kde.kspread': CATEGORY_SPREADSHEET,
  'application/vnd.stardivision.calc': CATEGORY_SPREADSHEET,
  'application/vnd.oasis.opendocument.spreadsheet-template': CATEGORY_SPREADSHEET,
  'application/vnd.sun.xml.calc.template': CATEGORY_SPREADSHEET,
  'application/vnd.ms-excel.template.macroenabled.12': CATEGORY_SPREADSHEET,
  'application/vnd.accpac.simply.imp': CATEGORY_SPREADSHEET,
  'application/vnd.epson.ssf': CATEGORY_SPREADSHEET,
  'application/vnd.sun.xml.writer.template': CATEGORY_SPREADSHEET,
  'application/octet-stream': CATEGORY_SPREADSHEET,
  'application/vnd.vcx': CATEGORY_SPREADSHEET,
  'text/tab-separated-values': CATEGORY_SPREADSHEET,
  'text/troff': CATEGORY_SPREADSHEET,
  'text/csv': CATEGORY_SPREADSHEET,

  // Presentation:
  'application/vnd.google-apps.presentation': CATEGORY_PRESENTATION,
  'application/mathematica': CATEGORY_PRESENTATION,
  'application/vnd.wolfram.player': CATEGORY_PRESENTATION,
  'application/vnd.oasis.opendocument.presentation': CATEGORY_PRESENTATION,
  'application/vnd.oasis.opendocument.presentation-template': CATEGORY_PRESENTATION,
  'application/vnd.ms-powerpoint': CATEGORY_PRESENTATION,
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': CATEGORY_PRESENTATION,
  'application/vnd.stardivision.impress': CATEGORY_PRESENTATION,
  'application/shf+xml': CATEGORY_PRESENTATION,
  'application/vnd.sun.xml.impress.template': CATEGORY_PRESENTATION,
  'application/vnd.sun.xml.impress': CATEGORY_PRESENTATION,
  'application/vnd.ms-officetheme': CATEGORY_PRESENTATION,

  // Program:
  'text/vcard': CATEGORY_PROGRAM,
  'text/css': CATEGORY_PROGRAM,
  'text/ecmascript': CATEGORY_PROGRAM,
  'text/javascript': CATEGORY_PROGRAM,

  // Markup:
  'text/html': CATEGORY_MARKUP,
  'text/markdown': CATEGORY_MARKUP,
  'text/SGML': CATEGORY_MARKUP,
  'text/xml': CATEGORY_MARKUP,

  // Document:
  'text/rtf': CATEGORY_DOCUMENT,

  // Text:
  'text/plain': CATEGORY_TEXT
};

const resourceKeyMap = {
  [CATEGORY_TEXT]: 'mimeTypeHelper:mimeTypeCategoryText',
  [CATEGORY_MARKUP]: 'mimeTypeHelper:mimeTypeCategoryMarkup',
  [CATEGORY_IMAGE]: 'mimeTypeHelper:mimeTypeCategoryImage',
  [CATEGORY_VIDEO]: 'mimeTypeHelper:mimeTypeCategoryVideo',
  [CATEGORY_AUDIO]: 'mimeTypeHelper:mimeTypeCategoryAudio',
  [CATEGORY_ARCHIVE]: 'mimeTypeHelper:mimeTypeCategoryArchive',
  [CATEGORY_DOCUMENT]: 'mimeTypeHelper:mimeTypeCategoryDocument',
  [CATEGORY_SPREADSHEET]: 'mimeTypeHelper:mimeTypeCategorySpreadsheet',
  [CATEGORY_PRESENTATION]: 'mimeTypeHelper:mimeTypeCategoryPresentation',
  [CATEGORY_PROGRAM]: 'mimeTypeHelper:mimeTypeCategoryProgram',
  [CATEGORY_FOLDER]: 'mimeTypeHelper:mimeTypeCategoryFolder',
  [CATEGORY_UNKNOWN]: 'mimeTypeHelper:mimeTypeCategoryUnknown'
};

const localizeCategory = (cat, t) => t(resourceKeyMap[cat]);

// Never returns CATEGORY_FOLDER
function getCategory(pathOrExtension) {
  const mimeType = mime.getType(pathOrExtension);
  if (!mimeType) {
    return CATEGORY_UNKNOWN;
  }

  const predefined = predefinedMappings[mimeType];
  if (predefined) {
    return predefined;
  }

  const [firstPart] = mimeType.split('/');
  switch (firstPart) {
    case 'audio':
      return CATEGORY_AUDIO;
    case 'image':
      return CATEGORY_IMAGE;
    case 'vido':
      return CATEGORY_VIDEO;
    case 'application':
      return CATEGORY_PROGRAM;
    default:
      return CATEGORY_UNKNOWN;
  }
}

export default {
  CATEGORY_TEXT,
  CATEGORY_MARKUP,
  CATEGORY_IMAGE,
  CATEGORY_VIDEO,
  CATEGORY_AUDIO,
  CATEGORY_ARCHIVE,
  CATEGORY_DOCUMENT,
  CATEGORY_SPREADSHEET,
  CATEGORY_PRESENTATION,
  CATEGORY_PROGRAM,
  CATEGORY_FOLDER,
  CATEGORY_UNKNOWN,
  resourceKeyMap,
  getCategory,
  localizeCategory
};
