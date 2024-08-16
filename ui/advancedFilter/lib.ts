import type { AdvancedFilterAge, AdvancedFilterParams } from 'types/api/advancedFilter';

import { HOUR, DAY, MONTH } from 'lib/consts';

export function getDurationFromAge(age: AdvancedFilterAge) {
  switch (age) {
    case '1h':
      return HOUR;
    case '24h':
      return DAY;
    case '7d':
      return DAY * 7;
    case '1m':
      return MONTH;
    case '3m':
      return MONTH * 3;
    case '6m':
      return MONTH * 6;
  }
}

const filterParamNames: Record<keyof AdvancedFilterParams, string> = {
  // we don't show address_relation as filter tag
  address_relation: '',
  age: 'Age',
  age_from: 'Date from',
  age_to: 'Date to',
  amount_from: 'Amount from',
  amount_to: 'Amount to',
  from_address_hashes_to_exclude: 'From Exc',
  from_address_hashes_to_include: 'From',
  methods: 'Methods',
  to_address_hashes_to_exclude: 'To Exc',
  to_address_hashes_to_include: 'To',
  token_contract_address_hashes_to_exclude: 'Asset Exc',
  token_contract_address_hashes_to_include: 'Asset',
  tx_types: 'Type',
};

export function getFilterTags(filters: AdvancedFilterParams) {
  return Object.entries(filters).map(([ key, value ]) => {
    if (!value) {
      return;
    }
    const name = filterParamNames[key as keyof AdvancedFilterParams];
    if (!name) {
      return;
    }
    const valueStr = Array.isArray(value) ? value.join(', ') : value;
    return {
      key: key as keyof AdvancedFilterParams,
      name,
      value: valueStr,
    };
  }).filter(Boolean);
}
