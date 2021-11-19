import Page from '../page.js';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import Logger from '../../common/logger.js';
import { useTranslation } from 'react-i18next';
import { DownOutlined } from '@ant-design/icons';
import { Button, Table, Menu, Dropdown } from 'antd';

const logger = new Logger(import.meta.url);

function Import({ initialState }) {
  const { t } = useTranslation('import');
  const defaultSourceMenuItem = { name: t('source') };
  const sourceMenuItems = [defaultSourceMenuItem, ...initialState.importSources];
  const [selectedSource, setSelectedSource] = useState(defaultSourceMenuItem);

  const handleImportClick = () => {
    logger.info('Dummy import');
  };

  const handleSourceMenuClick = ({ key }) => {
    const item = sourceMenuItems.find(source => source.name === key);
    setSelectedSource(item);
  };

  const columns = [
    { title: t('import'), key: 'import', width: '64px', render: () => { } },
    { title: t('importType'), key: 'importType', dataIndex: 'importType', render: () => { } },
    { title: t('title'), key: 'title', render: () => { } },
    { title: t('language'), key: 'language', width: '100px', render: () => { } },
    { title: t('updateDate'), key: 'updateDate', width: '150px', render: () => { } }
  ];

  const rows = [{ import: '', importType: '', title: '', language: '', updateDate: '' }];

  const sourceMenu = (
    <Menu onClick={handleSourceMenuClick}>
      {sourceMenuItems
        .map(importSource => (
          <Menu.Item key={importSource.name}>
            {importSource.name}
          </Menu.Item>
        ))}
    </Menu>
  );

  return (
    <Page>
      <div className="ImportPage">
        <h1>{t('pageNames:import')}</h1>

        <Dropdown overlay={sourceMenu} placement="bottomCenter">
          <Button className="ImportPage-sourceButton">
            {selectedSource.name}<DownOutlined />
          </Button>
        </Dropdown>

        <br /> <br />

        {selectedSource.baseUrl && (
          <React.Fragment>
            <Table
              size="small"
              columns={columns}
              dataSource={rows}
              pagination={false}
              bordered
              />

            <br />
            <Button type="primary" onClick={handleImportClick}>
              {t('importButton')}
            </Button>
          </React.Fragment>)}
      </div>
    </Page>
  );
}

Import.propTypes = {
  initialState: PropTypes.shape({
    importSources: PropTypes.arrayOf(PropTypes.shape({
      name: PropTypes.string.isRequired,
      baseUrl: PropTypes.string.isRequired,
      apiKey: PropTypes.string.isRequired
    })).isRequired
  }).isRequired
};

export default Import;
