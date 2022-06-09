/* eslint-disable no-console */

import PropTypes from 'prop-types';
import FilePreview from '../file-preview.js';
import MarkdownInput from '../markdown-input.js';
import { useStorage } from '../storage-context.js';
import DebouncedInput from '../debounced-input.js';
import React, { useEffect, useState } from 'react';
import { Button, Form, message, Modal, Select } from 'antd';
import ResourceSelector from '../resource-selector.js';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import FilesViewer, { FILE_VIEWER_DISPLAY } from '../files-viewer.js';
import StorageApiClient from '../../api-clients/storage-api-client.js';
import { CDN_OBJECT_TYPE, STORAGE_LOCATION_TYPE } from '../../domain/constants.js';

const inlineMarkdownExample = 'The *white fox* jumps over the **blue lake**';
const blockMarkdownExample = `
# An h1 header

Paragraphs are separated by a blank line.

2nd paragraph. *Italic*, **bold**, and \`monospace\`. Itemized lists
look like:

  * this one
  * that one
  * the other one

Note that --- not considering the asterisk --- the actual text
content starts at 4-columns in.

> Block quotes are
> written like so.
>
> They can span multiple paragraphs,
> if you like.

Use 3 dashes for an em-dash. Use 2 dashes for ranges (ex., "it's all
in chapters 12--14"). Three dots ... will be converted to an ellipsis.
Unicode is supported. ☺

~~~
import time
# Quick, count to ten!
for i in range(10):
    # (but not *too* quick)
    time.sleep(0.5)
    print(i)
~~~
`.trim();

function Tests({ PageTemplate }) {
  const [markdownInlineForm] = Form.useForm();
  const [markdownBlockForm] = Form.useForm();
  const { locations } = useStorage();
  const currentLocation = locations[0];
  const [files, setFiles] = useState([]);
  const [initialUrl, setInitialUrl] = useState('');
  const [markdownInlineValue1, setMarkdownInlineValue1] = useState(inlineMarkdownExample);
  const [markdownInlineValue2, setMarkdownInlineValue2] = useState(inlineMarkdownExample);
  const [markdownInlineValue3, setMarkdownInlineValue3] = useState(inlineMarkdownExample);
  const [markdownInlineValue4, setMarkdownInlineValue4] = useState(inlineMarkdownExample);
  const [markdownBlockValue1, setMarkdownBlockValue1] = useState(blockMarkdownExample);
  const [markdownBlockValue2, setMarkdownBlockValue2] = useState(blockMarkdownExample);
  const [markdownBlockValue3, setMarkdownBlockValue3] = useState(blockMarkdownExample);
  const [markdownBlockValue4, setMarkdownBlockValue4] = useState(blockMarkdownExample);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const storageApiClient = useSessionAwareApiClient(StorageApiClient);
  const [filesViewerDisplay, setFilesViewerDisplay] = useState(FILE_VIEWER_DISPLAY.list);
  const [currentDisplayedDirectoryPath, setCurrentDisplayedDirectoryPath] = useState(null);
  const [isResourceSelectorModalVisible, setIsResourceSelectorModalVisible] = useState(false);
  const [currentLoadedDirectoryPath, setCurrentLoadedDirectoryPath] = useState(currentLocation.initialPath);

  useEffect(() => {
    markdownInlineForm.validateFields();
    markdownBlockForm.validateFields();
  }, [markdownInlineForm, markdownBlockForm]);

  useEffect(() => {
    if (!currentLoadedDirectoryPath) {
      return;
    }

    (async () => {
      try {
        setIsLoading(true);
        setSelectedFile(null);
        const responseData = await storageApiClient.getCdnObjects(currentLoadedDirectoryPath);
        setCurrentDisplayedDirectoryPath(currentLoadedDirectoryPath);
        setCurrentLoadedDirectoryPath(null);
        setFiles(responseData.objects);
      } catch (err) {
        console.log(err);
        message.error(err.message);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [currentLoadedDirectoryPath, storageApiClient]);

  const handleOnFileClick = newFile => {
    if (newFile.type === CDN_OBJECT_TYPE.directory) {
      setCurrentLoadedDirectoryPath(newFile.path);
    } else {
      setSelectedFile(oldFile => oldFile?.url === newFile.url ? null : newFile);
    }
  };

  return (
    <PageTemplate>
      <div className="TestsPage">
        <h1>Markdown Input</h1>
        <div>
          <div>INLINE</div>
          <MarkdownInput value={markdownInlineValue1} onChange={event => setMarkdownInlineValue1(event.target.value)} inline />
          <br />
          <div>INLINE (DISABLED)</div>
          <MarkdownInput value={markdownInlineValue2} onChange={event => setMarkdownInlineValue2(event.target.value)} inline disabled />
          <br />
          <div>INLINE WITH PREVIEW</div>
          <MarkdownInput value={markdownInlineValue3} onChange={event => setMarkdownInlineValue3(event.target.value)} inline preview />
          <br />
          <div>INLINE WITH PREVIEW (DISABLED) WITHOUT HELP</div>
          <MarkdownInput value={markdownInlineValue4} onChange={event => setMarkdownInlineValue4(event.target.value)} inline preview disabled noHelp />
          <br />
          <div>INLINE INSIDE FORM</div>
          <Form form={markdownInlineForm} initialValues={{ md: inlineMarkdownExample }}>
            <Form.Item name="md" rules={[{ max: 3, message: 'The lake is too big to jump over!' }]} hasFeedback>
              <MarkdownInput inline preview />
            </Form.Item>
          </Form>
          <br />
          <div>BLOCK</div>
          <MarkdownInput value={markdownBlockValue1} onChange={event => setMarkdownBlockValue1(event.target.value)} />
          <br />
          <div>BLOCK (DISABLED)</div>
          <MarkdownInput value={markdownBlockValue2} onChange={event => setMarkdownBlockValue2(event.target.value)} disabled />
          <br />
          <div>BLOCK WITH PREVIEW</div>
          <MarkdownInput value={markdownBlockValue3} onChange={event => setMarkdownBlockValue3(event.target.value)} preview />
          <br />
          <div>BLOCK WITH PREVIEW (DISABLED) WITHOUT HELP</div>
          <MarkdownInput value={markdownBlockValue4} onChange={event => setMarkdownBlockValue4(event.target.value)} preview disabled noHelp />
          <br />
          <div>BLOCK INSIDE FORM</div>
          <Form form={markdownBlockForm} initialValues={{ md: blockMarkdownExample }}>
            <Form.Item name="md" rules={[{ max: 3, message: 'The lake is too big to jump over!' }]}>
              <MarkdownInput preview />
            </Form.Item>
          </Form>
        </div>
        <hr />
        <h1>Resource Selector</h1>
        <div style={{ marginBottom: '25px' }}>
          <Button onClick={() => setIsResourceSelectorModalVisible(true)}>Open in modal window</Button>
        </div>
        <div style={{ marginBottom: '25px' }}>
          INITIAL URL:
          &nbsp;
          <DebouncedInput value={initialUrl} onChange={setInitialUrl} />
        </div>
        <div style={{ height: '400px', border: '1px solid gray' }}>
          <ResourceSelector
            allowedLocationTypes={[STORAGE_LOCATION_TYPE.public, STORAGE_LOCATION_TYPE.private]}
            initialUrl={initialUrl}
            />
          <Modal
            footer={null}
            closable={false}
            visible={isResourceSelectorModalVisible}
            >
            <ResourceSelector
              allowedLocationTypes={[STORAGE_LOCATION_TYPE.public, STORAGE_LOCATION_TYPE.private]}
              initialUrl={initialUrl}
              onSelect={() => setIsResourceSelectorModalVisible(false)}
              onCancel={() => setIsResourceSelectorModalVisible(false)}
              />
          </Modal>
        </div>
        <hr />
        <h1>Files Viewer</h1>
        <div>
          DISPLAY:
          &nbsp;
          <Select
            options={Object.values(FILE_VIEWER_DISPLAY).map(v => ({ label: v, value: v }))}
            value={filesViewerDisplay}
            onChange={setFilesViewerDisplay}
            />
          <br />
          CURRENT DIRECTORY:
          &nbsp;
          {currentDisplayedDirectoryPath || '---'}
          <br />
          SELECTED FILE:
          &nbsp;
          {selectedFile?.displayName || '---'}
        </div>
        <br />
        <div style={{ height: '400px', display: 'flex', justifyContent: 'stretch', alignItems: 'stretch', border: '1px solid gray' }}>
          <FilesViewer
            files={files}
            display={filesViewerDisplay}
            onFileClick={handleOnFileClick}
            selectedFileUrl={selectedFile?.portableUrl}
            onDeleteClick={() => console.log('onDeleteClick')}
            onNavigateToParentClick={() => setCurrentLoadedDirectoryPath(currentDisplayedDirectoryPath.split('/').slice(0, -1).join('/'))}
            onPreviewClick={() => console.log('onPreviewClick')}
            canNavigateToParent={currentDisplayedDirectoryPath?.length > currentLocation.rootPath.length}
            canDelete={currentLocation.isDeletionEnabled}
            isLoading={isLoading}
            />
        </div>
        <hr />
        <h1>File preview</h1>
        <h6>IMAGE (Raster)</h6>
        <div style={{ backgroundColor: '#f6f6f6', padding: '20px' }}>
          <FilePreview
            url="https://cdn.openmusic.academy/media/mDCkjepG3D61cX4FNBQxts/monteverdi-ninfa-x2mmMBkoJjnRvGghHQDPaQ.jpg"
            createdOn={new Date('2022-03-04T09:48:46.524Z')}
            size={44722}
            />
        </div>
        <hr />
        <h6>IMAGE (Vector)</h6>
        <FilePreview
          url="https://cdn.openmusic.academy/media/7nNYLdkpwLSi7i44qhBpqE/kanon-quintfall-1-cEwMkaVH1gREuT3j2NL4mt.svg"
          createdOn={new Date('2022-03-04T09:48:46.524Z')}
          size={44722}
          />
        <hr />
        <h6>AUDIO</h6>
        <FilePreview
          url="https://cdn.openmusic.academy/media/7nNYLdkpwLSi7i44qhBpqE/kanon-quintfall-1-2tcutSeJZftuDjiwmVeE47.mp3"
          createdOn={new Date('2022-03-04T09:48:46.524Z')}
          size={44722}
          />
        <hr />
        <h6>VIDEO</h6>
        <FilePreview
          url="https://cdn.openmusic.academy/media/rRsbyWevSf5k8bRzvL6N8q/Basis%C3%BCbung%20F-Dur_2pJv5pTWv2B5yELgMUoJyB.mp4"
          createdOn={new Date('2022-03-04T09:48:46.524Z')}
          size={44722}
          />
        <hr />
        <h6>PDF</h6>
        <FilePreview
          url="https://upload.wikimedia.org/wikipedia/commons/b/b5/Romanorum_pontificum.pdf"
          createdOn={new Date('2022-03-04T09:48:46.524Z')}
          size={44722}
          />
        <hr />
        <h6>GENERIC</h6>
        <FilePreview
          url="https://non.existent.com/file.backup"
          createdOn={new Date('2022-03-04T09:48:46.524Z')}
          size={44722}
          />
      </div>
    </PageTemplate>
  );
}

Tests.propTypes = {
  PageTemplate: PropTypes.func.isRequired
};

export default Tests;
