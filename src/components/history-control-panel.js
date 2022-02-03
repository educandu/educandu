import React from 'react';
import PropTypes from 'prop-types';
import { Button, Slider } from 'antd';
import Restricted from './restricted.js';
import ControlPanel from './control-panel.js';
import { useTranslation } from 'react-i18next';
import permissions from '../domain/permissions.js';
import { useService } from './container-context.js';
import { useDateFormat, useLanguage } from './language-context.js';
import { documentRevisionShape } from '../ui/default-prop-types.js';
import LanguageNameProvider from '../data/language-name-provider.js';

import { HistoryOutlined, PaperClipOutlined, ReloadOutlined } from '@ant-design/icons';

function HistoryControlPanel({
  revisions,
  selectedRevisionIndex,
  canRestoreRevisions,
  startOpen,
  onOpen,
  onClose,
  onPermalinkRequest,
  onSelectedRevisionChange,
  onRestoreRevision
}) {
  const { language } = useLanguage();
  const { formatDate } = useDateFormat();
  const { t } = useTranslation('historyControlPanel');
  const languageNameProvider = useService(LanguageNameProvider);

  const isSelectedRevisionLatestRevision = selectedRevisionIndex === revisions.length - 1;

  const marks = revisions.reduce((accu, _item, index) => {
    accu[index] = '';
    return accu;
  }, {});

  const handleOpen = () => onOpen();

  const handleClose = () => onClose();

  const formatRevisionTooltip = index => {
    const revision = revisions[index];
    const languageName = languageNameProvider.getData(language)[revision.language].name;

    return (
      <div>
        <div>{t('common:revision')}: <b>{index + 1}</b></div>
        <div>{t('common:date')}: <b>{formatDate(revision.createdOn)}</b></div>
        <div>{t('common:language')}: <b>{languageName}</b></div>
        <div>{t('common:user')}: <b>{revision.createdBy.username}</b></div>
        <div>{t('common:id')}: <b>{revision._id}</b></div>
        {revision.restoredFrom && (
          <div style={{ whiteSpace: 'nowrap' }}>{t('restoredFrom')}: <b>{revision.restoredFrom}</b></div>
        )}
      </div>
    );
  };

  const renderSlider = () => {
    if (!revisions.length) {
      return null;
    }

    return (
      <div className="HistoryControlPanel-leftSide">
        <div className="HistoryControlPanel-sliderLabel">{t('common:revision')}:</div>
        <Slider
          className="HistoryControlPanel-slider"
          min={0}
          max={revisions.length - 1}
          value={selectedRevisionIndex}
          step={null}
          marks={marks}
          onChange={onSelectedRevisionChange}
          tipFormatter={formatRevisionTooltip}
          trackStyle={{ color: 'white' }}
          handleStyle={{ color: 'white' }}
          />
      </div>
    );
  };

  const renderButtons = () => (
    <div className="HistoryControlPanel-rightSide">
      <Button
        className="HistoryControlPanel-button"
        size="small"
        icon={<PaperClipOutlined />}
        onClick={onPermalinkRequest}
        ghost
        >
        {t('permalink')}
      </Button>
      {canRestoreRevisions && (
        <Restricted to={permissions.RESTORE_DOC_REVISIONS}>
          <Button
            className="HistoryControlPanel-button"
            size="small"
            icon={<ReloadOutlined />}
            onClick={onRestoreRevision}
            disabled={isSelectedRevisionLatestRevision}
            ghost
            >
            {t('restore')}
          </Button>
        </Restricted>
      )}
    </div>
  );

  return (
    <ControlPanel
      className="HistoryControlPanel"
      startOpen={startOpen}
      openIcon={<HistoryOutlined />}
      openIconPositionFromRight={2}
      canClose
      onOpen={handleOpen}
      onClose={handleClose}
      leftSideContent={renderSlider()}
      rightSideContent={renderButtons()}
      />
  );
}

HistoryControlPanel.propTypes = {
  canRestoreRevisions: PropTypes.bool,
  onClose: PropTypes.func,
  onOpen: PropTypes.func,
  onPermalinkRequest: PropTypes.func,
  onRestoreRevision: PropTypes.func,
  onSelectedRevisionChange: PropTypes.func,
  revisions: PropTypes.arrayOf(documentRevisionShape),
  selectedRevisionIndex: PropTypes.number,
  startOpen: PropTypes.bool
};

HistoryControlPanel.defaultProps = {
  canRestoreRevisions: false,
  onClose: () => Promise.resolve(true),
  onOpen: () => Promise.resolve(),
  onPermalinkRequest: () => {},
  onRestoreRevision: () => {},
  onSelectedRevisionChange: () => {},
  revisions: [],
  selectedRevisionIndex: 0,
  startOpen: false
};

export default HistoryControlPanel;
