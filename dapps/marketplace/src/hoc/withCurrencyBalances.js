import React from 'react'
import { useQuery } from '@apollo/react-hooks'
import gql from 'graphql-tag'
import get from 'lodash/get'

import withWallet from './withWallet'

const query = gql`
  query GetCurrencyBalances(
    $tokens: [String]
    $account: String!
    $proxy: String!
    $useProxy: Boolean!
  ) {
    currencies(tokens: $tokens) {
      __typename
      ... on Currency {
        id
        name
        code
        priceInUSD
      }
      ... on Token {
        id
        decimals
        balance(address: $account)
        allowance(address: $account, target: "marketplace")
      }
    }
    proxyCurrencies: currencies(tokens: $tokens) @include(if: $useProxy) {
      __typename
      ... on Currency {
        id
        name
        code
        priceInUSD
      }
      ... on Token {
        id
        decimals
        balance(address: $proxy)
        allowance(address: $account, target: $proxy)
      }
    }
  }
`

function withCurrencyBalances(WrappedComponent) {
  const WithCurrencyBalances = props => {
    const { data } = useQuery(query, {
      skip: !props.wallet,
      variables: {
        account: props.wallet,
        proxy: props.walletPredictedProxy,
        tokens: props.targets,
        useProxy: props.walletPredictedProxy !== props.wallet
      },
      fetchPolicy: 'network-only'
    })
    return (
      <WrappedComponent
        {...props}
        currencies={get(data, 'currencies') || []}
        proxyCurrencies={get(data, 'proxyCurrencies') || []}
      />
    )
  }
  return withWallet(WithCurrencyBalances)
}

export default withCurrencyBalances
