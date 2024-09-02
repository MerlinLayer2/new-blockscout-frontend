import { Box } from '@chakra-ui/react';
import BigNumber from 'bignumber.js';
import React from 'react';

import config from 'configs/app';
import useApiQuery from 'lib/api/useApiQuery';
import { WEI_IN_GWEI } from 'lib/consts';
import getCurrencyValue from 'lib/getCurrencyValue';
import { thinsp } from 'lib/html-entities';
import { currencyUnits } from 'lib/units';
import { HOMEPAGE_STATS } from 'stubs/stats';
import { TXS_STATS } from 'stubs/tx';
import StatsWidget from 'ui/shared/stats/StatsWidget';

const TxsStats = () => {
  const txsStatsQuery = useApiQuery('txs_stats', {
    queryOptions: {
      placeholderData: TXS_STATS,
    },
  });

  const statsQuery = useApiQuery('stats', {
    queryOptions: {
      placeholderData: HOMEPAGE_STATS,
    },
  });

  if (!txsStatsQuery.data) {
    return null;
  }

  const txFeeAvg = getCurrencyValue({
    value: txsStatsQuery.data.transaction_fees_avg_24h,
    exchangeRate: statsQuery.data?.coin_price,
    decimals: String(config.chain.currency.decimals),
    accuracyUsd: 2,
  });

  const _weiFee = BigNumber(txsStatsQuery.data.transaction_fees_avg_24h)
    .dividedBy(WEI_IN_GWEI)
    .toFixed();

  return (
    <Box
      display="grid"
      gridTemplateColumns={{ base: '1fr', lg: 'repeat(4, calc(25% - 9px))' }}
      rowGap={ 3 }
      columnGap={ 3 }
      mb={ 6 }
    >
      <StatsWidget
        label="Transactions"
        value={ Number(
          txsStatsQuery.data?.transactions_count_24h,
        ).toLocaleString() }
        period="24h"
        isLoading={ txsStatsQuery.isPlaceholderData }
        href={
          config.features.stats.isEnabled ?
            { pathname: '/stats', query: { chartId: 'newTxns' } } :
            undefined
        }
      />
      <StatsWidget
        label="Pending transactions"
        value={ Number(
          txsStatsQuery.data?.pending_transactions_count,
        ).toLocaleString() }
        period="1h"
        isLoading={ txsStatsQuery.isPlaceholderData }
      />
      <StatsWidget
        label="Transactions fees"
        value={ (
          Number(txsStatsQuery.data?.transaction_fees_sum_24h) /
          10 ** config.chain.currency.decimals
        ).toLocaleString(undefined, { maximumFractionDigits: 18 }) }
        valuePostfix={ thinsp + config.chain.currency.symbol }
        period="24h"
        isLoading={ txsStatsQuery.isPlaceholderData }
        href={
          config.features.stats.isEnabled ?
            { pathname: '/stats', query: { chartId: 'txnsFee' } } :
            undefined
        }
      />
      <StatsWidget
        label="Avg. transaction fee"
        value={
          txFeeAvg.usd ?
            `${ txFeeAvg.usd } (${ _weiFee } ${ currencyUnits.gwei })` :
            txFeeAvg.valueStr
        }
        valuePrefix={ txFeeAvg.usd ? '$' : undefined }
        valuePostfix={
          txFeeAvg.usd ? undefined : thinsp + config.chain.currency.symbol
        }
        period="24h"
        isLoading={ txsStatsQuery.isPlaceholderData }
        href={
          config.features.stats.isEnabled ?
            { pathname: '/stats', query: { chartId: 'averageTxnFee' } } :
            undefined
        }
      />
    </Box>
  );
};

export default React.memo(TxsStats);
