import React from 'react';
import PropTypes from 'prop-types';
import { Button, Slider } from 'antd';
import Restricted from './restricted.js';
import ControlPanel from './control-panel.js';
import { useTranslation } from 'react-i18next';
import permissions from '../domain/permissions.js';
import { useService } from './container-context.js';
import { useDateFormat, useLocale } from './locale-context.js';
import { documentRevisionShape } from '../ui/default-prop-types.js';
import { PaperClipOutlined, ReloadOutlined } from '@ant-design/icons';
import ViewHistoryIcon from './icons/multi-color/view-history-icon.js';
import LanguageDataProvider from '../localization/language-data-provider.js';

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
  const { uiLanguage } = useLocale();
  const { formatDate } = useDateFormat();
  const { t } = useTranslation('historyControlPanel');
  const languageDataProvider = useService(LanguageDataProvider);

  const isSelectedRevisionLatestRevision = selectedRevisionIndex === revisions.length - 1;

  const marks = revisions.reduce((accu, _item, index) => ({ ...accu, [index]: <span /> }), {});

  const handleOpen = () => onOpen();

  const handleClose = () => onClose();

  const formatRevisionTooltip = index => {
    const revision = revisions[index];
    const { name: languageName } = languageDataProvider.getLanguageData(revision.language, uiLanguage);

    return (
      <div>
        <div>{t('common:version')}: <b>{index + 1}</b></div>
        <div>{t('common:date')}: <b>{formatDate(revision.createdOn)}</b></div>
        <div>{t('common:language')}: <b>{languageName}</b></div>
        <div>{t('common:user')}: <b>{revision.createdBy.displayName}</b></div>
        <div>{t('common:id')}: <b>{revision._id}</b></div>
        {!!revision.restoredFrom && (
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
        <div className="HistoryControlPanel-sliderLabel">{t('common:version')}:</div>
        <Slider
          className="HistoryControlPanel-slider"
          min={0}
          max={revisions.length - 1}
          value={selectedRevisionIndex}
          step={null}
          marks={marks}
          onChange={onSelectedRevisionChange}
          tooltip={{ formatter: formatRevisionTooltip }}
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
      {!!canRestoreRevisions && (
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
      openIcon={<ViewHistoryIcon />}
      tooltipWhenClosed={t('tooltip')}
      leftSideContent={renderSlider()}
      contentBeforeClose={renderButtons()}
      onOpen={handleOpen}
      onClose={handleClose}
      />
  );
}

HistoryControlPanel.propTypes = {
  revisions: PropTypes.arrayOf(documentRevisionShape),
  selectedRevisionIndex: PropTypes.number,
  canRestoreRevisions: PropTypes.bool,
  startOpen: PropTypes.bool,
  onOpen: PropTypes.func,
  onClose: PropTypes.func,
  onPermalinkRequest: PropTypes.func,
  onRestoreRevision: PropTypes.func,
  onSelectedRevisionChange: PropTypes.func
};

HistoryControlPanel.defaultProps = {
  revisions: [],
  selectedRevisionIndex: 0,
  canRestoreRevisions: false,
  startOpen: false,
  onOpen: () => Promise.resolve(),
  onClose: () => Promise.resolve(true),
  onPermalinkRequest: () => { },
  onRestoreRevision: () => { },
  onSelectedRevisionChange: () => { }
};

export default HistoryControlPanel;
