import { useCallback, useState } from 'react';

const queryToValues = query => {
  const pageNumber = Number(query.page);
  const pageSizeNumber = Number(query.pageSize);
  return {
    page: typeof pageNumber === 'number' && !isNaN(pageNumber) && pageNumber > 0 ? pageNumber : 1,
    pageSize: typeof pageSizeNumber === 'number' && !isNaN(pageSizeNumber) && pageSizeNumber > 0 ? pageSizeNumber : 10
  };
};

const valuesToQuery = values => ({
  page: String(values.page),
  pageSize: String(values.pageSize)
});

const adjustValuesToItems = (values, items) => ({
  page: Math.max(1, Math.min(values.page, Math.ceil(items.length / values.pageSize))),
  pageSize: values.pageSize
});

const createPaging = values => ({
  values,
  query: valuesToQuery(values),
  antdTablePagination: {
    current: values.page,
    pageSize: values.pageSize,
    showSizeChanger: true
  }
});

export function usePaging(initialQuery) {
  const [paging, setPaging] = useState(() => createPaging(queryToValues(initialQuery)));

  const handleAntdTableChange = useCallback(({ current, pageSize }) => {
    setPaging(createPaging({ page: current, pageSize }));
  }, []);

  const adjustPagingToItems = useCallback(items => {
    setPaging(oldPaging => createPaging(adjustValuesToItems(oldPaging.values, items)));
  }, []);

  return { paging, handleAntdTableChange, adjustPagingToItems };
}
