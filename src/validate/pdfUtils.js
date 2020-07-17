import { bytesToHex } from './hexUtils'

const ArrayBufferToString = arrayBuffer => {
  let binaryString = '',
    bytes = new Uint8Array(arrayBuffer),
    length = bytes.length
  for (let i = 0; i < length; i++) {
    binaryString += String.fromCharCode(bytes[i])
  }
  return binaryString
}

const StringToArrayBuffer = str => {
  let buf = new ArrayBuffer(str.length)
  let bufView = new Uint8Array(buf)
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i)
  }
  return buf
}

// Pdf.js adds these in the docInfo dict, we don't want them
const IGNORE_PDF_FIELDS = [
  'PDFFormatVersion',
  'IsLinearized',
  'IsAcroFormPresent',
  'IsXFAPresent',
  'IsCollectionPresent'
]

const _formatBigArray = arr => {
  let bigArr = []
  let subArr = []
  let count = 1000000
  for (const x of arr) {
    count = count + x.length + 1
    if (count > 71) {
      subArr = []
      bigArr.push(subArr)
      count = x.length + 1
    }
    subArr.push(x)
  }

  return bigArr.map(b => b.join(' ')).join('\n  ')
}

const formatArray = arr => {
  if (arr.join('').length <= 70) {
    return arr.join(' ')
  }
  return _formatBigArray(arr)
}

const _checkIfKey = (metadataString, key, start, idx) => {
  // Check if the idx is inside parentheses (so it's not an actual key) and if yes
  // move to the next occurence
  // We ignore escaped parentheses
  let insideParentheses = 0
  const subStr = metadataString.slice(start, idx)
  for (let i = 1; i < subStr.length; i++) {
    const chr = subStr[i];
    if (chr === '(' && subStr[i - 1] !== '\\') {
      insideParentheses += 1
    } else if (chr === ')' && subStr[i - 1] !== '\\') {
      insideParentheses -= 1
    }
  }

  // If we were inside parentheses grab the next occurence of `key`
  // and check again
  if (insideParentheses) {
    idx = metadataString.indexOf(key, idx)
    return _checkIfKey(metadataString, key, start, idx)
  } else {
    return idx
  }
}

const extractHash = async (pdfString, pdfJSMetadata, removeOwnerProof=false) => {
  // We need to extract and empty the chainpoint_proof key from the pdf's docInfo
  // Format the metadata that pdf.js returns in the way that python's pdfrw 0.3
  // writes them, in order to produce the same hash

  // First we split the metadata to keys starting with uppercase or lowercase letters
  // the same way pdfrw-0.3 does. We also exclude some key-value pairs added by PDFjs
  // We only keep the keys, we'll get the values from the original metadataString later
  let upperArray = []
  let lowerArray = []
  for (const m in pdfJSMetadata.info) {
    // Ignore the fields that pdf.js adds
    if (IGNORE_PDF_FIELDS.includes(m)) continue
    if (m !== 'Custom') {
      if (m[0] === m[0].toUpperCase()) {
        upperArray.push(m)
      } else {
        lowerArray.push(m)
      }
    } else {
      for (const subm in pdfJSMetadata.info[m]) {
        if (subm[0] === subm[0].toUpperCase()) {
          upperArray.push(subm)
        } else {
          lowerArray.push(subm)
        }
      }
    }
  }
  // Sort each of upper and lower arrays, concat them, and turn them into a single array
  upperArray = upperArray.sort((a, b) =>
    Object.keys(a)[0].localeCompare(Object.keys(b)[0])
  )
  lowerArray = lowerArray.sort((a, b) =>
    Object.keys(a)[0].localeCompare(Object.keys(b)[0])
  )
  let metadataKeys = upperArray.concat(lowerArray)

  // Because sometimes PDFjs doesn't parse PDF Strings the same way as python pdfrw-0.3 does,
  // we'll use the values from the original pdfString for the key-value pairs

  // Locate where the INFO object is inside the pdf
  let re = /trailer[\s\S]*\/Info([\s\S]*?)\/Root/
  let match = re.exec(pdfString)
  let infoObject = match[1].trim()

  let metadataString;

  if (infoObject[0] === '<') {
    // The PDF Dict containing the metadata is inline
    re = /trailer[\s\S]*\/Info[\s\S]*<<([\s\S]*?)>>[\s\S]*\/Root/
    match = re.exec(pdfString)
    metadataString = match[1].trim()
  } else if (!isNaN(infoObject[1])) {
    // infoObject contains a reference to the actual PDF dict
    // containing the metadata
    re = new RegExp(`${infoObject.slice(0, -2)} obj\n<<([\\s\\S]*?)>>\nendobj`)
    match = re.exec(pdfString)
    metadataString = match[1].trim()
  }

  const KEYS_TO_EMPTY = removeOwnerProof ? ['/chainpoint_proof', '/owner_proof'] : ['/chainpoint_proof']

  // Get the correct values from the original pdfString for the keys extracted with PDFjs
  let docInfoArray = []
  let prevIdx = 0
  for (let i = 1; i < metadataKeys.length; i++) {
    const prevKey = `/${metadataKeys[i - 1]}`
    const key = `/${metadataKeys[i]}`
    docInfoArray.push(prevKey)
    // Start looking for the first occurence after the previous found key
    prevIdx = metadataString.indexOf(prevKey, prevIdx)
    let idx = metadataString.indexOf(key, prevIdx)

    idx = _checkIfKey(metadataString, key, prevIdx + prevKey.length, idx)

    // If it's chainpoint_proof or owner or owner_proof, set it to empty before adding
    const value = KEYS_TO_EMPTY.includes(prevKey) ? '()' : metadataString.slice(prevIdx + prevKey.length, idx).trim()
    docInfoArray.push(value)

    if (i === metadataKeys.length - 1) {
      // Add the last key and value
      docInfoArray.push(key)
      const value = key === KEYS_TO_EMPTY.includes(prevKey) ? '()' : metadataString.slice(idx + key.length).trim()
      docInfoArray.push(value)
    }
  }

  // Now that we have the correct key-value pairs for metadata,
  // we produce a "semi-readable" string, copying the formatting procedure from pdfrw-0.3
  const newMetadataString = formatArray(docInfoArray)

  // Also calculate the length difference and the minimum index pos after which
  // we have to adjust the xrefs positions
  const lengthDiff = metadataString.length - newMetadataString.length
  const minRefIndex = match.index + newMetadataString.length

  // Replace the old docInfo with the new one with an empty chainpoint_proof
  pdfString = pdfString.replace(metadataString, newMetadataString)

  // Find the xref section and adjust all values
  let re2 = /xref(.*?)trailer/s
  let match2 = re2.exec(pdfString)
  let xrefIdx = match2.index
  let lines = match2[1].split('\n')
  lines = lines.map(l => {
    const items = l.split(' ')
    if (items.length === 3 && items[0].length === 10) {
      let num = parseInt(items[0])
      // If the xref position (start) is after the /Info object
      // adjust their ref value by the lengthDiff
      if (num > minRefIndex) {
        items[0] = String(num - lengthDiff).padStart(10, '0')
      }
      return items.join(' ')
    }
    return l
  })
  const newXref = 'xref' + lines.join('\n') + 'trailer'
  pdfString = pdfString.replace(re2, newXref)

  // Adjust the file length at the end of the pdf
  pdfString = pdfString.replace(
    /startxref\n(\d+)/,
    (match, p1) => `startxref\n${xrefIdx}`
  )

  // Turn again into uintarray and calculate the hash
  const uint = StringToArrayBuffer(pdfString)
  const crypto = window.crypto // TODO: use msrCrypto for IE11
  if (!crypto) {
    throw new Error('You are using an unsupported browser. Please use a modern browser like latest Chrome or Firefox.')
  }
  const digest = await crypto.subtle.digest('SHA-256', uint)
  return bytesToHex(new Uint8Array(digest))
}

export { ArrayBufferToString, StringToArrayBuffer, extractHash }
