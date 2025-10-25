import dayjs from 'dayjs';
import { useCallback, useState } from 'react';
import { processAsIteratorIfAvailable } from '../utils/array-utils.js';

export const createTextFilter = (name, filterFunc, { treatEmptyAsNull = false, prepareFilterValue = x => x } = { treatEmptyAsNull: false, prepareFilterValue: x => x }) => ({
  name,
  queryToValues: query => ({ [name]: (query[name] || '').trim() || (treatEmptyAsNull ? null : '') }),
  valuesToQuery: filteringValues => ({ [name]: filteringValues[name] || '' }),
  filterItems: (itemsIterator, filteringValues) => {
    const trimmedValue = (filteringValues[name] || '').trim();
    if (treatEmptyAsNull && !trimmedValue) {
      return itemsIterator;
    }

    const filterValue = prepareFilterValue(trimmedValue);
    return filterValue
      ? itemsIterator.filter(item => filterFunc(item, filterValue))
      : itemsIterator;
  }
});

export const createDateFilter = (name, filterFunc) => ({
  name,
  queryToValues: query => {
    const valueInMilliseconds = parseInt((query[name] || '').trim(), 10);
    const value = !isNaN(valueInMilliseconds) ? new Date(valueInMilliseconds) : null;
    return { [name]: value };
  },
  valuesToQuery: filteringValues => {
    const value = String(filteringValues[name]?.getTime() ?? '');
    return { [name]: value };
  },
  filterItems: (itemsIterator, filteringValues) => {
    const filterValue = filteringValues[name];
    return filterValue
      ? itemsIterator.filter(item => filterFunc(item, filterValue))
      : itemsIterator;
  }
});

const createFilteringConfiguration = filters => ({
  filters,
  filtersByName: Object.fromEntries(filters.map(filter => [filter.name, filter])),
  queryToValues: query => {
    return filters.reduce((accu, filter) => ({ ...accu, ...filter.queryToValues(query) }), {});
  },
  valuesToQuery: filteringValues => {
    return filters.reduce((accu, filter) => ({ ...accu, ...filter.valuesToQuery(filteringValues) }), {});
  }
});

export function useFilteringConfiguration(filters) {
  const [filteringConfiguration] = useState(() => createFilteringConfiguration(filters));
  return { filteringConfiguration };
}

const createFiltering = (filteringConfiguration, values) => ({
  values,
  query: filteringConfiguration.valuesToQuery(values)
});

export function useFiltering(initialQuery, filteringConfiguration) {
  const [filtering, setFiltering] = useState(() => createFiltering(filteringConfiguration, filteringConfiguration.queryToValues(initialQuery)));

  const getTextFilterValue = useCallback(filterName => {
    return filtering.values[filterName];
  }, [filtering]);

  const getRangePickerFilterValues = useCallback(([filterName1, filterName2]) => {
    return [
      filtering.values[filterName1] ? dayjs(filtering.values[filterName1]) : null,
      filtering.values[filterName2] ? dayjs(filtering.values[filterName2]) : null
    ];
  }, [filtering]);

  const handleTextFilterChange = useCallback((filterName, value) => {
    setFiltering(oldFiltering => createFiltering(filteringConfiguration, { ...oldFiltering.values, [filterName]: value }));
  }, [filteringConfiguration]);

  const handleDateRangeFilterChange = useCallback(([filterName1, filterName2], value) => {
    setFiltering(oldFiltering => createFiltering(filteringConfiguration, {
      ...oldFiltering.values,
      [filterName1]: value?.[0]?.startOf('date').toDate() ?? null,
      [filterName2]: value?.[1]?.endOf('date').toDate() ?? null
    }));
  }, [filteringConfiguration]);

  const filterItems = useCallback(items => {
    return processAsIteratorIfAvailable(
      items,
      itemsIterator => filteringConfiguration.filters.reduce((accu, filter) => filter.filterItems(accu, filtering.values), itemsIterator)
    );
  }, [filtering, filteringConfiguration]);

  return { filtering, getTextFilterValue, getRangePickerFilterValues, handleTextFilterChange, handleDateRangeFilterChange, filterItems };
}
