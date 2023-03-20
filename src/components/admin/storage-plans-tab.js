import by from 'thenby';
import prettyBytes from 'pretty-bytes';
import Logger from '../../common/logger.js';
import { Button, message, Table } from 'antd';
import { useTranslation } from 'react-i18next';
import { useLocale } from '../locale-context.js';
import { PlusOutlined } from '@ant-design/icons';
import SortingSelector from '../sorting-selector.js';
import StoragePlanModal from '../storage-plan-modal.js';
import { handleApiError } from '../../ui/error-helper.js';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import React, { Fragment, useEffect, useMemo, useState } from 'react';
import { confirmStoragePlanDeletion } from '../confirmation-dialogs.js';
import StoragePlanApiClient from '../../api-clients/storage-plan-api-client.js';

const logger = new Logger(import.meta.url);

function StoragePlansTab() {
  const { uiLocale } = useLocale();
  const { t } = useTranslation('storagePlansTab');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [storagePlans, setStoragePlans] = useState([]);
  const [editedStoragePlan, setEditedStoragePlan] = useState(null);
  const [storagePlanNamesInUse, setStoragePlanNamesInUse] = useState([]);
  const [displayedStoragePlans, setDisplayedStoragePlans] = useState([]);
  const storagePlanApiClient = useSessionAwareApiClient(StoragePlanApiClient);
  const [isStoragePlanModalOpen, setIsStoragePlanModalOpen] = useState(false);
  const [sorting, setSorting] = useState({ value: 'name', direction: 'asc' });

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const currentStoragePlans = await storagePlanApiClient.getAllStoragePlans(true);
        setStoragePlans(currentStoragePlans);
      } catch (error) {
        handleApiError({ error, logger, t });
      } finally {
        setIsLoading(false);
      }
    })();
  }, [storagePlanApiClient, t]);

  const handleEditClick = storagePlan => {
    const { _id, name, maxBytes } = storagePlan;
    setEditedStoragePlan({ _id, name, maxBytes });
    setStoragePlanNamesInUse(storagePlans.filter(plan => plan._id !== storagePlan._id).map(plan => plan.name));
    setIsStoragePlanModalOpen(true);
  };

  const handleNewStoragePlanClick = () => {
    setEditedStoragePlan(null);
    setStoragePlanNamesInUse(storagePlans.map(plan => plan.name));
    setIsStoragePlanModalOpen(true);
  };

  const handleDeleteClick = storagePlan => {
    confirmStoragePlanDeletion(t, storagePlan, async () => {
      try {
        setIsSaving(true);
        await storagePlanApiClient.deleteStoragePlan(storagePlan._id);
        const currentStoragePlans = await storagePlanApiClient.getAllStoragePlans(true);
        setStoragePlans(currentStoragePlans);
      } catch (error) {
        handleApiError({ error, logger, t });
      } finally {
        setIsSaving(false);
      }
    });
  };

  const handleModalOk = async storagePlan => {
    try {
      setIsSaving(true);

      if (storagePlan._id) {
        await storagePlanApiClient.updateStoragePlan({
          storagePlanId: storagePlan._id,
          name: storagePlan.name,
          maxBytes: storagePlan.maxBytes
        });
      } else {
        await storagePlanApiClient.createStoragePlan({
          name: storagePlan.name,
          maxBytes: storagePlan.maxBytes
        });
      }

      const currentStoragePlans = await storagePlanApiClient.getAllStoragePlans(true);
      setStoragePlans(currentStoragePlans);
      setEditedStoragePlan(null);
      setStoragePlanNamesInUse([]);
      setIsStoragePlanModalOpen(false);
      message.success({ content: t('common:changesSavedSuccessfully') });
    } catch (error) {
      handleApiError({ error, logger, t });
    } finally {
      setIsSaving(false);
    }
  };

  const handleModalCancel = () => {
    setEditedStoragePlan(null);
    setStoragePlanNamesInUse([]);
    setIsStoragePlanModalOpen(false);
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
      <Table
        rowKey="_id"
        columns={columns}
        dataSource={displayedStoragePlans}
        bordered
        pagination={false}
        loading={{ size: 'large', spinning: isLoading, delay: 500 }}
        />
      <Button
        className="StoragePlansTab-newStoragePlanButton"
        type="primary"
        shape="circle"
        size="large"
        icon={<PlusOutlined />}
        onClick={handleNewStoragePlanClick}
        />
      <StoragePlanModal
        isLoading={isSaving}
        isOpen={isStoragePlanModalOpen}
        storagePlan={editedStoragePlan}
        storagePlanNamesInUse={storagePlanNamesInUse}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        />
    </div>
  );
}

export default StoragePlansTab;
