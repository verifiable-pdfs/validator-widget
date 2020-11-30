import { parseOpReturnHex, operators } from './credProtocol'
import { address } from 'bitcoinjs-lib'
import createHash from 'create-hash/browser'
import { bytesToHex, hexToBytes } from './hexUtils'
import { Buffer } from 'buffer'


const CHAINTYPE_ANCHORS = {
  'bitcoin': ['BTCOpReturn'],
  // BTC testnet issuances before core-lib v2.1 used BTCOpReturn,
  // so for testnet we check both values
  'bitcoin-testnet': ['BTCOpReturn', 'BTCTestnetOpReturn'],
  'litecoin': ['LTCOpReturn'],
  'litecoin-testnet': ['LTCTestnetOpReturn'],
}

const getCpTxid = (cpProof, chain, testnet) => {
  let chainType = chain + (testnet ? '-testnet' : '')
  let anchors = cpProof['anchors']
  let cpTxid = ''
  for (let a of anchors) {
    if (CHAINTYPE_ANCHORS[chainType].includes(a['type'])) {
      cpTxid = a['sourceId']
      break
    }
  }

  return cpTxid
}

const revocationCheck = (valid, reason, transactions, metadata, PDFHash) => {
  let issuerAddress = metadata.address
  let cpProof = metadata.chainpoint_proof_object
  let cpTxid = getCpTxid(cpProof, metadata.chain, metadata.testnet)

  if (!valid && !reason.startsWith('certificate expired')) {
    return { valid, reason }
  }

  for (let i = 1; i < transactions.before.length; i++) {
    let opData = parseOpReturnHex(transactions.before[i].data)
    if (opData) {
      if (opData['cmd'] === operators['op_revoke_address']) {
        let p2pkh = address.fromBase58Check(issuerAddress)
        let pkh = bytesToHex(p2pkh.hash)
        if (pkh === opData['data']['pkh']) {
          valid = false
          reason = 'address was revoked'
          return { valid, reason }
        }
      }
    }
  }

  let reversedAfter = transactions.after.reverse()
  for (let opReturn of reversedAfter) {
    let opData = parseOpReturnHex(opReturn.data)
    if (opData) {
      if (opData['cmd'] === operators['op_revoke_batch']) {
        if (cpTxid === opData['data']['txid']) {
          valid = false
          reason = 'batch was revoked'
          return { valid, reason }
        }
      } else if (opData['cmd'] === operators['op_revoke_creds']) {
        if (cpTxid === opData['data']['txid']) {
          let bPDFHash = hexToBytes(PDFHash)
          let buffer = Buffer.from(bPDFHash.buffer)
          let ripemdPDFHash = createHash('ripemd160')
            .update(buffer)
            .digest('hex')
          // there is an occasion that hashes array has two values
          // when there will be two revokations on the same transaction
          for (const h of opData['data']['hashes']) {
            if (ripemdPDFHash === h) {
              valid = false
              reason = 'cert hash was revoked'
              return { valid, reason }
            }
          }
        }
      } else if (opData['cmd'] === operators['op_revoke_address']) {
        let p2pkh = address.fromBase58Check(issuerAddress)
        let pkh = bytesToHex(p2pkh.hash)
        if (pkh === opData['data']['pkh']) {
          break
        }
      }
    }
  }

  return { valid, reason }
}

export default revocationCheck
