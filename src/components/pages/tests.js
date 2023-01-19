/* eslint-disable no-console */

import by from 'thenby';
import PropTypes from 'prop-types';
import UrlInput from '../url-input.js';
import ColorPicker from '../color-picker.js';
import ImageEditor from '../image-editor.js';
import Timeline from '../media-player/timeline.js';
import { useRequest } from '../request-context.js';
import DebouncedInput from '../debounced-input.js';
import { useService } from '../container-context.js';
import MusicXmlDocument from '../music-xml-document.js';
import { removeItemAt } from '../../utils/array-utils.js';
import DimensionsProvider from '../dimensions-provider.js';
import React, { useEffect, useRef, useState } from 'react';
import ResourcePicker from '../resource-picker/resource-picker.js';
import NeverScrollingTextArea from '../never-scrolling-text-area.js';
import ResourceSelector from '../resource-picker/resource-selector.js';
import AudioWaveformCanvas from '../../plugins/audio-waveform/audio-waveform-canvas.js';
import WikimediaApiClient, { FILE_TYPE } from '../../api-clients/wikimedia-api-client.js';
import { Button, Checkbox, Form, Input, InputNumber, Radio, Slider, Tabs, message } from 'antd';
import { HORIZONTAL_ALIGNMENT, SOURCE_TYPE, VERTICAL_ALIGNMENT } from '../../domain/constants.js';
import {
  DEFAULT_WAVEFORM_BACKGROUND_COLOR,
  DEFAULT_WAVEFORM_BASELINE_COLOR,
  DEFAULT_WAVEFORM_PEN_COLOR,
  DEFAULT_WAVEFORM_PEN_WIDTH,
  DEFAULT_WAVEFORM_SMOOTHING
} from '../../plugins/audio-waveform/constants.js';

const { Search, TextArea } = Input;

const IMAGE_URL_JPG = 'https://cdn.openmusic.academy/media/4WqqhJRDsogBFGVbZrfuaF/Banner_hGsJz5kf2pGsXygBX8ZJ97.jpg';
const IMAGE_URL_PNG = 'https://cdn.openmusic.academy/media/2Sss3iioh1dpoBnYPTq9Rn/Bossa%20Nova%20Groovetabelle_aWvhsm8RX9hXFRrF3hk4Pu.png';

const createTimelinePart = (startPosition, key) => ({ key, title: `Part ${key}`, startPosition });

function Tests({ PageTemplate }) {
  // Page
  const req = useRequest();
  const initialTab = req.query.tab || null;
  const handleTabChange = newTab => {
    const url = new URL(window.document.location.href);
    url.searchParams.set('tab', newTab);
    window.history.replaceState(null, null, url.href);
  };
  const handleCopyToClipboard = async clipboardText => {
    await window.navigator.clipboard.writeText(clipboardText);
    message.success('Copied to clipboard');
  };

  // WikimediaApiClient
  const [wikimediaQuery, setWikimediaQuery] = useState('');
  const [wikimediaResult, setWikimediaResult] = useState('');
  const wikimediaApiClient = useService(WikimediaApiClient);
  const [wikimediaFileTypes, setWikimediaFileTypes] = useState(Object.values(FILE_TYPE));
  const handleWikimediaSearchClick = async () => {
    const data = await wikimediaApiClient.queryMediaFiles({ searchText: wikimediaQuery, fileTypes: wikimediaFileTypes });
    setWikimediaResult(JSON.stringify(data, null, 2));
    // For future reference: `data.continue.gsroffset` (if set) gives us the next offset to load even more results:
    const canLoadMore = Number.isFinite(data.continue?.gsroffset);
    console.log('canLoadMore', canLoadMore);
  };

  // AudioWaveformCanvas
  const awcApiRef = useRef();
  const [awcPenWidth, setAwcPenWidth] = useState(DEFAULT_WAVEFORM_PEN_WIDTH);
  const [awcSmoothing, setAwcSmoothing] = useState(DEFAULT_WAVEFORM_SMOOTHING);
  const [awcPenColor, setAwcPenColor] = useState(DEFAULT_WAVEFORM_PEN_COLOR);
  const [awcBaselineColor, setAwcBaselineColor] = useState(DEFAULT_WAVEFORM_BASELINE_COLOR);
  const [awcBackgroundColor, setAwcBackgroundColor] = useState(DEFAULT_WAVEFORM_BACKGROUND_COLOR);

  // MusicXmlDocument
  const mxdSources = [
    { title: '<empty>', url: '' },
    { title: 'Bach - Praeludium in C-Dur', url: 'https://cdn.staging.openmusic.academy/media/j4VnRosMXE1mdX24fA4aPJ/johann-sebastian-bach-praeludium-in-c-dur-bwv-846-1-648QZxTSjXRPVB99ULym1Y.xml' },
    { title: 'Beethoven - An die ferne Geliebte', url: 'https://cdn.staging.openmusic.academy/media/j4VnRosMXE1mdX24fA4aPJ/beethoven-an-die-ferne-geliebte-4hzPUSv3Xk51CcVjM8eJPc.xml' }
  ];
  const [mxdUrl, setMxdUrl] = useState('');
  const [mxdZoom, setMxdZoom] = useState(1);

  // DebouncedInput
  const diElementTypes = {
    Input: { elementType: Input, handleSearch: false },
    Search: { elementType: Search, handleSearch: true },
    TextArea: { elementType: TextArea, handleSearch: false }
  };
  const diApiRef = useRef();
  const diEventLogRef = useRef();
  const [diEventLog, setDiEventLog] = useState('');
  const [diTimeLimit, setDiTimeLimit] = useState(2000);
  const [diValue, setDiValue] = useState('Lorem ipsum');
  const [diElementType, setDiElementType] = useState(Object.keys(diElementTypes)[0]);
  const handleDiEvent = (eventName, ...args) => {
    if (eventName === 'onChange') {
      setDiValue(args[0]);
    }
    setDiEventLog(currentLog => args.length
      ? `${currentLog}[${new Date().toISOString()}] ${eventName}: ${JSON.stringify(args.length > 1 ? args : args[0])}\n`
      : `${currentLog}[${new Date().toISOString()}] ${eventName}\n`);
    setTimeout(() => {
      const eventLogElement = diEventLogRef.current;
      eventLogElement.scrollTop = eventLogElement.scrollHeight;
    }, 0);
  };

  // ImageEditor
  const ieEditorRef = useRef(null);
  const [ieFile, setIeFile] = useState(null);
  const [ieIsDirty, setIeIsDirty] = useState(false);
  const [ieFileUrl, setIeFileUrl] = useState(IMAGE_URL_JPG);
  useEffect(() => {
    const type = ieFileUrl.endsWith('.png') ? 'image/png' : 'image/jpeg';
    const extension = type === 'image/png' ? 'png' : 'jpg';
    fetch(ieFileUrl)
      .then(res => res.blob())
      .then(blob => setIeFile(new File([blob], `my-image.${extension}`, { type })));
  }, [ieFileUrl]);
  const handleIeCrop = data => {
    setIeIsDirty(data.isCropped);
  };
  const handleIeDownloadClick = async () => {
    const newFile = await ieEditorRef.current.getCroppedFile();
    const newUrl = URL.createObjectURL(newFile);
    window.open(newUrl, '_blank');
  };

  // Timeline
  const [timelineDuration, setTimelineDuration] = useState(5 * 60 * 1000);
  const [timelineParts, setTimelineParts] = useState([createTimelinePart(0, '1'), createTimelinePart(0.25, '2'), createTimelinePart(0.5, '3')]);
  const handleTimelinePartAdd = startPosition => {
    setTimelineParts(oldParts => [
      ...oldParts,
      createTimelinePart(startPosition, `${Math.max(...oldParts.map(p => Number(p.key))) + 1}`)
    ].sort(by(p => p.startPosition)));
  };
  const handleTimelinePartDelete = key => {
    const partIndex = timelineParts.findIndex(p => p.key === key);
    const deletedPartTimeCode = timelineParts[partIndex].startPosition;
    const newParts = removeItemAt(timelineParts, partIndex);
    const followingPart = newParts[partIndex];
    if (followingPart) {
      followingPart.startPosition = deletedPartTimeCode;
    }
    setTimelineParts(newParts.sort(by(p => p.startPosition)));
  };
  const handleTimelineStartPositionChange = (key, newValue) => {
    setTimelineParts(oldParts => oldParts.map(p => p.key === key ? { ...p, startPosition: newValue } : p).sort(by(p => p.startTimecode)));
  };

  // ResourcePicker
  const [rsResourceUrl, setRsResourceUrl] = useState('');

  // NeverScrollingTextArea
  const [nstaValue1, setNstaValue1] = useState('Hello World');
  const [nstaValue2, setNstaValue2] = useState('Hello World');
  const [nstaValue3, setNstaValue3] = useState('Hello World');
  const [nstaValue4, setNstaValue4] = useState('Hello World');
  const [nstaValue5, setNstaValue5] = useState('Hello World');
  const [nstaValue6, setNstaValue6] = useState('Hello World');

  // UrlInput
  const [urlInputValue, setUrlInputValue] = useState('');
  const handleUrlInputCopyYoutubeClick = () => handleCopyToClipboard('https://www.youtube.com/watch?v=221F55VPp2M');
  const handleUrlInputCopyWikimediaClick = () => handleCopyToClipboard('https://upload.wikimedia.org/wikipedia/commons/2/28/Cantaloupes.jpg');
  const handleUrlInputCopyExternalClick = () => handleCopyToClipboard('https://imagesvc.meredithcorp.io/v3/mm/image?url=https%3A%2F%2Fstatic.onecms.io%2Fwp-content%2Fuploads%2Fsites%2F6%2F2014%2F05%2Ffriends-a-apartment-bet_0.jpg&q=60');
  const handleUrlInputCopyRoomMediaCdnClick = () => handleCopyToClipboard('http://localhost:10000/rooms/vmQouBT6CqeWe35STsBvnj/media/pug-cfAdTfMQ3A9Pbsskv79Sms.jpeg');
  const handleUrlInputCopyDocumentMediaCdnClick = () => handleCopyToClipboard('http://localhost:10000/media/7vgRduWGhBBD6HxWUnN1NV/dog-eAyeL9Z3QQXDXGMm4U636M.jpg');
  const handleUrlInputSetYoutubeClick = () => setUrlInputValue('https://www.youtube.com/watch?v=221F55VPp2M');
  const handleUrlInputSetWikimediaClick = () => setUrlInputValue('https://upload.wikimedia.org/wikipedia/commons/2/28/Cantaloupes.jpg');
  const handleUrlInputSetExternalClick = () => setUrlInputValue('https://imagesvc.meredithcorp.io/v3/mm/image?url=https%3A%2F%2Fstatic.onecms.io%2Fwp-content%2Fuploads%2Fsites%2F6%2F2014%2F05%2Ffriends-a-apartment-bet_0.jpg&q=60');
  const handleUrlInputSetRoomMediaCdnClick = () => setUrlInputValue('http://localhost:10000/rooms/vmQouBT6CqeWe35STsBvnj/media/pug-cfAdTfMQ3A9Pbsskv79Sms.jpeg');
  const handleUrlInputSetDocumentMediaCdnClick = () => setUrlInputValue('http://localhost:10000/media/7vgRduWGhBBD6HxWUnN1NV/dog-eAyeL9Z3QQXDXGMm4U636M.jpg');
  const handleUrlInputChange = url => {
    setUrlInputValue(url);
  };

  return (
    <PageTemplate>
      <div className="TestsPage">
        <Tabs
          defaultActiveKey={initialTab}
          onChange={handleTabChange}
          destroyInactiveTabPane
          items={[
            {
              key: 'WikimediaApiClient',
              label: 'WikimediaApiClient',
              children: (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', whiteSpace: 'nowrap' }}>
                    File types:
                    <Checkbox.Group options={Object.values(FILE_TYPE)} value={wikimediaFileTypes} onChange={setWikimediaFileTypes} />
                    Search text:
                    <Input value={wikimediaQuery} onChange={event => setWikimediaQuery(event.target.value)} />
                    <Button type="primary" onClick={handleWikimediaSearchClick}>Search</Button>
                  </div>
                  <pre style={{ backgroundColor: '#fbfbfb', border: '1px solid #e3e3e3', padding: '2px', fontSize: '9px', minHeight: '200px' }}>
                    {wikimediaResult}
                  </pre>
                </div>
              )
            },
            {
              key: 'UrlInput',
              label: 'UrlInput',
              children: (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                    <Button onClick={handleUrlInputCopyYoutubeClick}>Copy Youtube URL</Button>
                    <Button onClick={handleUrlInputCopyWikimediaClick}>Copy Wikimedia URL</Button>
                    <Button onClick={handleUrlInputCopyExternalClick}>Copy external URL</Button>
                    <Button onClick={handleUrlInputCopyRoomMediaCdnClick}>Copy room-media CDN URL</Button>
                    <Button onClick={handleUrlInputCopyDocumentMediaCdnClick}>Copy document-media CDN URL</Button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                    <Button onClick={handleUrlInputSetYoutubeClick}>Set Youtube URL</Button>
                    <Button onClick={handleUrlInputSetWikimediaClick}>Set Wikimedia URL</Button>
                    <Button onClick={handleUrlInputSetExternalClick}>Set external URL</Button>
                    <Button onClick={handleUrlInputSetRoomMediaCdnClick}>Set room-media CDN URL</Button>
                    <Button onClick={handleUrlInputSetDocumentMediaCdnClick}>Set document-media CDN URL</Button>
                  </div>
                  <UrlInput value={urlInputValue} onChange={handleUrlInputChange} />
                </div>
              )
            },
            {
              key: 'AudioWaveformCanvas',
              label: 'AudioWaveformCanvas',
              children: (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                    Pen width:
                    <Slider style={{ width: '100px' }} min={1} max={5} step={1} value={awcPenWidth} onChange={value => setAwcPenWidth(value)} />
                    Smoothing:
                    <Checkbox checked={awcSmoothing} onChange={event => setAwcSmoothing(event.target.checked)} />
                    Pen color:
                    <ColorPicker color={awcPenColor} onChange={value => setAwcPenColor(value)} />
                    Baseline color:
                    <ColorPicker color={awcBaselineColor} onChange={value => setAwcBaselineColor(value)} />
                    Background color:
                    <ColorPicker color={awcBackgroundColor} onChange={value => setAwcBackgroundColor(value)} />
                    <Button onClick={() => awcApiRef.current.clear()}>Reset</Button>
                  </div>
                  <div style={{ border: '1px solid silver' }}>
                    <DimensionsProvider>
                      {({ containerWidth }) => (
                        <AudioWaveformCanvas
                          apiRef={awcApiRef}
                          width={containerWidth}
                          height={Math.round(containerWidth / 2.5)}
                          penWidth={awcPenWidth}
                          smoothing={awcSmoothing}
                          penColor={awcPenColor}
                          baselineColor={awcBaselineColor}
                          backgroundColor={awcBackgroundColor}
                          />
                      )}
                    </DimensionsProvider>
                  </div>
                </div>
              )
            },
            {
              key: 'MusicXmlDocument',
              label: 'MusicXmlDocument',
              children: (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                    <div>Load Url:</div>
                    {mxdSources.map(({ title, url }) => <Button key={url} onClick={() => setMxdUrl(url)}>{title}</Button>)}
                    <div>Zoom:</div>
                    <Slider style={{ width: '200px' }} min={0.5} max={1.5} step={0.05} value={mxdZoom} onChange={setMxdZoom} />
                  </div>
                  <MusicXmlDocument url={mxdUrl} zoom={mxdZoom} />
                </div>
              )
            },
            {
              key: 'DebouncedInput',
              label: 'DebouncedInput',
              children: (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                    Element type:
                    <Radio.Group value={diElementType} onChange={event => setDiElementType(event.target.value)}>
                      {Object.keys(diElementTypes).map(key => <Radio.Button key={key} value={key}>{key}</Radio.Button>)}
                    </Radio.Group>
                    Time limit:
                    <InputNumber min={0} max={Number.MAX_SAFE_INTEGER} step={500} value={diTimeLimit} onChange={setDiTimeLimit} />
                    <Button onClick={() => diApiRef.current.flush()}>Flush</Button>
                  </div>
                  <div>Event Log</div>
                  <div ref={diEventLogRef} style={{ height: '140px', overflow: 'auto', border: '1px solid #ddd', backgroundColor: '#fbfbfb', fontSize: '10px', marginBottom: '15px' }}>
                    <pre>{diEventLog}</pre>
                  </div>
                  <DebouncedInput
                    apiRef={diApiRef}
                    timeLimit={diTimeLimit}
                    elementType={diElementTypes[diElementType].elementType}
                    value={diValue}
                    onChange={value => handleDiEvent('onChange', value)}
                    {...(diElementTypes[diElementType].handleSearch ? { onSearch: value => handleDiEvent('onSearch', value) } : {})}
                    />
                </div>
              )
            },
            {
              key: 'ImageEditor',
              label: 'ImageEditor',
              children: (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                    <Button onClick={() => setIeFileUrl(IMAGE_URL_PNG)}>Set to PNG</Button>
                    <Button onClick={() => setIeFileUrl(IMAGE_URL_JPG)}>Set to JPG</Button>
                    <Button onClick={handleIeDownloadClick}>Download</Button>
                    <div>DIRTY: {ieIsDirty.toString()}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                    URL: {ieFileUrl}
                  </div>
                  {!!ieFile && (
                  <div style={{ height: '50vh' }}>
                    <ImageEditor file={ieFile} editorRef={ieEditorRef} onCrop={handleIeCrop} />
                  </div>
                  )}
                </div>
              )
            },
            {
              key: 'Timeline',
              label: 'Timeline',
              children: (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                    Duration in milliseconds:
                    <InputNumber min={0} max={Number.MAX_SAFE_INTEGER} step={1} value={timelineDuration} onChange={setTimelineDuration} />
                    <Button onClick={() => setTimelineDuration(0)}>Set to unknown</Button>
                    <Button onClick={() => setTimelineDuration(5 * 60 * 1000)}>Set to 5 minutes</Button>
                    <Button onClick={() => setTimelineDuration(10 * 60 * 1000)}>Set to 10 minutes</Button>
                  </div>
                  <Timeline
                    durationInMilliseconds={timelineDuration}
                    parts={timelineParts}
                    selectedPartIndex={-1}
                    onPartAdd={handleTimelinePartAdd}
                    onPartDelete={handleTimelinePartDelete}
                    onStartPositionChange={handleTimelineStartPositionChange}
                    />
                </div>
              )
            },
            {
              key: 'ResourceSelector',
              label: 'ResourceSelector',
              children: (
                <div>
                  <ResourceSelector
                    allowedSourceTypes={[SOURCE_TYPE.roomMedia, SOURCE_TYPE.documentMedia, SOURCE_TYPE.wikimedia]}
                    onSelect={ev => console.log('select', ev)}
                    onCancel={ev => console.log('cancel', ev)}
                    />
                </div>
              )
            },
            {
              key: 'ResourcePicker',
              label: 'ResourcePicker',
              children: (
                <div>
                  <div style={{ display: 'grid', gap: '15px', gridTemplateColumns: '1fr auto' }}>
                    <Input
                      value={rsResourceUrl}
                      onChange={event => setRsResourceUrl(event.target.value)}
                      />
                    <ResourcePicker
                      url={rsResourceUrl}
                      onUrlChange={setRsResourceUrl}
                      />
                  </div>
                </div>
              )
            },
            {
              key: 'NeverScrollingTextArea',
              label: 'NeverScrollingTextArea',
              children: (
                <div>
                  <h4>Grid aligned</h4>
                  <div style={{ display: 'grid', gridAutoFlow: 'column', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', backgroundColor: '#f5f5f5', padding: '5px' }}>
                    <NeverScrollingTextArea value={nstaValue1} onChange={event => setNstaValue1(event.target.value)} minRows={3} />
                    <NeverScrollingTextArea value={nstaValue2} onChange={event => setNstaValue2(event.target.value)} minRows={4} />
                    <NeverScrollingTextArea value={nstaValue3} onChange={event => setNstaValue3(event.target.value)} minRows={5} />
                  </div>
                  <br />
                  <h4>Alignment</h4>
                  <div style={{ display: 'grid', gridAutoFlow: 'column', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', backgroundColor: '#f5f5f5', padding: '5px', minHeight: '100px' }}>
                    <NeverScrollingTextArea value={nstaValue4} onChange={event => setNstaValue4(event.target.value)} minRows={1} verticalAlignment={VERTICAL_ALIGNMENT.top} horizontalAlignment={HORIZONTAL_ALIGNMENT.left} />
                    <NeverScrollingTextArea value={nstaValue5} onChange={event => setNstaValue5(event.target.value)} minRows={1} verticalAlignment={VERTICAL_ALIGNMENT.middle} horizontalAlignment={HORIZONTAL_ALIGNMENT.center} />
                    <NeverScrollingTextArea value={nstaValue6} onChange={event => setNstaValue6(event.target.value)} minRows={1} verticalAlignment={VERTICAL_ALIGNMENT.bottom} horizontalAlignment={HORIZONTAL_ALIGNMENT.right} />
                  </div>
                  <br />
                  <h4>Within Form</h4>
                  <Form initialValues={{ ta1: 'Hello World', ta2: 'Hello World', ta3: 'Hello World', ta4: 'Hello World', ta5: 'Hello World', ta6: 'Hello World' }}>
                    <div style={{ display: 'grid', gridAutoFlow: 'column', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', backgroundColor: '#f5f5f5', padding: '5px' }}>
                      <Form.Item name="ta1" validateStatus="success" hasFeedback>
                        <NeverScrollingTextArea minRows={3} />
                      </Form.Item>
                      <Form.Item name="ta2" validateStatus="warning" hasFeedback>
                        <NeverScrollingTextArea minRows={4} />
                      </Form.Item>
                      <Form.Item name="ta3" validateStatus="error" hasFeedback>
                        <NeverScrollingTextArea minRows={5} />
                      </Form.Item>
                      <Form.Item name="ta4" validateStatus="validating" hasFeedback>
                        <NeverScrollingTextArea minRows={3} />
                      </Form.Item>
                      <Form.Item name="ta5">
                        <NeverScrollingTextArea minRows={4} disabled />
                      </Form.Item>
                      <Form.Item name="ta6" validateStatus="error" hasFeedback>
                        <NeverScrollingTextArea minRows={5} disabled />
                      </Form.Item>
                    </div>
                  </Form>
                </div>
              )
            }
          ]}
          />
      </div>
    </PageTemplate>
  );
}

Tests.propTypes = {
  PageTemplate: PropTypes.func.isRequired
};

export default Tests;
