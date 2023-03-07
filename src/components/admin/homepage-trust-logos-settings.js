import PropTypes from 'prop-types';
import React, { memo } from 'react';
import UrlInput from '../url-input.js';
import { Button, Form, Table } from 'antd';
import { useTranslation } from 'react-i18next';
import DeleteButton from '../delete-button.js';
import cloneDeep from '../../utils/clone-deep.js';
import DebouncedInput from '../debounced-input.js';
import MoveUpIcon from '../icons/general/move-up-icon.js';
import MoveDownIcon from '../icons/general/move-down-icon.js';
import { GlobalOutlined, PlusOutlined } from '@ant-design/icons';
import { removeItemAt, swapItemsAt } from '../../utils/array-utils.js';
import { ADMIN_PAGE_FORM_ITEM_LAYOUT } from '../../domain/constants.js';
import { settingsHomepageTrustLogoShape } from '../../ui/default-prop-types.js';

const FormItem = Form.Item;

function HomepageTrustLogosSettings({ settings, onChange }) {
  const { t } = useTranslation('homepageTrustLogosSettings');

  const handleLogoUrlChange = (index, value) => {
    const newSettings = cloneDeep(settings);
    newSettings[index].logoUrl = value;
    onChange(newSettings);
  };

  const handleInstitutionUrlChange = (index, event) => {
    const { value } = event.target;
    const newSettings = cloneDeep(settings);
    newSettings[index].institutionUrl = value;
    onChange(newSettings);
  };

  const handleAddClick = () => {
    const newSettings = cloneDeep(settings);
    newSettings.push({ key: '', logoUrl: '', institutionUrl: '' });
    onChange(newSettings);
  };

  const handleDeleteClick = settingItemIndex => {
    const newSettings = removeItemAt(settings, settingItemIndex);
    onChange(newSettings);
  };

  const handleMoveClick = (index, offset) => {
    const newSettings = swapItemsAt(settings, index, index + offset);
    onChange(newSettings);
  };

  const renderSettingItem = (_row, rowItem) => {
    return (
      <div className="HomepageTrustLogosSettings-group" key={rowItem.key}>
        <FormItem {...ADMIN_PAGE_FORM_ITEM_LAYOUT} label={t('logoUrl')}>
          <UrlInput
            value={rowItem.logoUrl}
            onChange={value => handleLogoUrlChange(rowItem.key, value)}
            />
        </FormItem>
        <FormItem {...ADMIN_PAGE_FORM_ITEM_LAYOUT} label={t('institutionUrl')}>
          <DebouncedInput
            value={rowItem.institutionUrl}
            addonBefore={<GlobalOutlined />}
            onChange={event => handleInstitutionUrlChange(rowItem.key, event)}
            />
        </FormItem>
      </div>
    );
  };

  const renderRank = (text, record, index) => (
    <span className="u-small-button-group">
      <Button size="small" icon={<MoveUpIcon />} disabled={index === 0} onClick={() => handleMoveClick(index, -1)} />
      <Button size="small" icon={<MoveDownIcon />} disabled={index === settings.length - 1} onClick={() => handleMoveClick(index, +1)} />
    </span>
  );

  const renderActionsTitle = () => (
    <Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => handleAddClick()} />
  );

  const renderActions = (text, record, index) => (
    <DeleteButton onClick={() => handleDeleteClick(index)} />
  );

  const columns = [
    { title: t('common:rank'), key: 'rank', width: '75px', render: renderRank },
    { title: t('institution'), key: 'setting', dataIndex: 'setting', render: renderSettingItem },
    { title: renderActionsTitle, key: 'actions', width: '40px', render: renderActions }
  ];

  const data = settings.map((setting, index) => ({
    key: index.toString(),
    logoUrl: setting.logoUrl || '',
    institutionUrl: setting.institutionUrl || ''
  }));

  return (
    <Form className="HomepageTrustLogosSettings">
      <Table
        size="small"
        columns={columns}
        dataSource={data}
        pagination={false}
        bordered
        />
    </Form>
  );
}

HomepageTrustLogosSettings.propTypes = {
  settings: PropTypes.arrayOf(settingsHomepageTrustLogoShape),
  onChange: PropTypes.func.isRequired
};

HomepageTrustLogosSettings.defaultProps = {
  settings: []
};

export default memo(HomepageTrustLogosSettings);
