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

const splitBlockcypherTransactions = (transactions, txid) => {
  // separate transactions that made after the specific txid starting from the most recent
  // the first transaction with equal txid to our issuance is before[0]
  let before = []
  let after = []
  let foundIssuance = false

  for (let tx of transactions) {
    if (tx.confirmations <= 0) continue

    if (tx.hash === txid) {
      foundIssuance = true
    }

    for (let o of tx.outputs) {
      if (o.script.startsWith('6a')) {
        let data = getOpReturnDataFromScript(o.script)
        if (!foundIssuance) {
          after.push(data)
        } else {
          before.push(data)
        }
      }
    }
  }

  return { before, after }
}

const splitBTCDTransactions = (transactions, txid) => {
  // separate ransactions that made after the specific txid starting from the most recent
  // the first transaction with equal txid to our issuance is before[0]
  let before = []
  let after = []
  let foundIssuance = false

  for (let tx of transactions) {
    if (tx.confirmations <= 0) continue

    if (tx.txid === txid) {
      foundIssuance = true
    }

    for (let o of tx.vout) {
      if (o.scriptPubKey.hex.startsWith('6a')) {
        let data = getOpReturnDataFromScript(o.scriptPubKey.hex)
        if (!foundIssuance) {
          after.push(data)
        } else {
          before.push(data)
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

  return splitBlockcypherTransactions(transactions, txid)
}

const queryBTCDApi = async (BTCDUrl, address, txid, testnet) => {
  if ((address.startsWith('m') || address.startsWith('n') || address.startsWith('2') || address.startsWith('tb')) && !testnet) {
    throw new Error('The address of the issuer of this certificate is incompatible with BTC Mainnet. Maybe it was issued on a different network?')
  }
  const url = `${BTCDUrl}/address/${address}`
  const res = await request.get(url).catch(error => {
    let err =
      error.response && error.response.data ? error.response.data.error : ''
    err =
      err ||
      'Something happened when trying to contact BTCD API. Please try again later.'

    if (err.includes('Invalid address or key')) {
      err = testnet
        ? 'The address of the issuer of this certificate is incompatible with BTC Testnet. Maybe it was issued on a different network?'
        : 'The address of the issuer of this certificate is incompatible with BTC Mainnet. Maybe it was issued on a different network?'
    }

    throw new Error(err)
  })

  return splitBTCDTransactions(res.data, txid)
}

const queryBlockchainServices = async (blockchainServices, address, txid, testnet) => {
  const blockchainServicesQueries = [];

  blockchainServices.services.forEach(service => {
    if (service.name === 'BlockCypher') {
      blockchainServicesQueries.push(queryBlockcypher(address, txid, testnet))
    } else if (service.name === 'BTCD API') {
      blockchainServicesQueries.push(queryBTCDApi(service.url, address, txid, testnet))
    }
  })

  const results = await allSettled(blockchainServicesQueries)
  const actualSuccesses = results.filter(r => r.status === 'fulfilled').length
  if (actualSuccesses < blockchainServices.requiredSuccesses) {
    const reasons = results.map(r => r.reason).filter(r => r)
    throw new Error(reasons[0])
  }

  const succesfulResults = results.map(r => r.value).filter(r => r)

  if (succesfulResults.length > 1) {
    const orig = JSON.stringify(succesfulResults[0]);
    for (let i = 1; i < succesfulResults.length; i++) {
      const targ = JSON.stringify(succesfulResults[i]);
      if (orig !== targ) {
        throw new Error('Different results from the services')
      }
    }
  }

  return succesfulResults[0]
}

export default queryBlockchainServices
