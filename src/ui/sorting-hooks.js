import { useCallback, useMemo, useState } from 'react';
import { SORTING_DIRECTION } from '../domain/constants.js';

export const createSorter = (name, labelResourceKey, appliedLabelResourceKey, sortItems) => ({
  name,
  labelResourceKey,
  appliedLabelResourceKey,
  sortItems
});

const createSortingConfiguration = (sorters, defaultSorter, defaultDirection) => {
  const sortersByName = Object.fromEntries(sorters.map(sorter => [sorter.name, sorter]));
  return {
    sorters,
    sortersByName,
    queryToValues: query => ({
      sorting: sortersByName[query.sorting] ? query.sorting : defaultSorter.name,
      direction: Object.values(SORTING_DIRECTION).includes(query.direction) ? query.direction : defaultDirection
    }),
    valuesToQuery: sortingValues => ({
      sorting: sortingValues.sorting,
      direction: sortingValues.direction
    })
  };
};

export function useSortingConfiguration(sorters, defaultSorter, defaultDirection, t) {
  const [sortingConfiguration] = useState(() => createSortingConfiguration(sorters, defaultSorter, defaultDirection));

  const sortingSelectorOptions = useMemo(() => {
    return sortingConfiguration.sorters.map(sorter => ({
      label: t(sorter.labelResourceKey),
      appliedLabel: t(sorter.appliedLabelResourceKey),
      value: sorter.name
    }));
  }, [sortingConfiguration, t]);

  return { sortingConfiguration, sortingSelectorOptions };
}

const createSorting = (sortingConfiguration, values) => ({
  values,
  query: sortingConfiguration.valuesToQuery(values),
  sortingSelectorSorting: {
    value: values.sorting,
    direction: values.direction
  }
});

export function useSorting(initialQuery, sortingConfiguration) {
  const [sorting, setSorting] = useState(() => createSorting(sortingConfiguration, sortingConfiguration.queryToValues(initialQuery)));

  const handleSortingSelectorChange = useCallback(({ value, direction }) => {
    setSorting(createSorting(sortingConfiguration, { sorting: value, direction }));
  }, [sortingConfiguration]);

  const sortItems = useCallback(items => {
    return sortingConfiguration.sortersByName[sorting.values.sorting].sortItems(items, sorting.values.direction);
  }, [sorting, sortingConfiguration]);

  return { sorting, handleSortingSelectorChange, sortItems };
}
