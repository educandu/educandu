/* eslint-disable no-console, max-len, max-lines */

import by from 'thenby';
import PropTypes from 'prop-types';
import UrlInput from '../url-input.js';
import ColorPicker from '../color-picker.js';
import ImageEditor from '../image-editor.js';
import { useTranslation } from 'react-i18next';
import Timeline from '../media-player/timeline.js';
import { useRequest } from '../request-context.js';
import DebouncedInput from '../debounced-input.js';
import MusicXmlDocument from '../music-xml-document.js';
import MediaPlayer from '../media-player/media-player.js';
import { removeItemAt } from '../../utils/array-utils.js';
import DimensionsProvider from '../dimensions-provider.js';
import React, { useEffect, useRef, useState } from 'react';
import ResourcePicker from '../resource-picker/resource-picker.js';
import NeverScrollingTextArea from '../never-scrolling-text-area.js';
import ResourceSelector from '../resource-picker/resource-selector.js';
import MediaRangeSelector from '../media-player/media-range-selector.js';
import MultitrackMediaPlayer from '../media-player/multitrack-media-player.js';
import AudioWaveformCanvas from '../../plugins/audio-waveform/audio-waveform-canvas.js';
import MultitrackMediaEditor from '../../plugins/multitrack-media/multitrack-media-editor.js';
import { Button, Checkbox, Form, Input, InputNumber, Radio, Slider, Tabs, message } from 'antd';
import MultitrackMediaDisplay from '../../plugins/multitrack-media/multitrack-media-display.js';
import { HORIZONTAL_ALIGNMENT, MEDIA_SCREEN_MODE, MEDIA_SOURCE_TYPE, STORAGE_LOCATION_TYPE, VERTICAL_ALIGNMENT } from '../../domain/constants.js';
import { createDefaultContent, createDefaultMainTrack, createDefaultSecondaryTrack, createDefaultVolumePreset } from '../../plugins/multitrack-media/multitrack-media-utils.js';
import {
  DEFAULT_WAVEFORM_BACKGROUND_COLOR,
  DEFAULT_WAVEFORM_BASELINE_COLOR,
  DEFAULT_WAVEFORM_PEN_COLOR,
  DEFAULT_WAVEFORM_PEN_WIDTH,
  DEFAULT_WAVEFORM_SMOOTHING
} from '../../plugins/audio-waveform/constants.js';

const { TabPane } = Tabs;
const { Search, TextArea } = Input;

const IMAGE_URL_JPG = 'https://cdn.openmusic.academy/media/4WqqhJRDsogBFGVbZrfuaF/Banner_hGsJz5kf2pGsXygBX8ZJ97.jpg';
const IMAGE_URL_PNG = 'https://cdn.openmusic.academy/media/2Sss3iioh1dpoBnYPTq9Rn/Bossa%20Nova%20Groovetabelle_aWvhsm8RX9hXFRrF3hk4Pu.png';
const YOUTUBE_VIDEO_URL = 'https://www.youtube.com/watch?v=H3hBitGg_NI';
const EXTERNAL_VIDEO_URL = 'https://cdn.openmusic.academy/media/fQugKEp8XCKJTVKVhiRdeJ/2022-04-05-5-te-sinfonie-v1-bLf7WqJAaf4y8AsPRnWG8R.mp4';

const MULTITRACK_CORELLI_URL_0 = 'https://cdn.staging.openmusic.academy/media/toEHvnaG67zkNJEp9Ev9tu/corelli-generalbass-hq8W2YhjhmGKkr44kNrPUE.mp3';
const MULTITRACK_CORELLI_URL_0_EXTENDED = 'https://cdn.staging.openmusic.academy/media/toEHvnaG67zkNJEp9Ev9tu/corelli-generalbass-extended-wGQi1xK4jA1eDuKEV14t8c.mp3';
const MULTITRACK_CORELLI_URL_1 = 'https://cdn.staging.openmusic.academy/media/toEHvnaG67zkNJEp9Ev9tu/corelli-violine-1-dcFUAwCCA5TGjNoTUjrpPQ.mp3';
const MULTITRACK_CORELLI_URL_1_SHORT = 'https://cdn.staging.openmusic.academy/media/toEHvnaG67zkNJEp9Ev9tu/corelli-violine-1-short-6QL7EZNXZ2AQB1odeY9tiH.mp3';
const MULTITRACK_CORELLI_URL_2 = 'https://cdn.staging.openmusic.academy/media/toEHvnaG67zkNJEp9Ev9tu/corelli-violine-2-d918ZmitwuCjKCAYaJvWtS.mp3';
const MULTITRACK_CORELLI_URL_2_SHORT = 'https://cdn.staging.openmusic.academy/media/toEHvnaG67zkNJEp9Ev9tu/corelli-violine-2-short-vTWJD95XQx9G4FNKMHit6H.mp3';
const MULTITRACK_CORELLI_URL_3 = 'https://cdn.staging.openmusic.academy/media/toEHvnaG67zkNJEp9Ev9tu/corelli-violoncello-ek8KcohkALHpF8QP2uH1No.mp3';

const MULTITRACK_GROOVE_URL_0 = 'https://cdn.staging.openmusic.academy/media/toEHvnaG67zkNJEp9Ev9tu/groove-lexikon-dubstep-9hqADKZtPHV7F7GVfye3DF.mp3';
const MULTITRACK_GROOVE_URL_1 = 'https://cdn.staging.openmusic.academy/media/toEHvnaG67zkNJEp9Ev9tu/groove-lexikon-dubstep-bass-growls-c9Z4K6PSm7k7onNHh4eFLv.mp3';
const MULTITRACK_GROOVE_URL_2 = 'https://cdn.staging.openmusic.academy/media/toEHvnaG67zkNJEp9Ev9tu/groove-lexikon-dubstep-bass-sub-xseNKq1gTc3sMrvYhp4Ryk.mp3';
const MULTITRACK_GROOVE_URL_3 = 'https://cdn.staging.openmusic.academy/media/toEHvnaG67zkNJEp9Ev9tu/groove-lexikon-dubstep-chords-p1z7vpBgGLQ75okxsd9ZiQ.mp3';
const MULTITRACK_GROOVE_URL_4 = 'https://cdn.staging.openmusic.academy/media/toEHvnaG67zkNJEp9Ev9tu/groove-lexikon-dubstep-drums-bTRHpx9cta63Q3MQP52VG5.mp3';
const MULTITRACK_GROOVE_URL_5 = 'https://cdn.staging.openmusic.academy/media/toEHvnaG67zkNJEp9Ev9tu/groove-lexikon-dubstep-fx-2AEEYbQBiRXmRvNWCGhkzZ.mp3';
const MULTITRACK_GROOVE_URL_6 = 'https://cdn.staging.openmusic.academy/media/toEHvnaG67zkNJEp9Ev9tu/groove-lexikon-dubstep-lead-bell-rxF9rWsV5cwxzDwiM6CH5W.mp3';
const MULTITRACK_GROOVE_URL_7 = 'https://cdn.staging.openmusic.academy/media/toEHvnaG67zkNJEp9Ev9tu/groove-lexikon-dubstep-lead-synth-ghymhFnZ8fc3VVW65PHmB5.mp3';

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

  // MediaRangeSelector
  const [mrsSource, setMrsSource] = useState('');
  const [mrsRange, setMrsRange] = useState([0, 1]);

  // MediaPlayer
  const mpSources = [
    { title: 'Youtube video', url: YOUTUBE_VIDEO_URL },
    { title: 'external video', url: EXTERNAL_VIDEO_URL }
  ];
  const mpPlayerRef = useRef();
  const mpEventLogRef = useRef();
  const [mpRange, setMpRange] = useState([0, 1]);
  const [mpEventLog, setMpEventLog] = useState('');
  const [mpSourceUrl, setMpSourceUrl] = useState(mpSources[0].url);
  const [mpScreenMode, setMpScreenMode] = useState(MEDIA_SCREEN_MODE.video);
  const handleMpEvent = (eventName, ...args) => {
    setMpEventLog(currentLog => args.length
      ? `${currentLog}${eventName}: ${JSON.stringify(args.length > 1 ? args : args[0])}\n`
      : `${currentLog}${eventName}\n`);
    setTimeout(() => {
      const eventLogElement = mpEventLogRef.current;
      eventLogElement.scrollTop = eventLogElement.scrollHeight;
    }, 0);
  };
  const handleRandomPlaybackRangeClick = () => {
    let newRange = [0, 0];
    while (newRange[1] - newRange[0] < 0.1) {
      newRange = [Math.random(), Math.random()].sort();
    }
    setMpRange(newRange);
  };

  // MultitrackMediaPlayer
  const mmpSourceOptions = [
    {
      title: 'Corelli (manipulated)',
      sources: {
        mainTrack: { name: 'Gb (ext)', sourceUrl: MULTITRACK_CORELLI_URL_0_EXTENDED, volume: 1, playbackRange: [0.14, 0.82] },
        secondaryTracks: [
          { name: 'Vl 1 (28 sec)', sourceUrl: MULTITRACK_CORELLI_URL_1_SHORT, volume: 1 },
          { name: 'Vl 2 (29 sec)', sourceUrl: MULTITRACK_CORELLI_URL_2_SHORT, volume: 1 },
          { name: 'Violoncello', sourceUrl: MULTITRACK_CORELLI_URL_3, volume: 1 }
        ]
      }
    },
    {
      title: 'Corelli',
      sources: {
        mainTrack: { name: 'Generalbass', sourceUrl: MULTITRACK_CORELLI_URL_0, volume: 1, playbackRange: [0, 1] },
        secondaryTracks: [
          { name: 'Violine 1', sourceUrl: MULTITRACK_CORELLI_URL_1, volume: 1 },
          { name: 'Violine 2', sourceUrl: MULTITRACK_CORELLI_URL_2, volume: 1 },
          { name: 'Violoncello', sourceUrl: MULTITRACK_CORELLI_URL_3, volume: 1 }
        ]
      }
    },
    {
      title: 'Groove',
      sources: {
        mainTrack: { name: 'Dubstep', sourceUrl: MULTITRACK_GROOVE_URL_0, volume: 1, playbackRange: [0, 1] },
        secondaryTracks: [
          { name: 'Bass growls', sourceUrl: MULTITRACK_GROOVE_URL_1, volume: 1 },
          { name: 'Bass sub', sourceUrl: MULTITRACK_GROOVE_URL_2, volume: 1 },
          { name: 'Chords', sourceUrl: MULTITRACK_GROOVE_URL_3, volume: 1 },
          { name: 'Drums', sourceUrl: MULTITRACK_GROOVE_URL_4, volume: 1 },
          { name: 'FX', sourceUrl: MULTITRACK_GROOVE_URL_5, volume: 1 },
          { name: 'Lead bell', sourceUrl: MULTITRACK_GROOVE_URL_6, volume: 1 },
          { name: 'Lead synth', sourceUrl: MULTITRACK_GROOVE_URL_7, volume: 1 }
        ]
      }
    },
    {
      title: 'Youtube',
      sources: {
        mainTrack: { name: 'Youtube', sourceUrl: YOUTUBE_VIDEO_URL, volume: 1, playbackRange: [0, 1] },
        secondaryTracks: [{ name: 'External', sourceUrl: MULTITRACK_CORELLI_URL_0, volume: 1 }]
      }
    }
  ];
  const mmpPlayerRef = useRef();
  const mmpEventLogRef = useRef();
  const [mmpEventLog, setMmpEventLog] = useState('');
  const [mmpScreenMode, setMmpScreenMode] = useState(MEDIA_SCREEN_MODE.none);
  const [mmpSourceOption, setMmpSourceOption] = useState(mmpSourceOptions[0]);
  const handleMmpEvent = (eventName, ...args) => {
    setMmpEventLog(currentLog => args.length
      ? `${currentLog}${eventName}: ${JSON.stringify(args.length > 1 ? args : args[0])}\n`
      : `${currentLog}${eventName}\n`);
    setTimeout(() => {
      const eventLogElement = mmpEventLogRef.current;
      eventLogElement.scrollTop = eventLogElement.scrollHeight;
    }, 0);
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

  // MultitrackMediaPlugin
  const { t: mmpTranslation } = useTranslation('multitrackMedia');
  const mmpPresets = [
    {
      title: 'Corelli (manipulated)',
      content: {
        ...createDefaultContent(mmpTranslation),
        mainTrack: { ...createDefaultMainTrack(mmpTranslation), name: 'Gb (ext)', sourceType: MEDIA_SOURCE_TYPE.external, sourceUrl: MULTITRACK_CORELLI_URL_0_EXTENDED, playbackRange: [0.14, 0.82] },
        secondaryTracks: [
          { ...createDefaultSecondaryTrack(0, mmpTranslation), name: 'Vl 1 (28 sec)', sourceType: MEDIA_SOURCE_TYPE.external, sourceUrl: MULTITRACK_CORELLI_URL_1_SHORT },
          { ...createDefaultSecondaryTrack(1, mmpTranslation), name: 'Vl 2 (29 sec)', sourceType: MEDIA_SOURCE_TYPE.external, sourceUrl: MULTITRACK_CORELLI_URL_2_SHORT },
          { ...createDefaultSecondaryTrack(2, mmpTranslation), name: 'Violoncello', sourceType: MEDIA_SOURCE_TYPE.external, sourceUrl: MULTITRACK_CORELLI_URL_3 }
        ],
        volumePresets: [createDefaultVolumePreset(mmpTranslation, 3)]
      }
    },
    {
      title: 'Corelli',
      content: {
        ...createDefaultContent(mmpTranslation),
        mainTrack: { ...createDefaultMainTrack(mmpTranslation), name: 'Generalbass', sourceType: MEDIA_SOURCE_TYPE.external, sourceUrl: MULTITRACK_CORELLI_URL_0 },
        secondaryTracks: [
          { ...createDefaultSecondaryTrack(0, mmpTranslation), name: 'Violine 1', sourceType: MEDIA_SOURCE_TYPE.external, sourceUrl: MULTITRACK_CORELLI_URL_1 },
          { ...createDefaultSecondaryTrack(1, mmpTranslation), name: 'Violine 2', sourceType: MEDIA_SOURCE_TYPE.external, sourceUrl: MULTITRACK_CORELLI_URL_2 },
          { ...createDefaultSecondaryTrack(2, mmpTranslation), name: 'Violoncello', sourceType: MEDIA_SOURCE_TYPE.external, sourceUrl: MULTITRACK_CORELLI_URL_3 }
        ],
        volumePresets: [createDefaultVolumePreset(mmpTranslation, 3)]
      }
    },
    {
      title: 'Groove',
      content: {
        ...createDefaultContent(mmpTranslation),
        mainTrack: { ...createDefaultMainTrack(mmpTranslation), name: 'Dubstep', sourceType: MEDIA_SOURCE_TYPE.external, sourceUrl: MULTITRACK_GROOVE_URL_0 },
        secondaryTracks: [
          { ...createDefaultSecondaryTrack(0, mmpTranslation), name: 'Bass growls', sourceType: MEDIA_SOURCE_TYPE.external, sourceUrl: MULTITRACK_GROOVE_URL_1 },
          { ...createDefaultSecondaryTrack(1, mmpTranslation), name: 'Bass sub', sourceType: MEDIA_SOURCE_TYPE.external, sourceUrl: MULTITRACK_GROOVE_URL_2 },
          { ...createDefaultSecondaryTrack(2, mmpTranslation), name: 'Chords', sourceType: MEDIA_SOURCE_TYPE.external, sourceUrl: MULTITRACK_GROOVE_URL_3 },
          { ...createDefaultSecondaryTrack(3, mmpTranslation), name: 'Drums', sourceType: MEDIA_SOURCE_TYPE.external, sourceUrl: MULTITRACK_GROOVE_URL_4 },
          { ...createDefaultSecondaryTrack(4, mmpTranslation), name: 'FX', sourceType: MEDIA_SOURCE_TYPE.external, sourceUrl: MULTITRACK_GROOVE_URL_5 },
          { ...createDefaultSecondaryTrack(5, mmpTranslation), name: 'Lead bell', sourceType: MEDIA_SOURCE_TYPE.external, sourceUrl: MULTITRACK_GROOVE_URL_6 },
          { ...createDefaultSecondaryTrack(6, mmpTranslation), name: 'Lead synth', sourceType: MEDIA_SOURCE_TYPE.external, sourceUrl: MULTITRACK_GROOVE_URL_7 }
        ],
        volumePresets: [createDefaultVolumePreset(mmpTranslation, 7)]
      }
    },
    {
      title: 'Youtube',
      content: {
        ...createDefaultContent(mmpTranslation),
        mainTrack: { ...createDefaultMainTrack(mmpTranslation), name: 'Youtube', sourceType: MEDIA_SOURCE_TYPE.youtube, sourceUrl: YOUTUBE_VIDEO_URL, showVideo: true },
        secondaryTracks: [{ ...createDefaultSecondaryTrack(0, mmpTranslation), name: 'External', sourceType: MEDIA_SOURCE_TYPE.external, sourceUrl: MULTITRACK_CORELLI_URL_0 }],
        volumePresets: [createDefaultVolumePreset(mmpTranslation, 1)]
      }
    }
  ];
  const [mmpContent, setMmpContent] = useState(mmpPresets[0].content);

  // UrlInput
  const [urlInputValue, setUrlInputValue] = useState('');
  const handleUrlInputCopyYoutubeClick = () => handleCopyToClipboard('https://www.youtube.com/watch?v=221F55VPp2M');
  const handleUrlInputCopyExternalClick = () => handleCopyToClipboard('https://imagesvc.meredithcorp.io/v3/mm/image?url=https%3A%2F%2Fstatic.onecms.io%2Fwp-content%2Fuploads%2Fsites%2F6%2F2014%2F05%2Ffriends-a-apartment-bet_0.jpg&q=60');
  const handleUrlInputCopyPrivateCdnClick = () => handleCopyToClipboard('http://localhost:10000/rooms/vmQouBT6CqeWe35STsBvnj/media/pug-cfAdTfMQ3A9Pbsskv79Sms.jpeg');
  const handleUrlInputCopyPublicCdnClick = () => handleCopyToClipboard('http://localhost:10000/media/7vgRduWGhBBD6HxWUnN1NV/dog-eAyeL9Z3QQXDXGMm4U636M.jpg');
  const handleUrlInputSetYoutubeClick = () => setUrlInputValue('https://www.youtube.com/watch?v=221F55VPp2M');
  const handleUrlInputSetExternalClick = () => setUrlInputValue('https://imagesvc.meredithcorp.io/v3/mm/image?url=https%3A%2F%2Fstatic.onecms.io%2Fwp-content%2Fuploads%2Fsites%2F6%2F2014%2F05%2Ffriends-a-apartment-bet_0.jpg&q=60');
  const handleUrlInputSetPrivateCdnClick = () => setUrlInputValue('http://localhost:10000/rooms/vmQouBT6CqeWe35STsBvnj/media/pug-cfAdTfMQ3A9Pbsskv79Sms.jpeg');
  const handleUrlInputSetPublicCdnClick = () => setUrlInputValue('http://localhost:10000/media/7vgRduWGhBBD6HxWUnN1NV/dog-eAyeL9Z3QQXDXGMm4U636M.jpg');
  const handleUrlInputChange = url => {
    setUrlInputValue(url);
  };

  return (
    <PageTemplate>
      <div className="TestsPage">
        <Tabs defaultActiveKey={initialTab} onChange={handleTabChange} destroyInactiveTabPane>
          <TabPane tab="UrlInput" key="UrlInput">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
              <Button onClick={handleUrlInputCopyYoutubeClick}>Copy Youtube URL</Button>
              <Button onClick={handleUrlInputCopyExternalClick}>Copy external URL</Button>
              <Button onClick={handleUrlInputCopyPrivateCdnClick}>Copy private CDN URL</Button>
              <Button onClick={handleUrlInputCopyPublicCdnClick}>Copy public CDN URL</Button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
              <Button onClick={handleUrlInputSetYoutubeClick}>Set Youtube URL</Button>
              <Button onClick={handleUrlInputSetExternalClick}>Set external URL</Button>
              <Button onClick={handleUrlInputSetPrivateCdnClick}>Set private CDN URL</Button>
              <Button onClick={handleUrlInputSetPublicCdnClick}>Set public CDN URL</Button>
            </div>
            <UrlInput value={urlInputValue} onChange={handleUrlInputChange} />
          </TabPane>
          <TabPane tab="AudioWaveformCanvas" key="AudioWaveformCanvas">
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
          </TabPane>
          <TabPane tab="MusicXmlDocument" key="MusicXmlDocument">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
              <div>Load Url:</div>
              {mxdSources.map(({ title, url }) => <Button key={url} onClick={() => setMxdUrl(url)}>{title}</Button>)}
              <div>Zoom:</div>
              <Slider style={{ width: '200px' }} min={0.5} max={1.5} step={0.05} value={mxdZoom} onChange={setMxdZoom} />
            </div>
            <MusicXmlDocument url={mxdUrl} zoom={mxdZoom} />
          </TabPane>
          <TabPane tab="DebouncedInput" key="DebouncedInput">
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
          </TabPane>
          <TabPane tab="ImageEditor" key="ImageEditor">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
              <Button onClick={() => setIeFileUrl(IMAGE_URL_PNG)}>Set to PNG</Button>
              <Button onClick={() => setIeFileUrl(IMAGE_URL_JPG)}>Set to JPG</Button>
              <Button onClick={handleIeDownloadClick}>Download</Button>
              <div>DIRTY: {ieIsDirty.toString()}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
              URL: {ieFileUrl}
            </div>
            {ieFile && (
              <div style={{ height: '50vh' }}>
                <ImageEditor file={ieFile} editorRef={ieEditorRef} onCrop={handleIeCrop} />
              </div>
            )}
          </TabPane>
          <TabPane tab="Timeline" key="Timeline">
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
          </TabPane>
          <TabPane tab="MediaRangeSelector" key="MediaRangeSelector">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
              Source:
              <Input value={mrsSource} readOnly />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
              <Button onClick={() => setMrsSource('')}>Reset</Button>
              <Button onClick={() => setMrsSource(YOUTUBE_VIDEO_URL)}>Set to YouTube</Button>
              <Button onClick={() => setMrsSource(EXTERNAL_VIDEO_URL)}>Set to External</Button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
              Range: {JSON.stringify(mrsRange)}
            </div>
            <MediaRangeSelector
              sourceUrl={mrsSource}
              range={mrsRange}
              onRangeChange={setMrsRange}
              />
          </TabPane>
          <TabPane tab="MediaPlayer" key="MediaPlayer">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
              <div>
                <MediaPlayer
                  source={mpSourceUrl}
                  playbackRange={mpRange}
                  screenMode={mpScreenMode}
                  mediaPlayerRef={mpPlayerRef}
                  onPartEndReached={(...args) => handleMpEvent('onPartEndReached', ...args)}
                  onEndReached={(...args) => handleMpEvent('onEndReached', ...args)}
                  onPlayStateChange={(...args) => handleMpEvent('onPlayStateChange', ...args)}
                  onPlayingPartIndexChange={(...args) => handleMpEvent('onPlayingPartIndexChange', ...args)}
                  onReady={(...args) => handleMpEvent('onReady', ...args)}
                  onSeek={(...args) => handleMpEvent('onSeek', ...args)}
                  />
              </div>
              <div>
                <h6>Source</h6>
                <div>
                  {mpSources.map((source, index) => (
                    <Button key={index.toString()} onClick={() => setMpSourceUrl(source.url)}>Set to {source.title}</Button>
                  ))}
                </div>
                <div>{mpSourceUrl}</div>
                <h6 style={{ marginTop: '15px' }}>Media Range</h6>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, auto) 1fr', gap: '25px', alignItems: 'center' }}>
                  <Button onClick={handleRandomPlaybackRangeClick}>Set to random value</Button>
                  <MediaRangeSelector
                    range={mpRange}
                    sourceUrl={mpSourceUrl}
                    onRangeChange={setMpRange}
                    />
                  <div>{mpRange[0].toFixed(2)} &ndash; {mpRange[1].toFixed(2)}</div>
                </div>
                <h6 style={{ marginTop: '15px' }}>Screen mode</h6>
                <Radio.Group value={mpScreenMode} onChange={event => setMpScreenMode(event.target.value)}>
                  {Object.values(MEDIA_SCREEN_MODE).map(sm => <Radio.Button key={sm} value={sm}>{sm}</Radio.Button>)}
                </Radio.Group>
                <h6 style={{ marginTop: '15px' }}>Programmatic control</h6>
                <div>
                  <Button onClick={() => mpPlayerRef.current.play()}>play</Button>
                  <Button onClick={() => mpPlayerRef.current.pause()}>pause</Button>
                  <Button onClick={() => mpPlayerRef.current.stop()}>stop</Button>
                  <Button onClick={() => mpPlayerRef.current.reset()}>reset</Button>
                </div>
                <h6 style={{ marginTop: '15px' }}>Event Log</h6>
                <div ref={mpEventLogRef} style={{ height: '140px', overflow: 'auto', border: '1px solid #ddd', backgroundColor: '#fbfbfb', fontSize: '10px' }}>
                  <pre>{mpEventLog}</pre>
                </div>
              </div>
            </div>
          </TabPane>
          <TabPane tab="MultitrackMediaPlayer" key="MultitrackMediaPlayer">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
              <div>
                <MultitrackMediaPlayer
                  sources={mmpSourceOption.sources}
                  screenMode={mmpScreenMode}
                  mediaPlayerRef={mmpPlayerRef}
                  onPartEndReached={(...args) => handleMmpEvent('onPartEndReached', ...args)}
                  onEndReached={(...args) => handleMmpEvent('onEndReached', ...args)}
                  onPlayStateChange={(...args) => handleMmpEvent('onPlayStateChange', ...args)}
                  onPlayingPartIndexChange={(...args) => handleMmpEvent('onPlayingPartIndexChange', ...args)}
                  onReady={(...args) => handleMmpEvent('onReady', ...args)}
                  onSeek={(...args) => handleMmpEvent('onSeek', ...args)}
                  showTrackMixer
                  />
              </div>
              <div>
                <h6>Source</h6>
                <div>
                  {mmpSourceOptions.map((source, index) => (
                    <Button key={index.toString()} onClick={() => setMmpSourceOption(source)}>Set to {source.title}</Button>
                  ))}
                </div>
                <div>{mmpSourceOption.title} - {mmpSourceOption.sources.secondaryTracks.length + 1} tracks</div>
                <h6 style={{ marginTop: '15px' }}>Screen mode</h6>
                <Radio.Group value={mmpScreenMode} onChange={event => setMmpScreenMode(event.target.value)}>
                  {Object.values(MEDIA_SCREEN_MODE).map(sm => <Radio.Button key={sm} value={sm}>{sm}</Radio.Button>)}
                </Radio.Group>
                <h6 style={{ marginTop: '15px' }}>Programmatic control</h6>
                <div>
                  <Button onClick={() => mmpPlayerRef.current.play()}>play</Button>
                  <Button onClick={() => mmpPlayerRef.current.pause()}>pause</Button>
                  <Button onClick={() => mmpPlayerRef.current.stop()}>stop</Button>
                  <Button onClick={() => mmpPlayerRef.current.reset()}>reset</Button>
                </div>
                <h6 style={{ marginTop: '15px' }}>Event Log</h6>
                <div ref={mmpEventLogRef} style={{ height: '140px', overflow: 'auto', border: '1px solid #ddd', backgroundColor: '#fbfbfb', fontSize: '10px' }}>
                  <pre>{mmpEventLog}</pre>
                </div>
              </div>
            </div>
          </TabPane>
          <TabPane tab="ResourceSelector" key="ResourceSelector">
            <ResourceSelector
              allowedLocationTypes={Object.values(STORAGE_LOCATION_TYPE)}
              onSelect={ev => console.log('select', ev)}
              onCancel={ev => console.log('cancel', ev)}
              />
          </TabPane>
          <TabPane tab="ResourcePicker" key="ResourcePicker">
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
          </TabPane>
          <TabPane tab="NeverScrollingTextArea" key="NeverScrollingTextArea">
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
          </TabPane>
          <TabPane tab="MultitrackMediaPlugin" key="MultitrackMediaPlugin">
            <h4>Source</h4>
            <div>
              {mmpPresets.map((preset, index) => (
                <Button key={index.toString()} onClick={() => setMmpContent(preset.content)}>Set to {preset.title}</Button>
              ))}
            </div>
            <h4 style={{ marginTop: '15px' }}>Display</h4>
            <MultitrackMediaDisplay content={mmpContent} />
            <h4 style={{ marginTop: '15px' }}>Editor</h4>
            <MultitrackMediaEditor content={mmpContent} onContentChanged={content => setMmpContent(content)} />
          </TabPane>
        </Tabs>
      </div>
    </PageTemplate>
  );
}

Tests.propTypes = {
  PageTemplate: PropTypes.func.isRequired
};

export default Tests;
