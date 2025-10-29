import by from 'thenby';
import escapeStringRegexp from 'escape-string-regexp';
import { useCallback, useMemo, useState } from 'react';
import { SORTING_DIRECTION } from '../domain/constants.js';

const SEPARATOR = '~';

export const createSorter = (name, labelResourceKey, appliedLabelResourceKey, comparer) => ({
  name,
  labelResourceKey,
  appliedLabelResourceKey,
  comparer
});

export const createQueryParser = sorters => {
  if (!sorters.length) {
    return () => null;
  }

  const separator = escapeStringRegexp(SEPARATOR);
  const name = sorters.map(sorter => escapeStringRegexp(sorter.name)).join('|');
  const direction = Object.values(SORTING_DIRECTION).map(value => escapeStringRegexp(value)).join('|');
  const regExp = new RegExp(`(?<name>${name})${separator}(?<direction>${direction})`, 'g');
  return queryValue => {
    if (!queryValue) {
      return null;
    }

    const pairs = [];
    for (const match of queryValue.matchAll(regExp)) {
      pairs.push([match.groups.name, match.groups.direction]);
    }

    return pairs.length ? pairs : null;
  };
};

const createSortingConfiguration = (sorters, defaultSorting, allowMultiple) => {
  const tryParseQuery = createQueryParser(sorters);
  const sortersByName = Object.fromEntries(sorters.map(sorter => [sorter.name, sorter]));
  return {
    sorters,
    sortersByName,
    allowMultiple,
    defaultSorting,
    queryToValues: query => tryParseQuery(query.sorting) ?? defaultSorting,
    valuesToQuery: sortingValues => ({
      sorting: sortingValues.flatMap(values => values).join(SEPARATOR)
    })
  };
};

export function useSortingConfiguration(sorters, defaultSorting, t, allowMultiple = false) {
  const [sortingConfiguration] = useState(() => createSortingConfiguration(sorters, defaultSorting, allowMultiple));

  const sortingSelectorOptions = useMemo(() => {
    return sortingConfiguration.sorters.map(sorter => ({
      label: t(sorter.labelResourceKey),
      appliedLabel: t(sorter.appliedLabelResourceKey),
      value: sorter.name
    }));
  }, [sortingConfiguration, t]);

  return { sortingConfiguration, sortingSelectorOptions };
}

const createSorting = (sortingConfiguration, values) => {
  if (!values.length) {
    throw new Error('Sorting values is empty');
  }

  if (values.length > 1 && !sortingConfiguration.allowMultiple) {
    throw new Error('Multiple sorting values are not allowed');
  }

  return {
    values,
    query: sortingConfiguration.valuesToQuery(values),
    sortingSelectorSorting: {
      value: values[0][0],
      direction: values[0][1]
    },
    sortingConfiguration
  };
};

export function useSorting(initialQuery, sortingConfiguration) {
  const [sorting, setSorting] = useState(() => {
    const initialValues = sortingConfiguration.queryToValues(initialQuery);
    return createSorting(sortingConfiguration, initialValues);
  });

  const setSortingValues = useCallback(newValuesOrFunc => {
    setSorting(oldSorting => {
      const newValues = typeof newValuesOrFunc === 'function' ? newValuesOrFunc(oldSorting.values) : newValuesOrFunc;
      return createSorting(sortingConfiguration, newValues);
    });
  }, [sortingConfiguration]);

  const handleSortingSelectorChange = useCallback(({ value, direction }) => {
    setSorting(createSorting(sortingConfiguration, [[value, direction]]));
  }, [sortingConfiguration]);

  const sortItems = useCallback(items => {
    const aggregatedComparer = sorting.values.reduce((accu, [name, direction]) => {
      const comparer = sortingConfiguration.sortersByName[name].comparer;
      return accu ? accu.thenBy(comparer(direction)) : by(comparer(direction));
    }, null);
    return [...items].sort(aggregatedComparer);
  }, [sorting, sortingConfiguration]);

  return { sorting, setSortingValues, handleSortingSelectorChange, sortItems };
}
