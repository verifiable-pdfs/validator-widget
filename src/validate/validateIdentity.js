import request from 'axios'

const verifyBlockcoIdentityMethod = async (address, isTestnet) => {
  const url = isTestnet
    ? `https://test-api.block.co/auth/verify-address/${address}/`
    : `https://api.block.co/auth/verify-address/${address}/`

  return new Promise((resolve, reject) => {
    request
      .get(url)
      .then(res => {
        resolve({ method: 'block_co', result: { success: true } })
      })
      .catch(err => {
        reject({ method: 'block_co', result: { success: false } })
      })
  })
}

const verifyDomainIdentityMethod = async (url, address) => {
  const credFileURL = url + (url.slice(-1) === '/' ? '' : '/') + 'cred.txt'

  return new Promise((resolve, reject) => {
    request
      .get(credFileURL)
      .then(res => {
        if (res.data.includes(address)) {
          resolve({ method: 'domain', result: { success: true, url } })
        } else {
          reject({ method: 'domain', result: { success: false, url } })
        }
      })
      .catch(err => {
        reject({ method: 'domain', result: { success: false, url } })
      })
  })
}

const validateIdentity = async (metadata, isTestnet) => {
  // Check each of the verificationMethods for identity proof
  let { address, verificationMethods } = metadata
  const verificationResults = {}

  if (Array.isArray(verificationMethods)) {
    // Each verification method function should return a promise
    // that indicates if the check succeeded or not
    // The resolve value or reject reason of the promise should be of the form:
    // { method: verificationMethodName, result: { success: boolean, ... } }
    const promiseArray = []

    for (let verificationMethod of verificationMethods) {
      if (verificationMethod.block_co) {
        promiseArray.push(verifyBlockcoIdentityMethod(address, isTestnet))
      } else if (verificationMethod.domain && verificationMethod.domain.url) {
        promiseArray.push(
          verifyDomainIdentityMethod(verificationMethod.domain.url, address)
        )
      }
    }

    const results = await Promise.allSettled(promiseArray)

    for (const res of results) {
      const value = res.value || res.reason
      verificationResults[value.method] = value.result
    }
  }

  return verificationResults
}

export default validateIdentity
