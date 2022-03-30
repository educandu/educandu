import { Button, Card } from 'antd';
import PropTypes from 'prop-types';
import prettyBytes from 'pretty-bytes';
import React, { useState } from 'react';
import Logger from '../../common/logger.js';
import { useTranslation } from 'react-i18next';
import { useLocale } from '../locale-context.js';
import { PlusOutlined } from '@ant-design/icons';
import cloneDeep from '../../utils/clone-deep.js';
import EditIcon from '../icons/general/edit-icon.js';
import StoragePlanModal from '../storage-plan-modal.js';
import DeleteIcon from '../icons/general/delete-icon.js';
import { handleApiError } from '../../ui/error-helper.js';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import StorageApiClient from '../../api-clients/storage-api-client.js';
import { confirmStoragePlanDeletion } from '../confirmation-dialogs.js';
import { storagePlanWithAssignedUserCountShape } from '../../ui/default-prop-types.js';

const { Meta } = Card;

const logger = new Logger(import.meta.url);

function StoragePlansTab({ initialStoragePlans, onStoragePlansSaved }) {
  const { uiLocale } = useLocale();
  const { t } = useTranslation('storagePlansTab');
  const storageApiClient = useSessionAwareApiClient(StorageApiClient);
  const [storagePlans, setStoragePlans] = useState(cloneDeep(initialStoragePlans));
  const [editedStoragePlan, setEditedStoragePlan] = useState(null);
  const [storagePlanNamesInUse, setStoragePlanNamesInUse] = useState([]);
  const [isStoragePlanModalVisible, setIsStoragePlanModalVisible] = useState(false);

  const handleEditClick = storagePlan => {
    const { _id, name, maxBytes } = storagePlan;
    setEditedStoragePlan({ _id, name, maxBytes });
    setStoragePlanNamesInUse(storagePlans.filter(plan => plan._id !== storagePlan._id).map(plan => plan.name));
    setIsStoragePlanModalVisible(true);
  };

  const handleNewStoragePlanClick = () => {
    setEditedStoragePlan(null);
    setStoragePlanNamesInUse(storagePlans.map(plan => plan.name));
    setIsStoragePlanModalVisible(true);
  };

  const handleDeleteClick = storagePlan => {
    confirmStoragePlanDeletion(t, storagePlan, async () => {
      try {
        await storageApiClient.deleteStoragePlan(storagePlan._id);
        const currentStoragePlans = await storageApiClient.getAllStoragePlans(true);
        setStoragePlans(currentStoragePlans);
        onStoragePlansSaved(currentStoragePlans);
      } catch (error) {
        handleApiError({ error, logger, t });
        throw error;
      }
    });
  };

  const handleModalOk = async storagePlan => {
    try {
      if (storagePlan._id) {
        await storageApiClient.updateStoragePlan({
          storagePlanId: storagePlan._id,
          name: storagePlan.name,
          maxBytes: storagePlan.maxBytes
        });
      } else {
        await storageApiClient.createStoragePlan({
          name: storagePlan.name,
          maxBytes: storagePlan.maxBytes
        });
      }

      const currentStoragePlans = await storageApiClient.getAllStoragePlans(true);
      setStoragePlans(currentStoragePlans);
      onStoragePlansSaved(currentStoragePlans);
      setEditedStoragePlan(null);
      setStoragePlanNamesInUse([]);
      setIsStoragePlanModalVisible(false);
    } catch (error) {
      handleApiError({ error, logger, t });
    }
  };

  const handleModalCancel = () => {
    setEditedStoragePlan(null);
    setStoragePlanNamesInUse([]);
    setIsStoragePlanModalVisible(false);
  };

  const renderStoragePlanActions = storagePlan => {
    const actions = [
      <a
        key="edit"
        onClick={() => handleEditClick(storagePlan)}
        >
        <EditIcon />
      </a>
    ];

    if (!storagePlan.assignedUserCount) {
      actions.push((
        <a
          key="delete"
          onClick={() => handleDeleteClick(storagePlan)}
          disabled={!!storagePlan.assignedUserCount}
          >
          <DeleteIcon />
        </a>
      ));
    }

    return actions;
  };

  return (
    <div className="StoragePlansTab">
      <div className="StoragePlansTab-cards">
        {storagePlans.map(storagePlan => (
          <Card
            key={storagePlan._id}
            className="StoragePlansTab-card"
            actions={renderStoragePlanActions(storagePlan)}
            >
            <Meta
              title={storagePlan.name}
              description={(
                <div>
                  <div>{t('common:capacity')}: {prettyBytes(storagePlan.maxBytes, { locale: uiLocale })}</div>
                  <div>{t('assignedUserCount')}: {storagePlan.assignedUserCount}</div>
                </div>
              )}
              />
          </Card>
        ))}
      </div>
      <div className="StoragePlansTab-newStoragePlan">
        <Button
          type="primary"
          shape="circle"
          size="large"
          icon={<PlusOutlined />}
          onClick={handleNewStoragePlanClick}
          />
      </div>
      <StoragePlanModal
        isVisible={isStoragePlanModalVisible}
        storagePlan={editedStoragePlan}
        storagePlanNamesInUse={storagePlanNamesInUse}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        />
    </div>
  );
}

StoragePlansTab.propTypes = {
  initialStoragePlans: PropTypes.arrayOf(storagePlanWithAssignedUserCountShape).isRequired,
  onStoragePlansSaved: PropTypes.func.isRequired
};

export default StoragePlansTab;
