import by from 'thenby';
import { Button } from 'antd';
import Table from '../table.js';
import PropTypes from 'prop-types';
import prettyBytes from 'pretty-bytes';
import Logger from '../../common/logger.js';
import { useTranslation } from 'react-i18next';
import { useLocale } from '../locale-context.js';
import { PlusOutlined } from '@ant-design/icons';
import cloneDeep from '../../utils/clone-deep.js';
import SortingSelector from '../sorting-selector.js';
import StoragePlanModal from '../storage-plan-modal.js';
import { handleApiError } from '../../ui/error-helper.js';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import React, { Fragment, useEffect, useMemo, useState } from 'react';
import StorageApiClient from '../../api-clients/storage-api-client.js';
import { confirmStoragePlanDeletion } from '../confirmation-dialogs.js';
import { storagePlanWithAssignedUserCountShape } from '../../ui/default-prop-types.js';

const logger = new Logger(import.meta.url);

function StoragePlansTab({ initialStoragePlans, onStoragePlansSaved }) {
  const { uiLocale } = useLocale();
  const { t } = useTranslation('storagePlansTab');
  const storageApiClient = useSessionAwareApiClient(StorageApiClient);
  const [storagePlans, setStoragePlans] = useState(cloneDeep(initialStoragePlans));
  const [editedStoragePlan, setEditedStoragePlan] = useState(null);
  const [storagePlanNamesInUse, setStoragePlanNamesInUse] = useState([]);
  const [isStoragePlanModalVisible, setIsStoragePlanModalVisible] = useState(false);
  const [sorting, setSorting] = useState({ value: 'name', direction: 'asc' });
  const [displayedStoragePlans, setDisplayedStoragePlans] = useState([]);

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

  const handleSortingChange = ({ value, direction }) => setSorting({ value, direction });

  const renderMaxBytes = maxBytes => prettyBytes(maxBytes, { locale: uiLocale });

  const renderActions = (_actions, storagePlan) => {
    return (
      <Fragment>
        <span><a onClick={() => handleEditClick(storagePlan)}>{t('common:edit')}</a></span>
        {!storagePlan.assignedUserCount && (
          <Fragment>
            &nbsp;&nbsp;&nbsp;
            <span><a onClick={() => handleDeleteClick(storagePlan)}>{t('common:delete')}</a></span>
          </Fragment>
        )}
      </Fragment>
    );
  };

  const sortingOptions = [
    { label: t('common:name'), appliedLabel: t('common:sortedByName'), value: 'name' },
    { label: t('common:capacity'), appliedLabel: t('common:sortedByCapacity'), value: 'capacity' },
    { label: t('assignedUserCount'), appliedLabel: t('sortedByAssignedUserCount'), value: 'assignedUserCount' }
  ];

  const sorters = useMemo(() => ({
    name: documentsToSort => documentsToSort.sort(by(doc => doc.name, { direction: sorting.direction, ignoreCase: true })),
    capacity: documentsToSort => documentsToSort.sort(by(doc => doc.maxBytes, sorting.direction)),
    assignedUserCount: documentsToSort => documentsToSort.sort(by(doc => doc.assignedUserCount, sorting.direction))
  }), [sorting.direction]);

  useEffect(() => {
    const newPlans = [...storagePlans];
    const sorter = sorters[sorting.value];
    const sortedPlans = sorter ? sorter(newPlans) : newPlans;
    setDisplayedStoragePlans(sortedPlans);
  }, [storagePlans, sorting, sorters]);

  const columns = [
    {
      title: t('common:name'),
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: t('common:capacity'),
      dataIndex: 'maxBytes',
      key: 'maxBytes',
      render: renderMaxBytes
    },
    {
      title: t('assignedUserCount'),
      dataIndex: 'assignedUserCount',
      key: 'assignedUserCount',
      responsive: ['sm']
    },
    {
      title: t('common:actions'),
      dataIndex: 'actions',
      key: 'actions',
      render: renderActions
    }
  ];

  return (
    <div className="StoragePlansTab">
      <SortingSelector
        size="large"
        sorting={sorting}
        options={sortingOptions}
        onChange={handleSortingChange}
        />
      <Table dataSource={[...displayedStoragePlans]} rowKey="_id" columns={columns} pagination />
      <Button
        className="StoragePlansTab-newStoragePlanButton"
        type="primary"
        shape="circle"
        size="large"
        icon={<PlusOutlined />}
        onClick={handleNewStoragePlanClick}
        />
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
