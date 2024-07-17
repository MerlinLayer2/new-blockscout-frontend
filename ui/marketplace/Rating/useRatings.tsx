import Airtable from 'airtable';
import { useEffect, useState, useCallback } from 'react';
import { useAccount } from 'wagmi';

import type { AppRating } from 'types/client/marketplace';

import config from 'configs/app';
import useApiQuery from 'lib/api/useApiQuery';
import useToast from 'lib/hooks/useToast';
import type { EventTypes, EventPayload } from 'lib/mixpanel/index';
import * as mixpanel from 'lib/mixpanel/index';
import { ADDRESS_COUNTERS } from 'stubs/address';

const feature = config.features.marketplace;
const base = (feature.isEnabled && feature.rating) ?
  new Airtable({ apiKey: feature.rating.airtableApiKey }).base(feature.rating.airtableBaseId) :
  undefined;

export type RateFunction = (
  appId: string,
  appRecordId: string | undefined,
  userRecordId: string | undefined,
  rating: number,
  source: EventPayload<EventTypes.APP_FEEDBACK>['Source'],
) => void;

function formatRatings(data: Airtable.Records<Airtable.FieldSet>) {
  return data.reduce((acc: Record<string, AppRating>, record) => {
    const fields = record.fields as { appId: string | Array<string>; rating: number | undefined };
    const appId = Array.isArray(fields.appId) ? fields.appId[0] : fields.appId;
    acc[appId] = {
      recordId: record.id,
      value: fields.rating,
    };
    return acc;
  }, {});
}

export default function useRatings() {
  const { address } = useAccount();
  const toast = useToast();

  const addressCountersQuery = useApiQuery<'address_counters', { status: number }>('address_counters', {
    pathParams: { hash: address },
    queryOptions: {
      enabled: Boolean(address),
      placeholderData: ADDRESS_COUNTERS,
      refetchOnMount: false,
    },
  });

  const [ ratings, setRatings ] = useState<Record<string, AppRating>>({});
  const [ userRatings, setUserRatings ] = useState<Record<string, AppRating>>({});
  const [ isRatingLoading, setIsRatingLoading ] = useState<boolean>(false);
  const [ isUserRatingLoading, setIsUserRatingLoading ] = useState<boolean>(false);
  const [ isSending, setIsSending ] = useState<boolean>(false);
  const [ canRate, setCanRate ] = useState<boolean | undefined>(undefined);

  const fetchRatings = useCallback(async() => {
    if (!base) {
      return;
    }
    const data = await base('apps_ratings').select({ fields: [ 'appId', 'rating' ] }).all();
    const ratings = formatRatings(data);
    setRatings(ratings);
  }, []);

  useEffect(() => {
    async function fetch() {
      setIsRatingLoading(true);
      await fetchRatings();
      setIsRatingLoading(false);
    }
    fetch();
  }, [ fetchRatings ]);

  useEffect(() => {
    async function fetchUserRatings() {
      setIsUserRatingLoading(true);
      let userRatings = {} as Record<string, AppRating>;
      if (address && base) {
        const data = await base('users_ratings').select({
          filterByFormula: `address = "${ address }"`,
          fields: [ 'appId', 'rating' ],
        }).all();
        userRatings = formatRatings(data);
      }
      setUserRatings(userRatings);
      setIsUserRatingLoading(false);
    }
    fetchUserRatings();
  }, [ address ]);

  useEffect(() => {
    // TODO: uncomment validation after testing
    const { isPlaceholderData/*, data*/ } = addressCountersQuery;
    const canRate = address && !isPlaceholderData/* && Number(data?.transactions_count) >= 10*/;
    setCanRate(canRate);
  }, [ address, addressCountersQuery ]);

  const rateApp = useCallback(async(
    appId: string,
    appRecordId: string | undefined,
    userRecordId: string | undefined,
    rating: number,
    source: EventPayload<EventTypes.APP_FEEDBACK>['Source'],
  ) => {
    setIsSending(true);

    try {
      if (!address || !base) {
        throw new Error('Address is missing');
      }

      if (!appRecordId) {
        const records = await base('apps_ratings').create([ { fields: { appId } } ]);
        appRecordId = records[0].id;
        if (!appRecordId) {
          throw new Error('Record ID is missing');
        }
      }

      if (!userRecordId) {
        const userRecords = await base('users_ratings').create([
          {
            fields: {
              address,
              appRecordId: [ appRecordId ],
              rating,
            },
          },
        ]);
        userRecordId = userRecords[0].id;
      } else {
        await base('users_ratings').update(userRecordId, { rating });
      }

      setUserRatings({
        ...userRatings,
        [appId]: {
          recordId: userRecordId,
          value: rating,
        },
      });
      fetchRatings();

      toast({
        status: 'success',
        title: 'Awesome! Thank you 💜',
        description: 'Your rating improves the service',
      });
      mixpanel.logEvent(
        mixpanel.EventTypes.APP_FEEDBACK,
        { Action: 'Rating', Source: source, AppId: appId, Score: rating },
      );
    } catch (error) {
      toast({
        status: 'error',
        title: 'Ooops! Something went wrong',
        description: 'Please try again later',
      });
    }

    setIsSending(false);
  }, [ address, userRatings, fetchRatings, toast ]);

  return {
    ratings,
    userRatings,
    rateApp,
    isRatingSending: isSending,
    isRatingLoading,
    isUserRatingLoading,
    canRate,
  };
}
