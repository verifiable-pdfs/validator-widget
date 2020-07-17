import validateIdentity from './validateIdentity'
import revocationCheck from './revocationCheck'

import validateReceipt from './validateReceipt'
import validateOwner from './validateOwner'
import queryBlockchainServices from './blockchainServices'
import { ArrayBufferToString, extractHash } from './pdfUtils'
import extractMetadata from './extractMetadata'

export default async function validate(
  pdfArrayBuffer,
  pdfJSMetadata,
  blockchainServices,
  testnet
) {
  // Get our relevant metadata
  const metadata = await extractMetadata(pdfJSMetadata).catch(e => {
    console.error(e)
    throw new Error('Could not extract the validation proof from the PDF file.')
  })

  if (
    !(
      metadata.issuer &&
      metadata.address &&
      metadata.txid &&
      metadata.chainpoint_proof_object
    )
  ) {
    throw new Error('Could not extract the PDF proof.')
  }

  // Get the raw PDF string from the reader event and
  // extract the hash after emptying the chainpointProof
  let pdfString = ArrayBufferToString(pdfArrayBuffer)
  return await _validateInner(metadata, pdfString, pdfJSMetadata, blockchainServices, testnet)
}

async function _validateInner(metadata, pdfString, pdfJSMetadata, blockchainServices, testnet) {
  // Extract the hash (without emptying owner_proof)
  let PDFHash = await extractHash(pdfString, pdfJSMetadata)
  let validationResult = {}

  // send address and txid and receive all the transactions that happened before and after the issuance
  // Careful, Before and After are in reversed list of transactions, the last transaction happend is the first transaction in "Before" list
  let transactions = await queryBlockchainServices(
    blockchainServices,
    metadata.address,
    metadata.txid,
    testnet
  )
  // Validate that the chainpoint proof is valid and the PDFHash is anchored to the blockchain
  try {
    let { valid, reason } = validateReceipt(
      metadata.chainpoint_proof_object,
      transactions.before[0],
      PDFHash
    )
    // Check for revocations
    const revocationResult = revocationCheck(
      valid,
      reason,
      transactions,
      metadata,
      PDFHash
    )
    const result = {
      status: revocationResult.valid ? 'valid' : 'invalid',
      reason: revocationResult.reason
    }
    result.verification = await validateIdentity(metadata, testnet)
    let id_proofs = null
    if (metadata.version !== '0') {
      id_proofs = Object.values(result.verification).filter(v => v.success)
        .length
    }
    if (result.reason) {
      const r = result.reason
      if (r.includes('valid until: ') || r.includes('expired at:')) {
        const timestamp = parseInt(result['reason'].split(':')[1].trim())
        result.expiry_date = new Date(timestamp * 1000).toUTCString()
      } else if (r === 'address was revoked') {
        result.revoked = 'address'
      } else if (r === 'batch was revoked') {
        result.revoked = 'batch'
      } else if (r === 'cert hash was revoked') {
        result['revoked'] = 'certificate'
      }
    }

    // If it's version = '2' and owner is present, validate his pk as well
    let ownerResult
    if (metadata.version === '2' && metadata.owner && metadata.ownerProof) {
      // Reextract the hash, now also removing owner_proof
      PDFHash = await extractHash(pdfString, pdfJSMetadata, true)
      const ownerValid = validateOwner(testnet, metadata, PDFHash)
      ownerResult = {
        ownerValid,
        owner: metadata.owner
      }
    }

    validationResult = {
      address: metadata.address,
      issuer: metadata.issuer,
      metadata: metadata.visible_metadata,
      txid: metadata.txid,
      id_proofs,
      result
    }
    if (ownerResult) {
      validationResult.ownerResult = ownerResult
    }
  } catch (e) {
    console.error(e)
    throw new Error('Something went wrong while trying to verify this file.')
  }

  return validationResult
}
