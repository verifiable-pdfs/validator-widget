const extractMetadata = async pdfInfo => {
  // Extracts the relevant metadata of the vPDF from
  // the PDFJS parsed metadata
  const pdfCustomMetadata = pdfInfo.info.Custom
  const chainpoint_proof = pdfCustomMetadata.chainpoint_proof

  let version = String(pdfCustomMetadata.version)
  let issuer = pdfCustomMetadata.issuer
  let issuer_object,
    address,
    metadata_object,
    metadataString,
    verificationMethods,
    owner,
    ownerProof

  if (version === '1') {
    issuer_object = JSON.parse(pdfCustomMetadata.issuer)
    issuer = issuer_object.name
    address = issuer_object.identity.address
    verificationMethods = issuer_object.identity.verification
    metadataString = pdfCustomMetadata.metadata
  } else if (version === '2') {
    issuer_object = JSON.parse(pdfCustomMetadata.issuer)
    issuer = issuer_object.name
    address = issuer_object.identity.address
    verificationMethods = issuer_object.identity.verification
    metadataString = pdfCustomMetadata.metadata
    owner = pdfCustomMetadata.owner ? JSON.parse(pdfCustomMetadata.owner) : undefined
    ownerProof = pdfCustomMetadata.owner_proof
  } else {
    version = '0'
    address = pdfCustomMetadata.issuer_address
    issuer = pdfCustomMetadata.issuer
    metadataString = pdfCustomMetadata.metadata_object
    if (
      metadataString &&
      metadataString.includes('issuer') &&
      metadataString.includes('issuer_address')
    ) {
      metadata_object = JSON.parse(metadataString)
      issuer = metadata_object['issuer']
      address = metadata_object['issuer_address']
    }
  }
  let visible_metadata = []
  if (metadataString) {
    metadata_object = JSON.parse(metadataString)

    if (version === '0') {
      const LABELS_ORDERING = [
        'First Name',
        'Fathers Name',
        'Last Name',
        'Degree Type',
        'Program of Study',
        'Date of Issue'
      ]

      let i = 0
      LABELS_ORDERING.forEach(l => {
        if (metadata_object[l]) {
          visible_metadata.push({
            label: l,
            order: i,
            value: metadata_object[l]
          })
          i += 1
        }
      })

      visible_metadata.sort((a, b) => a.order - b.order)
    } else {
      for (const l in metadata_object) {
        var nest_l = metadata_object[l]
        if (!nest_l.hide) {
          visible_metadata.push(nest_l)
        }
      }

      visible_metadata.sort((a, b) => a.order - b.order)
    }
  } else {
    metadataString = {}
  }

  const chainpoint_proof_object = JSON.parse(chainpoint_proof)
  const txid = chainpoint_proof_object['anchors'][0]['sourceId']

  return {
    version,
    issuer,
    address,
    verificationMethods,
    visible_metadata,
    txid,
    chainpoint_proof_object,
    owner,
    ownerProof
  }
}

export default extractMetadata
