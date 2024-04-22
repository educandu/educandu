import by from 'thenby';
import { TAB } from './constants.js';
import { Button, Table } from 'antd';
import Markdown from '../markdown.js';
import routes from '../../utils/routes.js';
import slugify from '@sindresorhus/slugify';
import FilterInput from '../filter-input.js';
import { useTranslation } from 'react-i18next';
import { useRequest } from '../request-context.js';
import EditIcon from '../icons/general/edit-icon.js';
import DeleteIcon from '../icons/general/delete-icon.js';
import ResourceTitleCell from '../resource-title-cell.js';
import { useDebouncedFetchingState } from '../../ui/hooks.js';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import DocumentCategoryMetadataModal from './document-category-metadata-modal.js';
import ActionButton, { ACTION_BUTTON_INTENT, ActionButtonGroup } from '../action-button.js';

function fetchDummyCategories() {
  const user1 = {
    _id: 'cxFfNfKWFqTSFWwU5PEUVb',
    displayName: 'jennieseidel71',
    email: 'jennieseidel71@test.com'
  };

  const user2 = {
    _id: '9R3uXriR1mNb1LEJCekXjh',
    displayName: 'verarontini22',
    email: 'verarontini22@test.com'
  };

  const dummyCategories = [
    {
      _id: 'k2juyjKn5BRgF9VGqKoLgA',
      name: 'Hilf mit…',
      iconUrl: 'https://cdn.openmusic.academy/media-library/achtel-NqoSAEfDcfwB1CEDSuJ6xe.svg',
      description: 'Nobis aperiam perferendis doloribus similique. Voluptatem ad quaerat quia voluptas eum quisquam aperiam. Et vel qui qui eligendi tenetur. Iste voluptatum magnam perspiciatis consequatur tempora. Minus quo totam dolores necessitatibus autem cupiditate consequatur. Minima voluptas veritatis minima dignissimos.\n\nIn debitis eos qui quisquam. Ut quam **excepturi assumenda eum saepe deleniti** quae consequatur. Maiores aut nemo provident. Soluta molestiae magni consequatur molestias occaecati. Enim nemo est optio est omnis. Quo rerum ullam vel laudantium aut.',
      documentIds: [],
      createdBy: { ...user1 },
      createdOn: '2024-04-01T13:57:34.364Z',
      updatedBy: { ...user1 },
      updatedOn: '2024-04-01T13:57:34.364Z'
    },
    {
      _id: '9fsqGVnBNXN7k6HW2yVYdo',
      name: 'Lessenswert',
      iconUrl: 'https://cdn.openmusic.academy/media-library/triangel-EGAqmYDvLo4SXSxFR96bzp.svg',
      description: '',
      documentIds: [],
      createdBy: { ...user1 },
      createdOn: '2024-04-01T13:57:34.364Z',
      updatedBy: { ...user2 },
      updatedOn: '2024-04-05T22:12:17.364Z'
    },
    {
      _id: 'kNnvXku9ZPyxXJmwUZcXHL',
      name: 'Herausragend',
      iconUrl: '',
      description: 'Nobis aperiam perferendis doloribus similique. Voluptatem ad quaerat quia voluptas eum quisquam aperiam. Et vel qui qui eligendi tenetur. Iste voluptatum magnam perspiciatis consequatur tempora. Minus quo totam dolores necessitatibus autem cupiditate consequatur. Minima voluptas veritatis minima dignissimos.\n\n![Aufgabenstellungen](https://cdn.openmusic.academy/media-library/Aufgabenstellungen-klein_piLzpJANvcwf7KeW2DAgvw.jpg)',
      documentIds: [],
      createdBy: { ...user2 },
      createdOn: '2024-04-01T13:57:34.364Z',
      updatedBy: { ...user1 },
      updatedOn: '2024-04-05T22:12:17.364Z'
    },
  ];

  return new Promise(resolve => {
    setTimeout(() => resolve({ documentCategories: dummyCategories }), 2000);
  });
}

function getDefaultMetadataModalState() {
  return {
    isOpen: false,
    isEditing: false,
    initialDocumentCategory: {
      name: '',
      iconUrl: '',
      description: ''
    }
  };
}

const getSanitizedQueryFromRequest = request => {
  const query = request.query.tab === TAB.documentCategories ? request.query : {};
  return { filter: (query.filter || '').trim() };
};

function MaintenanceDocumentCategoriesTab() {
  const request = useRequest();
  const { t } = useTranslation('maintenanceDocumentCategoriesTab');
  const [allDocumentCategories, setAllDocumentCategories] = useState([]);
  const [fetchingData, setFetchingData] = useDebouncedFetchingState(true);
  const [displayedDocumentCategories, setDisplayedDocumentCategories] = useState([]);
  const [metadataModalState, setMetadataModalState] = useState(getDefaultMetadataModalState());

  const requestQuery = useMemo(() => getSanitizedQueryFromRequest(request), [request]);

  const [filter, setFilter] = useState(requestQuery.filter);

  const fetchData = useCallback(async () => {
    try {
      setFetchingData(true);
      const documentCategoryApiResponse = await fetchDummyCategories();
      setAllDocumentCategories(documentCategoryApiResponse.documentCategories);
    } finally {
      setFetchingData(false);
    }
  }, [setFetchingData]);

  useEffect(() => {
    const queryParams = { filter };
    history.replaceState(null, '', routes.getMaintenanceUrl(TAB.documentCategories, queryParams));
  }, [filter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const sanitizedFilter = filter.trim().toLowerCase();

    const filteredAndSortedCategories = allDocumentCategories
      .filter(category => !sanitizedFilter || category.name.toLowerCase().includes(sanitizedFilter))
      .sort(by(category => category.createdOn));

    setDisplayedDocumentCategories(filteredAndSortedCategories);
  }, [allDocumentCategories, filter]);

  const handleFilterChange = event => {
    const newFilter = event.target.value;
    setFilter(newFilter);
  };

  const handleCreateDocumentCategoryClick = () => {
    setMetadataModalState({ ...getDefaultMetadataModalState(), isOpen: true });
  };

  const handleMetadataModalSave = () => {
    setMetadataModalState(prev => ({ ...prev, isOpen: false }));
  };

  const handleMetadataModalClose = () => {
    setMetadataModalState(prev => ({ ...prev, isOpen: false }));
  };

  const handleDocumentCategoryEditClick = category => {
    setMetadataModalState(prev => ({
      ...prev,
      initialDocumentCategory: category,
      isEditing: true,
      isOpen: true
    }));
  };

  // eslint-disable-next-line no-unused-vars
  const handleDocumentCategoryDeleteClick = category => {};

  const renderDocumentCategoryIcon = (_, category) => {
    return category.iconUrl
      ? <img src={category.iconUrl} className="MaintenanceDocumentCategoriesTab-categoryIcon" />
      : null;
  };

  const renderDocumentCategoryTitle = (_, category) => {
    return (
      <ResourceTitleCell
        title={category.name}
        shortDescription={<Markdown>{category.description}</Markdown>}
        url={routes.getDocumentCategoryUrl({ id: category._id, slug: slugify(category.name) })}
        createdOn={category.createdOn}
        createdBy={category.createdBy}
        updatedOn={category.updatedOn}
        updatedBy={category.updatedBy}
        />
    );
  };

  const renderDocumentCategoryActions = (_, category) => {
    return (
      <div>
        <ActionButtonGroup>
          <ActionButton
            title={t('common:edit')}
            icon={<EditIcon />}
            intent={ACTION_BUTTON_INTENT.default}
            onClick={() => handleDocumentCategoryEditClick(category)}
            />
          <ActionButton
            title={t('common:delete')}
            icon={<DeleteIcon />}
            intent={ACTION_BUTTON_INTENT.error}
            onClick={() => handleDocumentCategoryDeleteClick(category)}
            />
        </ActionButtonGroup>
      </div>
    );
  };

  const columns = [
    {
      title: t('common:icon'),
      key: 'icon',
      render: renderDocumentCategoryIcon,
      width: '60px'
    },
    {
      title: `${t('common:name')} / ${t('common:description')}`,
      key: 'title',
      render: renderDocumentCategoryTitle
    },
    {
      title: t('common:actions'),
      key: 'actions',
      render: renderDocumentCategoryActions,
      width: '100px'
    }
  ];

  return (
    <div className="MaintenanceDocumentCategoriesTab">
      <div className="MaintenanceDocumentCategoriesTab-controls">
        <FilterInput
          size="large"
          className="MaintenanceDocumentCategoriesTab-filter"
          value={filter}
          onChange={handleFilterChange}
          placeholder={t('filterPlaceholder')}
          />
        <div />
        <Button type="primary" onClick={handleCreateDocumentCategoryClick}>
          {t('common:create')}
        </Button>
      </div>
      <Table
        rowKey="_id"
        columns={columns}
        pagination={false}
        loading={fetchingData}
        dataSource={displayedDocumentCategories}
        />
      <DocumentCategoryMetadataModal
        {...metadataModalState}
        onSave={handleMetadataModalSave}
        onClose={handleMetadataModalClose}
        />
    </div>
  );
}

export default MaintenanceDocumentCategoriesTab;
