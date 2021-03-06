const { PROVIDER } = require('./const')
const Web3 = require('web3')
const web3 = new Web3(PROVIDER)

const { getIpfsHashFromBytes32 } = require('./_ipfs')

const { Event } = require('../models')

const abi = require('./_abi')
const Marketplace = new web3.eth.Contract(abi)

function getEventObj(event) {
  let decodedLog = {},
    eventAbi = {}
  eventAbi = Marketplace._jsonInterface.find(
    i => i.signature === event.topics[0]
  )
  if (eventAbi) {
    decodedLog = web3.eth.abi.decodeLog(
      eventAbi.inputs,
      event.data,
      event.topics.slice(1)
    )
  }
  return {
    ...event,
    blockNumber: web3.utils.toDecimal(event.blockNumber),
    topic1: event.topics[0],
    topic2: event.topics[1],
    topic3: event.topics[2],
    topic4: event.topics[3],
    eventName: eventAbi.name,
    party: decodedLog.party,
    listingId: decodedLog.listingID,
    offerId: decodedLog.offerID,
    ipfsHash: getIpfsHashFromBytes32(decodedLog.ipfsHash)
  }
}

async function upsertEvent({ event, shopId, networkId }) {
  const eventObj = { ...getEventObj(event), shopId, networkId }
  const block = await web3.eth.getBlock(eventObj.blockNumber)
  eventObj.timestamp = block.timestamp
  const { transactionHash } = event

  const exists = await Event.findOne({ where: { transactionHash } })
  if (exists) {
    return exists
  }

  const record = await Event.create(eventObj)
  if (!record.id) {
    throw new Error('Could not save event')
  }
  return record
}

async function storeEvents({ events, shopId, networkId }) {
  for (const event of events) {
    await upsertEvent({ event, shopId, networkId })
    // await handleLog(event)
  }
}

module.exports = {
  getEventObj,
  upsertEvent,
  storeEvents
}
