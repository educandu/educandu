/* eslint-disable no-console */

import by from 'thenby';
import axios from 'axios';
import PropTypes from 'prop-types';
import UrlInput from '../url-input.js';
import TagSelect from '../tag-select.js';
import ColorPicker from '../color-picker.js';
import ImageEditor from '../image-editor.js';
import LicenseSelect from '../license-select.js';
import MarkdownInput from '../markdown-input.js';
import DocumentRating from '../document-rating.js';
import Timeline from '../media-player/timeline.js';
import { useRequest } from '../request-context.js';
import DebouncedInput from '../debounced-input.js';
import { UploadOutlined } from '@ant-design/icons';
import { useService } from '../container-context.js';
import MusicXmlDocument from '../music-xml-document.js';
import { removeItemAt } from '../../utils/array-utils.js';
import DimensionsProvider from '../dimensions-provider.js';
import React, { useEffect, useRef, useState } from 'react';
import LanguageSelect from '../localization/language-select.js';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import { RoomMediaContextProvider } from '../room-media-context.js';
import NeverScrollingTextArea from '../never-scrolling-text-area.js';
import ResourceSelector from '../resource-selector/resource-selector.js';
import { WIKIMEDIA_API_FILE_TYPE } from '../../utils/wikimedia-utils.js';
import WikimediaApiClient from '../../api-clients/wikimedia-api-client.js';
import MediaLibraryApiClient from '../../api-clients/media-library-api-client.js';
import { roomMediaContextShape, roomShape } from '../../ui/default-prop-types.js';
import AudioWaveformCanvas from '../../plugins/audio-waveform/audio-waveform-canvas.js';
import { HORIZONTAL_ALIGNMENT, SOURCE_TYPE, VERTICAL_ALIGNMENT } from '../../domain/constants.js';
import { Button, Checkbox, Form, Input, InputNumber, Radio, Slider, Tabs, message, Upload } from 'antd';
import MediaLibraryMetadataForm from '../resource-selector/media-library/media-library-metadata-form.js';
import {
  DEFAULT_WAVEFORM_BACKGROUND_COLOR,
  DEFAULT_WAVEFORM_BASELINE_COLOR,
  DEFAULT_WAVEFORM_PEN_COLOR,
  DEFAULT_WAVEFORM_PEN_WIDTH,
  DEFAULT_WAVEFORM_SMOOTHING
} from '../../plugins/audio-waveform/constants.js';
import DaysOfWeekSelect from '../days-of-week-select.js';

const { Search, TextArea } = Input;

const IMAGE_URL_JPG = 'https://cdn.openmusic.academy/media-library/Banner_hGsJz5kf2pGsXygBX8ZJ97.jpg';
const IMAGE_URL_PNG = 'https://cdn.openmusic.academy/media-library/Bossa%20Nova%20Groovetabelle_aWvhsm8RX9hXFRrF3hk4Pu.png';

const createTimelinePart = (startPosition, key) => ({ key, title: `Part ${key}`, startPosition });

function Tests({ PageTemplate, initialState }) {
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

  // DaysOfWeekSelect
  const [daysOfWeekSelectValue, setDaysOfWeekSelectValue] = useState('');

  // DocumentRequests
  const [documentRequestsYear, setDocumentRequestsYear] = useState('2023');
  const handleDocumentRequestsGoClick = () => {
    const postUrl = `/api/v1/tests/create-document-requests/${encodeURIComponent(documentRequestsYear)}`;
    axios.post(postUrl).catch(error => {
      console.error(error);
    });
    // eslint-disable-next-line no-alert
    window.alert('Started DocumentRequests creation, check your console!');
  };

  // DocumentRating
  const [documentRatingValue, setDocumentRatingValue] = useState(3.7);
  const [documentRatingSmall, setDocumentRatingSmall] = useState(false);
  const [documentRatingOneLine, setDocumentRatingOneLine] = useState(false);
  const [documentRatingTotalCount, setDocumentRatingTotalCount] = useState(15);

  // MediaLibraryMetadataForm
  const [mediaLibraryMetadataForm] = Form.useForm();
  const [mediaLibraryMetadataFormResult, setMediaLibraryMetadataFormResult] = useState(null);
  const handleMediaLibraryMetadataFormFinish = result => setMediaLibraryMetadataFormResult(result);
  const handleMediaLibraryMetadataFormSubmitClick = () => mediaLibraryMetadataForm.submit();
  const handleMediaLibraryMetadataFormResetClick = () => {
    mediaLibraryMetadataForm.resetFields();
    setMediaLibraryMetadataFormResult(null);
  };

  // ResourceSelector
  const [rsResourceUrl, setRsResourceUrl] = useState('');

  // MediaLibrary
  const mediaLibraryApiClient = useSessionAwareApiClient(MediaLibraryApiClient);
  const [mediaLibraryUrl, setMediaLibraryUrl] = useState('');
  const [mediaLibraryShortDescription, setMediaLibraryShortDescription] = useState('');
  const [mediaLibraryLanguages, setMediaLibraryLanguages] = useState([]);
  const [mediaLibraryLicenses, setMediaLibraryLicenses] = useState([]);
  const [mediaLibraryTags, setMediaLibraryTags] = useState([]);
  const [mediaLibraryFileList, setMediaLibraryFileList] = useState([]);
  const handleMediaLibraryTagSuggestionsNeeded = searchText => {
    return mediaLibraryApiClient.getMediaLibraryTagSuggestions(searchText).catch(error => {
      console.error(error);
      return [];
    });
  };
  const handleMediaLibraryUploadClick = async () => {
    const newItem = await mediaLibraryApiClient.createMediaLibraryItem({
      file: mediaLibraryFileList[0].originFileObj,
      shortDescription: mediaLibraryShortDescription,
      languages: mediaLibraryLanguages,
      licenses: mediaLibraryLicenses,
      tags: mediaLibraryTags
    });
    console.log(newItem);
    setMediaLibraryUrl(newItem.url);
  };

  // WikimediaApiClient
  const [wikimediaQuery, setWikimediaQuery] = useState('');
  const [wikimediaResult, setWikimediaResult] = useState('');
  const wikimediaApiClient = useService(WikimediaApiClient);
  const [wikimediaFileTypes, setWikimediaFileTypes] = useState(Object.values(WIKIMEDIA_API_FILE_TYPE));
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
    { title: 'Bach - Praeludium in C-Dur', url: 'https://cdn.staging.openmusic.academy/media-library/johann-sebastian-bach-praeludium-in-c-dur-bwv-846-1-648QZxTSjXRPVB99ULym1Y.xml' },
    { title: 'Beethoven - An die ferne Geliebte', url: 'https://cdn.staging.openmusic.academy/media-library/beethoven-an-die-ferne-geliebte-4hzPUSv3Xk51CcVjM8eJPc.xml' }
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

  // MarkdownInput
  const miEventLogRef = useRef();
  const [miValue, setMiValue] = useState('');
  const [miInline, setMiInline] = useState(false);
  const [miEventLog, setMiEventLog] = useState('');
  const [miDisabled, setMiDisabled] = useState(false);
  const [miDebounced, setMiDebounced] = useState(false);
  const [miSanitizeCdnUrls, setMiSanitizeCdnUrls] = useState(false);
  const handleMiEvent = (eventName, ...args) => {
    if (eventName === 'onChange') {
      setMiValue(args[0]);
    }
    setMiEventLog(currentLog => args.length
      ? `${currentLog}[${new Date().toISOString()}] ${eventName}: ${JSON.stringify(args.length > 1 ? args : args[0])}\n`
      : `${currentLog}[${new Date().toISOString()}] ${eventName}\n`);
    setTimeout(() => {
      const eventLogElement = miEventLogRef.current;
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
  const handleUrlInputCopyRoomMediaCdnClick = () => handleCopyToClipboard('http://localhost:10000/rooms/vmQouBT6CqeWe35STsBvnj/pug-cfAdTfMQ3A9Pbsskv79Sms.jpeg');
  const handleUrlInputCopyMediaLibraryCdnClick = () => handleCopyToClipboard('http://localhost:10000/media-library/dog-eAyeL9Z3QQXDXGMm4U636M.jpg');
  const handleUrlInputSetYoutubeClick = () => setUrlInputValue('https://www.youtube.com/watch?v=221F55VPp2M');
  const handleUrlInputSetWikimediaClick = () => setUrlInputValue('https://upload.wikimedia.org/wikipedia/commons/2/28/Cantaloupes.jpg');
  const handleUrlInputSetExternalClick = () => setUrlInputValue('https://imagesvc.meredithcorp.io/v3/mm/image?url=https%3A%2F%2Fstatic.onecms.io%2Fwp-content%2Fuploads%2Fsites%2F6%2F2014%2F05%2Ffriends-a-apartment-bet_0.jpg&q=60');
  const handleUrlInputSetRoomMediaCdnClick = () => setUrlInputValue('http://localhost:10000/rooms/vmQouBT6CqeWe35STsBvnj/pug-cfAdTfMQ3A9Pbsskv79Sms.jpeg');
  const handleUrlInputSetMediaLibrareyCdnClick = () => setUrlInputValue('http://localhost:10000/media-library/dog-eAyeL9Z3QQXDXGMm4U636M.jpg');
  const handleUrlInputChange = url => setUrlInputValue(url);

  return (
    <RoomMediaContextProvider context={initialState.roomMediaContext}>
      <PageTemplate>
        <div className="TestsPage">
          <Tabs
            defaultActiveKey={initialTab}
            onChange={handleTabChange}
            destroyInactiveTabPane
            items={[
              {
                key: 'DaysOfWeekSelect',
                label: 'DaysOfWeekSelect',
                children: (
                  <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: '400px 1fr', gridAutoFlow: 'column' }}>
                    <DaysOfWeekSelect value={daysOfWeekSelectValue} onChange={setDaysOfWeekSelectValue} />
                    <span>Current value: {JSON.stringify(daysOfWeekSelectValue)}</span>
                  </div>
                )
              },
              {
                key: 'DocumentRequests',
                label: 'DocumentRequests',
                children: (
                  <div>
                    Create 10.000 document requests per day in year:
                    &nbsp;
                    <Input
                      style={{ width: '100px' }}
                      value={documentRequestsYear}
                      onChange={event => setDocumentRequestsYear(event.target.value)}
                      />
                    &nbsp;&nbsp;&nbsp;
                    <Button type="primary" onClick={handleDocumentRequestsGoClick}>GO!</Button>
                  </div>
                )
              },
              {
                key: 'DocumentRating',
                label: 'DocumentRating',
                children: (
                  <div>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                      <Checkbox checked={documentRatingSmall} onChange={event => setDocumentRatingSmall(event.target.checked)}>Small</Checkbox>
                      <Checkbox checked={documentRatingOneLine} onChange={event => setDocumentRatingOneLine(event.target.checked)}>OneLine</Checkbox>
                      <div>Value:</div>
                      <InputNumber min={0} max={5} precision={3} step={0.1} value={documentRatingValue ?? 0} onChange={setDocumentRatingValue} />
                      <Checkbox checked={documentRatingValue === null} onChange={event => setDocumentRatingValue(event.target.checked ? null : 0)}>null</Checkbox>
                      <div>TotalCount:</div>
                      <InputNumber min={0} step={1} value={documentRatingTotalCount} onChange={setDocumentRatingTotalCount} />
                    </div>
                    <div>
                      <DocumentRating value={documentRatingValue} totalCount={documentRatingTotalCount} oneLine={documentRatingOneLine} small={documentRatingSmall} />
                    </div>
                  </div>
                )
              },
              {
                key: 'MediaLibraryMetadataForm',
                label: 'MediaLibraryMetadataForm',
                children: (
                  <div>
                    <h3>Form</h3>
                    <MediaLibraryMetadataForm form={mediaLibraryMetadataForm} onFinish={handleMediaLibraryMetadataFormFinish} />
                    <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                      <Button type="primary" onClick={handleMediaLibraryMetadataFormSubmitClick}>Submit</Button>
                      <Button type="primary" onClick={handleMediaLibraryMetadataFormResetClick}>Reset</Button>
                    </div>
                    <h3 style={{ marginTop: '50px' }}>Result</h3>
                    <pre style={{ backgroundColor: '#fbfbfb', border: '1px solid #e3e3e3', padding: '2px', fontSize: '9px', minHeight: '200px' }}>
                      {!!mediaLibraryMetadataFormResult && JSON.stringify(mediaLibraryMetadataFormResult, null, 2)}
                    </pre>
                  </div>
                )
              },
              {
                key: 'ResourceSelector',
                label: 'ResourceSelector',
                children: (
                  <div>
                    <h3>Select</h3>
                    <div>
                      <UrlInput value={rsResourceUrl} onChange={setRsResourceUrl} />
                    </div>
                    <h3>Dialog Content</h3>
                    <div style={{ border: '2px solid silver', padding: '10px' }}>
                      <ResourceSelector
                        allowedSourceTypes={[SOURCE_TYPE.mediaLibrary, SOURCE_TYPE.roomMedia, SOURCE_TYPE.MediaLibrary, SOURCE_TYPE.wikimedia]}
                        initialUrl={rsResourceUrl}
                        onSelect={setRsResourceUrl}
                        />
                    </div>
                  </div>
                )
              },
              {
                key: 'MediaLibrary',
                label: 'MediaLibrary',
                children: (
                  <div style={{ display: 'grid', gridTemplateColumns: '100px 640px', alignItems: 'center', gap: '10px' }}>
                    <div style={{ gridColumnStart: 1, gridColumnEnd: 3 }}>
                      <h3>Select</h3>
                    </div>
                    <div style={{ gridColumnStart: 1, gridColumnEnd: 3 }}>
                      <UrlInput value={mediaLibraryUrl} onChange={setMediaLibraryUrl} allowedSourceTypes={[SOURCE_TYPE.mediaLibrary]} />
                    </div>
                    <div style={{ gridColumnStart: 1, gridColumnEnd: 3 }}>
                      <h3>Upload</h3>
                    </div>
                    <div>Description:</div>
                    <TextArea rows={3} value={mediaLibraryShortDescription} onChange={event => setMediaLibraryShortDescription(event.target.value)} />
                    <div>Languages:</div>
                    <LanguageSelect multi value={mediaLibraryLanguages} onChange={setMediaLibraryLanguages} />
                    <div>Licenses:</div>
                    <LicenseSelect multi value={mediaLibraryLicenses} onChange={setMediaLibraryLicenses} />
                    <div>Tags:</div>
                    <TagSelect value={mediaLibraryTags} onChange={setMediaLibraryTags} onSuggestionsNeeded={handleMediaLibraryTagSuggestionsNeeded} />
                    <div>File:</div>
                    <Upload maxCount={1} multiple={false} fileList={mediaLibraryFileList} onChange={({ fileList }) => setMediaLibraryFileList(fileList)}>
                      <Button icon={<UploadOutlined />}>Select file</Button>
                    </Upload>
                    <div>&nbsp;</div>
                    <Button type="primary" onClick={handleMediaLibraryUploadClick}>Upload</Button>
                  </div>
                )
              },
              {
                key: 'WikimediaApiClient',
                label: 'WikimediaApiClient',
                children: (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', whiteSpace: 'nowrap' }}>
                      File types:
                      <Checkbox.Group options={Object.values(WIKIMEDIA_API_FILE_TYPE)} value={wikimediaFileTypes} onChange={setWikimediaFileTypes} />
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
                      <Button onClick={handleUrlInputCopyMediaLibraryCdnClick}>Copy media-library CDN URL</Button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                      <Button onClick={handleUrlInputSetYoutubeClick}>Set Youtube URL</Button>
                      <Button onClick={handleUrlInputSetWikimediaClick}>Set Wikimedia URL</Button>
                      <Button onClick={handleUrlInputSetExternalClick}>Set external URL</Button>
                      <Button onClick={handleUrlInputSetRoomMediaCdnClick}>Set room-media CDN URL</Button>
                      <Button onClick={handleUrlInputSetMediaLibrareyCdnClick}>Set media library CDN URL</Button>
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
                      onBlur={() => handleDiEvent('onBlur')}
                      onChange={event => handleDiEvent('onChange', event.target.value)}
                      {...(diElementTypes[diElementType].handleSearch ? { onSearch: value => handleDiEvent('onSearch', value) } : {})}
                      />
                  </div>
                )
              },
              {
                key: 'MarkdownInput',
                label: 'MarkdownInput',
                children: (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                      <Checkbox checked={miInline} onChange={event => setMiInline(event.target.checked)}>Inline</Checkbox>
                      <Checkbox checked={miDisabled} onChange={event => setMiDisabled(event.target.checked)}>Disabled</Checkbox>
                      <Checkbox checked={miDebounced} onChange={event => setMiDebounced(event.target.checked)}>Debounced</Checkbox>
                      <Checkbox checked={miSanitizeCdnUrls} onChange={event => setMiSanitizeCdnUrls(event.target.checked)}>Sanitize CDN URLs</Checkbox>
                    </div>
                    <div>Event Log</div>
                    <div ref={miEventLogRef} style={{ height: '140px', overflow: 'auto', border: '1px solid #ddd', backgroundColor: '#fbfbfb', fontSize: '10px', marginBottom: '15px' }}>
                      <pre>{miEventLog}</pre>
                    </div>
                    <MarkdownInput
                      value={miValue}
                      inline={miInline}
                      disabled={miDisabled}
                      debounced={miDebounced}
                      sanitizeCdnUrls={miSanitizeCdnUrls}
                      onBlur={() => handleMiEvent('onBlur')}
                      onChange={event => handleMiEvent('onChange', event.target.value)}
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
    </RoomMediaContextProvider>
  );
}

Tests.propTypes = {
  PageTemplate: PropTypes.func.isRequired,
  initialState: PropTypes.shape({
    room: roomShape,
    roomMediaContext: roomMediaContextShape
  }).isRequired
};

export default Tests;
