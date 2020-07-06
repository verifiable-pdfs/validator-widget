import { textToHex } from './hexUtils'

const operators = {
  op_issue: '0004',
  op_issue_abs_expiry: '0005',
  op_revoke_batch: '0008',
  op_revoke_creds: '000c',
  op_revoke_address: 'ff00'
}

const parseOpReturnHex = hexData => {
  // decode the op return hexadecimal to translate the information it has
  let dataDict = {}
  if (hexData.startsWith(textToHex('CRED'))) {
    dataDict['version'] = hexData.substr(8, 4) //8-12
    dataDict['cmd'] = hexData.substr(12, 4) //12-16
    dataDict['data'] = {}

    if (dataDict['cmd'] === operators['op_issue']) {
      dataDict['data']['issuer_identifier'] = hexData.substr(16, 16) //16-32
      dataDict['data']['merkle_root'] = hexData.substr(32, 64) //32-96
    } else if (dataDict['cmd'] === operators['op_issue_abs_expiry']) {
      dataDict['data']['issuer_identifier'] = hexData.substr(16, 16) //16-32
      dataDict['data']['merkle_root'] = hexData.substr(32, 64) //32-96
      dataDict['data']['expiry'] = hexData.substr(96, 20) //96-116
    } else if (dataDict['cmd'] === operators['op_revoke_batch']) {
      dataDict['data']['txid'] = hexData.substr(16, 64) //16-80
    } else if (dataDict['cmd'] === operators['op_revoke_creds']) {
      dataDict['data']['txid'] = hexData.substr(16, 64) //16-80
      dataDict['data']['hashes'] = []
      dataDict['data']['hashes'].push(hexData.substr(80, 40)) //80-120
      if (hexData.length > 120) {
        dataDict['data']['hashes'].push(hexData.substr(120, 40)) //120-160
      }
    } else if (dataDict['cmd'] === operators['op_revoke_addres']) {
      dataDict['data']['pkh'] = hexData.substr(16, 40) //16-56
    } else {
      return
    }
  } else {
    return
  }

  return dataDict
}

export { parseOpReturnHex, operators }
