import request from 'axios'
import allSettled from 'promise.allsettled' // Promise.allSettled polyfill for IEs

allSettled.shim(); // will be a no-op if not needed

const requestBlockcypher = async (address, before, testnet) => {
  // request blockcypher for transactions from specific address
  let address_txs_url = testnet
    ? `https://api.blockcypher.com/v1/btc/test3/addrs/${address}/full`
    : `https://api.blockcypher.com/v1/btc/main/addrs/${address}/full`
  const params = { limit: 50 }
  if (before) {
    params.before = before
  }
  return await request.get(address_txs_url, { params })
}

const splitTransactions = (transactions, txid, isBlockcypher=false) => {
  // separate transactions that made after the specific txid starting from the most recent
  // the first transaction with equal txid to our issuance is before[0]
  let before = []
  let after = []
  let foundIssuance = false

  for (let tx of transactions) {
    if (!tx.confirmations || tx.confirmations <= 0) continue

    // BTCDApi just returns a timestamp, we format it like blockcypher's response for comparing purposes
    let timestamp = isBlockcypher ? tx.confirmed : new Date(tx.blocktime * 1000).toISOString().replace('.000', '')
    let txhash = isBlockcypher ? tx.hash : tx.txid
    if (txhash === txid) {
      foundIssuance = true
    }

    let outputs = isBlockcypher ? tx.outputs : tx.vout
    for (let o of outputs) {
      let script = isBlockcypher ? o.script : o.scriptPubKey.hex
      if (script.startsWith('6a')) {
        let data = isBlockcypher ? getOpReturnDataFromScript(o.script) : getOpReturnDataFromScript(o.scriptPubKey.hex)
        let t = { data, timestamp }
        if (!foundIssuance) {
          after.push(t)
        } else {
          before.push(t)
        }
      }
    }
  }

  return { before, after }
}

const getOpReturnDataFromScript = script => {
  // from each opreturn ignore the 4-6 first chars that we dont need them
  let ignoreHexChars
  if (script.startsWith('6a4c')) {
    ignoreHexChars = 6
  } else {
    ignoreHexChars = 4
  }
  return script.slice(ignoreHexChars)
}

const queryBlockcypher = async (address, txid, testnet) => {
  let res = await requestBlockcypher(address, null, testnet).catch(error => {
    let err =
      error.response && error.response.data ? error.response.data.error : ''
    err =
      err ||
      'Something happened when trying to contact Blockcypher API. Please try again later.'

    if (err.includes('incompatible with current block chain')) {
      err = testnet
        ? 'The address of the issuer of this certificate is incompatible with BTC Testnet. Maybe it was issued on a different network?'
        : 'The address of the issuer of this certificate is incompatible with BTC Mainnet. Maybe it was issued on a different network?'
    }
    throw new Error(err)
  })
  let transactions = res.data.txs

  let hasMore = res.data.hasMore
  // Each request returns mostly 50 transactions
  // so if an address has more we need to query blockcypher again for the rest
  while (hasMore) {
    let before = transactions[transactions.length - 1].block_height
    res = await requestBlockcypher(address, before, testnet).catch(error => {
      console.error(error)
      throw new Error(
        'Something happened when trying to contact Blockcypher API. Please try again later.'
      )
    })
    // Due to a bug with empty txs when an address has done exactly 50 transactions
    // we need to check below:
    if (res.data.txs.length) {
      transactions = transactions.concat(res.data.txs)
    }

    hasMore = res.data.hasMore
  }

  return splitTransactions(transactions, txid, true)
}

const queryBLTCDApi = async (BLTCDUrl, address, txid, chain) => {
  // This works for both our btcd and ltcd APIs
  const url = `${BLTCDUrl}/${chain}/address/${address}`
  const res = await request.get(url).catch(error => {
    let err =
      error.response && error.response.data ? error.response.data.error : ''
    err =
      err ||
      'Something happened when trying to contact blockchain API. Please try again later.'

    throw new Error(err)
  })

  return splitTransactions(res.data, txid)
}

const queryBlockchainServices = async (blockchainServices, address, txid, chain, testnet) => {
  const blockchainServicesQueries = [];
  let servicesName = chain + (testnet ? '-testnet' : '');
  const chainBlockchainServices = blockchainServices[servicesName]

  chainBlockchainServices.services.forEach(service => {
    if (service.name === 'blockcypher') {
      blockchainServicesQueries.push(queryBlockcypher(address, txid, testnet))
    } else if (service.name === 'btcd' || service.name === 'ltcd') {
      blockchainServicesQueries.push(queryBLTCDApi(service.url, address, txid, chain))
    }
  })

  const results = await allSettled(blockchainServicesQueries)
  const actualSuccesses = results.filter(r => r.status === 'fulfilled').length
  if (actualSuccesses < chainBlockchainServices.requiredSuccesses) {
    const reasons = results.map(r => r.reason).filter(r => r)
    throw new Error(reasons[0])
  }

  const succesfulResults = results.map(r => r.value).filter(r => r)

  if (succesfulResults.length > 1 && chainBlockchainServices.requiredSuccesses > 1) {
    const orig = JSON.stringify(succesfulResults[0]);
    for (let i = 1; i < blockchainServices.requiredSuccesses; i++) {
      const targ = JSON.stringify(succesfulResults[i]);
      if (orig !== targ) {
        throw new Error('Different results from the blockchain services')
      }
    }
  }

  return succesfulResults[0]
}

export default queryBlockchainServices
