import React from 'react';
import Markdown from './markdown.js';
import { Modal, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import { useService } from './container-context.js';
import ClientConfig from '../bootstrap/client-config.js';
import { QuestionCircleOutlined } from '@ant-design/icons';

function UserRoleInfo() {
  const { t } = useTranslation('userRoleInfo');
  const clientConfig = useService(ClientConfig);
  const [modal, contextHolder] = Modal.useModal();

  const handleInfoIconClick = event => {
    event.stopPropagation();
    modal.info({
      width: '70vw',
      title: t('modalTitle', { appName: clientConfig.appName }),
      content: (
        <Markdown className="UserRoleInfo-modalContent">
          {t('modalContentMarkdown', { appName: clientConfig.appName })}
        </Markdown>
      )
    });
  };

  return (
    <div className="UserRoleInfo">
      {contextHolder}
      <Tooltip title={t('common:openHelp')}>
        <QuestionCircleOutlined className="UserRoleInfo-infoIcon" onClick={handleInfoIconClick} />
      </Tooltip>
    </div>
  );
}

export default UserRoleInfo;
