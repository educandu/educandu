import moment from 'moment';
import xmlEscape from 'xml-escape';
import uniqueId from '../../utils/unique-id';

function createXmlContent() {
  // This is deflated url-escaped base64:
  const embeddedDiagram = [
    'jZJNb4MwDIZ/DcdKQGjXHTfGtkN7Qt20Y0RcEi0QlIYB+/ULwwGiqlJPsR9/xHmdgKRV/6Zpw4+KgQzikPUBeQniON4+JPYYyTCRiDxuJ1JqwZAtIB',
    'e/gDBE2goGFy/RKCWNaHxYqLqGwniMaq06P+2spH9rQ0u4AnlB5TX9FMxwpLswXALvIEruro5dpKIuG8GFU6a6FSJZQFKtlJmsqk9BjvI5Yaa61xvR',
    'eTINtbmnQJ5Y3qZfH/sniMNNtzsfyPcGu/xQ2eKLs8PxhAObwcmgVVszGBuFAXnuuDCQN7QYo53dvGXcVNJ6kTWxJWgD/c1Zo1kB+3lAVWD0YFOwIE',
    'HNBt/tlhXsHeMr9RMHKa69nDsvwlgDtXHusoP/2Oovk+wP'
  ].join('');

  const content = [
    `<mxfile host="app.diagrams.net" modified="${xmlEscape(moment.utc().toISOString())}" version="14.2.9">`,
    `  <diagram id="${xmlEscape(uniqueId.create())}" name="Page-1">${embeddedDiagram}</diagram>`,
    '</mxfile>'
  ].map(line => line.trim()).join('');

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="841px" height="441px" viewBox="-0.5 -0.5 841 441" content="${xmlEscape(content)}">`,
    '  <defs/>',
    '  <g>',
    '    <rect x="0" y="0" width="840" height="440" fill="#ffffff" stroke="#000000" pointer-events="all"/>',
    '    <g transform="translate(-0.5 -0.5)">',
    '      <switch>',
    '        <foreignObject style="overflow: visible; text-align: left;" pointer-events="none" width="100%" height="100%" requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility">',
    '          <div xmlns="http://www.w3.org/1999/xhtml" style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 838px; height: 1px; padding-top: 220px; margin-left: 1px;">',
    '            <div style="box-sizing: border-box; font-size: 0; text-align: center; ">',
    '              <div style="display: inline-block; font-size: 12px; font-family: Helvetica; color: #000000; line-height: 1.2; pointer-events: all; white-space: normal; word-wrap: normal; ">ELMU</div>',
    '            </div>',
    '          </div>',
    '        </foreignObject>',
    '        <text x="420" y="224" fill="#000000" font-family="Helvetica" font-size="12px" text-anchor="middle">ELMU</text>',
    '      </switch>',
    '    </g>',
    '  </g>',
    '  <switch>',
    '    <g requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"/>',
    '    <a transform="translate(0,-5)" xlink:href="https://www.diagrams.net/doc/faq/svg-export-text-problems" target="_blank">',
    '      <text text-anchor="middle" font-size="10px" x="50%" y="100%">Viewer does not support full SVG 1.1</text>',
    '    </a>',
    '  </switch>',
    '</svg>'
  ].map(line => line.trim()).join('');
}

export default {
  type: 'diagram-net',
  getName: t => t('diagramNet:name'),
  getDefaultContent: () => ({
    svgXml: createXmlContent(),
    maxWidth: 100
  })
};
