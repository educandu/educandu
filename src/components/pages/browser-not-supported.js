import React, { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { List } from 'antd';

const supportedBrowsers = [
  {
    browserName: 'Firefox',
    downloadLink: 'https://www.mozilla.org/en-US/firefox/new/'
  },
  {
    browserName: 'Chrome',
    downloadLink: 'https://www.google.com/chrome/'
  },
  {
    browserName: 'Safari 13 or newer',
    downloadLink: 'https://support.apple.com/downloads/safari'
  },
  {
    browserName: 'Edge',
    downloadLink: 'https://www.microsoft.com/en-us/edge'
  }
];

export default function BrowserNotSupported() {
  const { t } = useTranslation('browserNotSupported');
  return (
    <Fragment>
      <div className="BrowserNotSupported-headerContainer">
        <h2>
          {t('headerText')}
        </h2>
      </div>

      <div className="BrowserNotSupported-mainContainer">
        <div className="BrowserNotSupported-column">
          <p>{t('mainText')}:</p>
          <List
            dataSource={supportedBrowsers}
            renderItem={supportedBrowser => (
              <List.Item>
                <a target="_blank" rel="noopener noreferrer" href={supportedBrowser.downloadLink} >{supportedBrowser.browserName}</a>
              </List.Item>)}
            />
        </div>
      </div>
    </Fragment>
  );
}
