import PropTypes from 'prop-types';
import classNames from 'classnames';
import DiffView from '../diff-view.js';
import routes from '../../utils/routes.js';
import { Button, Select, Tooltip } from 'antd';
import SectionDisplay from '../section-display.js';
import { useRequest } from '../request-context.js';
import { useService } from '../container-context.js';
import { useDateFormat } from '../locale-context.js';
import { AlignLeftOutlined } from '@ant-design/icons';
import { Trans, useTranslation } from 'react-i18next';
import PreviewIcon from '../icons/general/preview-icon.js';
import PluginRegistry from '../../plugins/plugin-registry.js';
import React, { Fragment, useEffect, useMemo, useState } from 'react';
import { documentRevisionShape } from '../../ui/default-prop-types.js';
import { getVersionedDocumentRevisions } from '../../utils/document-utils.js';
import { ensurePluginComponentAreLoadedForSections } from '../../utils/plugin-utils.js';
import { createDocumentRevisionComparison, SECTION_CHANGE_TYPE } from '../../utils/document-revision-comparison-utils.js';

const { Option } = Select;

const NOOP = () => {};

const SECTION_CONTEXT = { isPreview: true };

const DISPLAY_MODE = {
  text: 'text',
  preview: 'preview'
};

const TARGET = {
  old: 'old',
  new: 'new'
};

class ComparisonPreloader {
  static dependencies = [PluginRegistry];

  constructor(pluginRegistry) {
    this.pluginRegistry = pluginRegistry;
  }

  preload({ initialState }) {
    return ensurePluginComponentAreLoadedForSections({
      sections: initialState.revisions.flatMap(revision => revision.sections),
      pluginRegistry: this.pluginRegistry,
      displayOnly: true
    });
  }
}

const resetSectionInInput = (input, sectionComparisonKey) => {
  return {
    ...input,
    sections: {
      ...input.sections,
      [sectionComparisonKey]: {
        ...input.sections[sectionComparisonKey],
        data: null,
        files: []
      }
    }
  };
};

const createEmptyDocumentInput = comparison => {
  return {
    sections: Object.fromEntries(comparison.sections.map(sectionComparison => [sectionComparison.key, { data: null, files: [], comments: [] }]))
  };
};

function Comparison({ initialState, PageTemplate }) {
  const request = useRequest();
  const { revisions } = initialState;
  const { formatDate } = useDateFormat();
  const { t } = useTranslation('comparison');
  const pluginRegistry = useService(PluginRegistry);
  const [comparison, setComparison] = useState(null);
  const [pendingOldInput, setPendingOldInput] = useState(null);
  const [pendingNewInput, setPendingNewInput] = useState(null);
  const [oldRevisionId, setOldRevisionId] = useState(request.query.oldId);
  const [newRevisionId, setNewRevisionId] = useState(request.query.newId);
  const [displayModesByMappedRevisionKey, setDisplayModesByMappedRevisionKey] = useState({});

  const versionedRevisions = useMemo(() => getVersionedDocumentRevisions(revisions, t), [revisions, t]);

  useEffect(() => {
    const oldRevision = revisions.find(rev => rev._id === oldRevisionId);
    const newRevision = revisions.find(rev => rev._id === newRevisionId);
    if (newRevision.order < oldRevision.order) {
      setOldRevisionId(newRevision._id);
      setNewRevisionId(oldRevision._id);
      return;
    }

    const documentId = revisions[0].documentId;
    const newComparison = createDocumentRevisionComparison(oldRevision, newRevision, pluginRegistry);
    setComparison(newComparison);
    setPendingOldInput(createEmptyDocumentInput(newComparison));
    setPendingNewInput(createEmptyDocumentInput(newComparison));
    setDisplayModesByMappedRevisionKey(newComparison.sections.reduce((accu, { key }) => ({ ...accu, [key]: DISPLAY_MODE.text }), {}));
    history.replaceState(null, '', routes.getDocumentRevisionComparisonUrl({ documentId, oldId: oldRevisionId, newId: newRevisionId }));
  }, [pluginRegistry, revisions, oldRevisionId, newRevisionId]);

  const handleSectionDisplayModeChange = (sectionComparisonKey, newDisplayMode) => {
    setPendingOldInput(input => resetSectionInInput(input, sectionComparisonKey));
    setPendingNewInput(input => resetSectionInInput(input, sectionComparisonKey));
    setDisplayModesByMappedRevisionKey(oldModes => ({ ...oldModes, [sectionComparisonKey]: newDisplayMode }));
  };

  const handleSectionInputChange = (sectionComparisonKey, target, newData) => {
    const handler = target === TARGET.old ? setPendingOldInput : setPendingNewInput;
    handler(input => ({
      ...input,
      sections: {
        ...input.sections,
        [sectionComparisonKey]: {
          ...input.sections[sectionComparisonKey],
          data: newData
        }
      }
    }));
  };

  const renderSelectOption = revision => (
    <span className="ComparisonPage-selectItemHeader">
      <div>
        {revision.versionText}
      </div>
      <div className="ComparisonPage-selectItemHeaderSubtext">
        {formatDate(revision.createdOn)}
      </div>
    </span>
  );

  const renderPanelToolbarAction = action => (
    <Tooltip key={action.key} title={action.tooltip} placement="topRight">
      <Button
        type="text"
        size="small"
        icon={action.icon}
        className="u-action-button"
        onClick={action.handleAction}
        />
    </Tooltip>
  );

  const renderPanel = ({ id, info, actions, content }) => (
    <section key={id} id={id} className="ComparisonPage-panel">
      <div className="ComparisonPage-panelToolbar">
        <div className="ComparisonPage-panelToolbarInfo">
          {info}
        </div>
        <div className="ComparisonPage-panelToolbarButtons">
          {actions.map(renderPanelToolbarAction)}
        </div>
      </div>
      <div className="ComparisonPage-panelToolbarContent">
        {content}
      </div>
    </section>
  );

  const renderSectionPreview = (section, sectionComparisonKey, target) => {
    const pendingInput = target === TARGET.old ? pendingOldInput : pendingNewInput;
    return (
      <SectionDisplay
        canModifyInput
        canEdit={false}
        key={`${section.key}-${target}`}
        section={section}
        sectionInput={pendingInput?.sections[sectionComparisonKey] || null}
        isDragged={false}
        isEditing={false}
        isPending={false}
        dragHandleProps={{}}
        canHardDelete={false}
        context={SECTION_CONTEXT}
        isOtherSectionDragged={false}
        onSectionDelete={NOOP}
        onSectionMoveUp={NOOP}
        onSectionMoveDown={NOOP}
        onSectionEditLeave={NOOP}
        onSectionEditEnter={NOOP}
        onSectionDuplicate={NOOP}
        onSectionHardDelete={NOOP}
        onPendingSectionApply={NOOP}
        onSectionContentChange={NOOP}
        onPendingSectionDiscard={NOOP}
        onSectionCopyToClipboard={NOOP}
        onSectionInputChange={newData => handleSectionInputChange(sectionComparisonKey, target, newData)}
        />
    );
  };

  const renderSectionMissingInfo = () => {
    return (
      <div className="ComparisonPage-sectionMissingInfo">
        {t('nonExistentSection')}
      </div>
    );
  };

  const renderSectionMovementInfo = sectionComparison => {
    const handleFollowSectionMovementClick = event => {
      event.preventDefault();
      const targetElement = window.document.getElementById(sectionComparison.targetKey);
      targetElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };
    return (
      <div id={sectionComparison.key} className="ComparisonPage-sectionMovementInfo" key={sectionComparison.key}>
        <Trans
          t={t}
          i18nKey="sectionMovementInfo"
          values={{ placement: sectionComparison.changeType }}
          components={[<a key="link" onClick={handleFollowSectionMovementClick} />]}
          />
      </div>
    );
  };

  const renderSectionMovementBackInfo = sectionComparison => {
    if (sectionComparison.changeType === SECTION_CHANGE_TYPE.movedHere) {
      const handleFollowSectionMovementBackClick = event => {
        event.preventDefault();
        const targetElement = window.document.getElementById(sectionComparison.targetKey);
        targetElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      };
      return (
        <div className="ComparisonPage-sectionMovementBackInfo">
          <Trans
            t={t}
            i18nKey="sectionMovementInfoBack"
            components={[<a key="link" onClick={handleFollowSectionMovementBackClick} />]}
            />
        </div>
      );
    }

    return null;
  };

  const renderMetadataComparison = metadataComparison => {
    const panelContent = (
      <div className="ComparisonPage-metadataPanelContent">
        <DiffView diff={metadataComparison.diff} />
      </div>
    );

    return renderPanel({ id: 'metadata', info: `${t('metadata')}`, actions: [], content: panelContent });
  };

  const renderSectionComparison = sectionComparison => {
    if (sectionComparison.changeType === SECTION_CHANGE_TYPE.movedDown || sectionComparison.changeType === SECTION_CHANGE_TYPE.movedUp) {
      return renderSectionMovementInfo(sectionComparison);
    }

    const displayMode = displayModesByMappedRevisionKey[sectionComparison.key];
    const panelInfo = sectionComparison.plugin?.info.getDisplayName(t) || `${t('common:unknown')} (${sectionComparison.sectionType})`;
    const panelActions = [
      {
        key: 'textDisplay',
        tooltip: t('tooltipTextDisplay'),
        icon: <AlignLeftOutlined />,
        isVisible: displayMode === DISPLAY_MODE.preview,
        handleAction: () => handleSectionDisplayModeChange(sectionComparison.key, DISPLAY_MODE.text)
      },
      {
        key: 'previewDisplay',
        tooltip: t('tooltipPreviewDisplay'),
        icon: <PreviewIcon />,
        isVisible: displayMode === DISPLAY_MODE.text,
        handleAction: () => handleSectionDisplayModeChange(sectionComparison.key, DISPLAY_MODE.preview)
      }
    ].filter(action => action.isVisible);

    const isAddOrRemove = sectionComparison.changeType === SECTION_CHANGE_TYPE.added || sectionComparison.changeType === SECTION_CHANGE_TYPE.removed;

    const comparisonClasses = classNames({
      'ComparisonPage-sectionComparison': true,
      'ComparisonPage-sectionComparison--diff': displayMode === DISPLAY_MODE.text,
      'ComparisonPage-sectionComparison--split': displayMode === DISPLAY_MODE.preview || isAddOrRemove
    });

    const panelContent = (
      <Fragment>
        {renderSectionMovementBackInfo(sectionComparison)}
        <div className={comparisonClasses}>
          {displayMode === DISPLAY_MODE.text && (
            <Fragment>
              {sectionComparison.changeType === SECTION_CHANGE_TYPE.added && renderSectionMissingInfo()}
              <DiffView diff={sectionComparison.diff} />
              {sectionComparison.changeType === SECTION_CHANGE_TYPE.removed && renderSectionMissingInfo()}
            </Fragment>
          )}
          {displayMode === DISPLAY_MODE.preview && (
            <Fragment>
              {sectionComparison.changeType === SECTION_CHANGE_TYPE.added && renderSectionMissingInfo()}
              {sectionComparison.changeType !== SECTION_CHANGE_TYPE.added && renderSectionPreview(sectionComparison.oldSection, sectionComparison.key, TARGET.old)}
              {sectionComparison.changeType !== SECTION_CHANGE_TYPE.removed && renderSectionPreview(sectionComparison.newSection, sectionComparison.key, TARGET.new)}
              {sectionComparison.changeType === SECTION_CHANGE_TYPE.removed && renderSectionMissingInfo()}
            </Fragment>
          )}
        </div>
      </Fragment>
    );

    return renderPanel({ id: sectionComparison.key, info: panelInfo, actions: panelActions, content: panelContent });
  };

  return (
    <PageTemplate>
      <div className="ComparisonPage">
        <h1 className="u-page-title">{t('pageNames:comparison')}</h1>
        <div className="ComparisonPage-versionSelectors">
          <Select value={oldRevisionId} onChange={setOldRevisionId} optionLabelProp="title">
            {versionedRevisions.map(revision => (
              <Option key={revision._id} value={revision._id} title={revision.versionText}>
                {renderSelectOption(revision)}
              </Option>
            ))}
          </Select>
          <Select value={newRevisionId} onChange={setNewRevisionId} optionLabelProp="title">
            {versionedRevisions.map(revision => (
              <Option key={revision._id} value={revision._id} title={revision.versionText}>
                {renderSelectOption(revision)}
              </Option>
            ))}
          </Select>
        </div>
        {!!comparison && (
          <div className="ComparisonPage-comparison">
            {renderMetadataComparison(comparison.metadata)}
            {comparison.sections.map(renderSectionComparison)}
          </div>
        )}
      </div>
    </PageTemplate>
  );
}

Comparison.propTypes = {
  PageTemplate: PropTypes.func.isRequired,
  initialState: PropTypes.shape({
    revisions: PropTypes.arrayOf(documentRevisionShape).isRequired
  }).isRequired

};

Comparison.clientPreloader = ComparisonPreloader;

export default Comparison;
