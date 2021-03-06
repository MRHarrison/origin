import React, { useState } from 'react'
import { Switch, Route } from 'react-router-dom'
import { fbt } from 'fbt-runtime'
import get from 'lodash/get'

import withWallet from 'hoc/withWallet'
import withCreatorConfig from 'hoc/withCreatorConfig'
import withIdentity from 'hoc/withIdentity'
import withMessagingStatus from 'hoc/withMessagingStatus'
import withAuthStatus from 'hoc/withAuthStatus'

import DocumentTitle from 'components/DocumentTitle'
import UserActivationLink from 'components/UserActivationLink'
import LoadingSpinner from 'components/LoadingSpinner'

import listingTypes from './listing-types'
import ChooseListingType from './ChooseListingType'
import ChooseCategory from './ChooseCategory'

import ListingCreated from './ListingCreated'

import supportedTokens from '@origin/graphql/src/utils/supportedTokens'

import Store from 'utils/store'
const store = Store('sessionStorage')

function initialState(props) {
  const isOldListing = props.listing && props.listing.id
  // If a listing is passed in (as when editing) use that, otherwise
  // fall back to anything in `store` (an unfinished listing creation)
  const existingListing =
    (isOldListing
      ? store.get(`edit-listing-${props.listing.id}`, props.listing)
      : store.get('create-listing')) || {}

  return {
    __typename: 'UnitListing', // Default
    title: '',
    description: '',
    category: '',
    subCategory: '',
    location: '',
    boost: '0',
    boostLimit: '0',
    media: [],
    requiresShipping: false,

    // Unit fields:
    quantity: '1',
    price: '',
    currency: 'fiat-USD',
    acceptedTokens: isOldListing ? supportedTokens : [],

    // Fractional fields:
    timeZone: '',
    workingHours: [],
    weekendPrice: '',
    booked: [],
    customPricing: [],
    unavailable: [],

    // Gift Card fields:
    retailer: '',
    cardAmount: '',
    issuingCountry: 'US',
    isDigital: false,
    isCashPurchase: false,
    receiptAvailable: false,

    // Marketplace creator fields:
    marketplacePublisher: get(props, 'creatorConfig.marketplacePublisher'),

    ...existingListing
  }
}

const CreateListing = props => {
  const [listing, setListing] = useState(initialState(props))

  if (
    props.creatorConfigLoading ||
    props.walletLoading ||
    props.identityLoading ||
    props.messagingStatusLoading ||
    props.authStatusLoading
  ) {
    return <LoadingSpinner />
  }

  if (
    !props.isLoggedIn ||
    (!props.identity &&
      !(localStorage.bypassOnboarding || localStorage.useWeb3Identity))
  ) {
    return (
      <UserActivationLink
        location={{ pathname: '/create' }}
        forceRedirect={true}
      />
    )
  }

  // Force a given listing type/category
  // Hack: '__' is not allowed in GraphQL where we get our config from, so we change
  // `typename` into `__typename` here.
  const shouldForceType = props.creatorConfig && props.creatorConfig.forceType
  const forceType = shouldForceType
    ? {
        ...props.creatorConfig.forceType,
        __typename: props.creatorConfig.forceType.typename
      }
    : {}

  const cmpProps = {
    // Directly having `listing: { ...listing, ...forceType }` works
    // but forces all the components to render every second (since wallet change is polled
    // and listing !== { ...listing, ...forceType } because of different object reference )
    listing: !shouldForceType ? listing : { ...listing, ...forceType },
    onChange: listing => {
      setListing(listing)
      if (listing.id) {
        store.set(`edit-listing-${listing.id}`, listing)
      } else {
        store.set('create-listing', listing)
      }
    }
  }

  // Get creation component for listing type (__typename),
  // defaulting to UnitListing
  const listingType = listing.__typename || 'UnitListing'
  const ListingTypeComponent = listingTypes[listingType]

  return (
    <div className="container create-listing">
      <DocumentTitle
        pageTitle={<fbt desc="createListing.title">Add A Listing</fbt>}
      />
      <Switch>
        <Route
          path="/create/details"
          render={() => (
            <ListingTypeComponent linkPrefix="/create/details" {...cmpProps} />
          )}
        />
        <Route
          path="/create/:listingId/success"
          render={() => <ListingCreated {...cmpProps} />}
        />
        <Route
          path="/listing/:listingId/edit/:step?"
          render={({ match }) => (
            <ListingTypeComponent
              linkPrefix={`/listing/${match.params.listingId}/edit/details`}
              refetch={props.refetch}
              {...cmpProps}
            />
          )}
        />
        <Route
          path="/create/listing-type"
          render={() => (
            <ChooseCategory
              prev="/create"
              next="/create/details"
              {...cmpProps}
            />
          )}
        />
        <Route
          path="/create"
          render={() => (
            <ChooseListingType next="/create/listing-type" {...cmpProps} />
          )}
        />
      </Switch>
    </div>
  )
}

export default withMessagingStatus(
  withCreatorConfig(withWallet(withAuthStatus(withIdentity(CreateListing)))),
  { excludeData: true }
)

require('react-styl')(`
  .create-listing
    padding-top: 3rem
    .gray-box
      border-radius: var(--default-radius)
      padding: 2rem
      background-color: var(--pale-grey-eight)

    .step-description
      font-size: 18px
      font-weight: 300
      line-height: normal
      margin-bottom: 2.5rem

    .with-symbol
      position: relative

  @media (max-width: 767.98px)
    .create-listing
      display: flex
      flex-direction: column
      flex: 1
      padding: 1rem
      .step-description
        font-size: 16px
        margin-top: 2rem
        margin-bottom: 2rem
        text-align: center

`)
