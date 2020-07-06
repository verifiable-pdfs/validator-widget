import chainpointvalidate from 'chainpoint-validate'
import { parseOpReturnHex, operators } from './credProtocol'

const validateProof = chainpointProof => {
  return new Promise((resolve, reject) => {
    let chainpointValidate = new chainpointvalidate()
    chainpointValidate.isValidReceipt(chainpointProof, false, function(
      err,
      result
    ) {
      if (err) {
        reject(err)
        console.error('error', err)
      } else {
        resolve(result)
        // result.isValid will equal true
        // result.anchors will be an array of anchor objects
      }
    })
  })
}

const validateReceipt = (cpProof, opReturnHex, PDFHash) => {
  validateProof(cpProof).catch(e => {
    valid = false
    reason = 'Not a valid ChainPoint v2 proof'
    return { valid, reason }
  })

  // check validity of the pdf for variety situations
  // and initialise some parameters of pdf metadata
  let opReturnObject = parseOpReturnHex(opReturnHex)
  let cpHash = cpProof['targetHash']
  let fileMerkleRoot = cpProof['merkleRoot']
  let opMerkleRoot, expDate
  let valid = true
  let reason = null

  if (cpHash !== PDFHash) {
    valid = false
    reason = 'PDF hash is different than the ChainPoint proof hash embedded in the PDF'
    return { valid, reason }
  }

  if (opReturnObject) {
    let opCmd = opReturnObject['cmd']
    opMerkleRoot = opReturnObject['data']['merkle_root']
    let expiryHex = opReturnObject['data']['expiry']
    if (opCmd === operators['op_issue_abs_expiry']) {
      expDate = parseInt(expiryHex, 16)
    } else {
      expDate = null
    }
  } else {
    opMerkleRoot = opReturnHex.substr(14)
  }

  if (fileMerkleRoot !== opMerkleRoot) {
    valid = false
    reason = 'Merkle root in ChainPoint proof doesn\'t match the merkle root in the blockchain'
    return { valid, reason }
  }

  if (opReturnObject && expDate) {
    // Calculate the exact time to compare with expiry date, both are counted in seconds from 1/1/1970
    let now = Date.now()
    let nowInt = parseInt(now / 1000)
    if (expDate > nowInt) {
      valid = true
      reason = 'valid until: ' + expDate.toString()
    } else {
      valid = false
      reason = 'certificate expired at: ' + expDate.toString()
    }
  }

  return { valid, reason }
}
export default validateReceipt
