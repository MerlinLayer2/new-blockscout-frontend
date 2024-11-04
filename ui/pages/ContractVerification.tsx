import React from 'react';

import ContractVerificationForm from 'ui/contractVerification/ContractVerificationForm';
import useFormConfigQuery from 'ui/contractVerification/useFormConfigQuery';
import ContentLoader from 'ui/shared/ContentLoader';
import DataFetchAlert from 'ui/shared/DataFetchAlert';
import PageTitle from 'ui/shared/Page/PageTitle';

const ContractVerification = () => {
  const configQuery = useFormConfigQuery(true);

  const content = (() => {
    if (configQuery.isError) {
      return <DataFetchAlert/>;
    }

    if (configQuery.isPending) {
      return <ContentLoader/>;
    }

    return <ContractVerificationForm config={ configQuery.data }/>;
  })();

  return (
    <>
      <PageTitle title="Verify & publish contract"/>
      <div
        style={{
          border: '1px solid #2D3748',
          borderRadius: '10px',
          padding: '14px',
          boxShadow: '0 0.5rem 1.2rem rgb(189 197 209 / 20%)',
        }}
      >
        { ' ' }
        { content }
      </div>
    </>
  );
};

export default ContractVerification;
