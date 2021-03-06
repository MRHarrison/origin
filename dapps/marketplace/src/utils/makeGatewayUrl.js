/**
 * Takes an IPFS hash url (for example: ipfs://QmUwefhweuf...12322a) and
 * returns a url to that resource on the gateway.
 * Ensures that the IPFS hash does not contain anything evil and is the correct length.
 *
 * Also supports pure IPFS hash urls with no protocol, such as QmUwefh...
 *
 * @param {string} gateway
 * @param {string} ipfsUrl
 * @returns {string}
 */
export default function makeGatewayUrl(gateway, ipfsUrl) {
  if (!gateway) {
    return
  }
  if (!ipfsUrl) {
    return
  }
  const match = ipfsUrl.match(/^(ipfs:\/\/)?([A-Za-z0-9]{46})$/)
  if (match) {
    return `${gateway}/ipfs/${match[2]}`
  }
}
