import React, { useState } from 'react'
import classNames from 'classnames'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCheckCircle,
  faTimesCircle,
  faInfoCircle
} from '@fortawesome/free-solid-svg-icons'

import HelpIcon from './HelpIcon'

const capitalize = word => word.charAt(0).toUpperCase() + word.slice(1)

const IdentityObject = ({ address, issuer, ownerResult, txid, timestamp, verifications, docType, chain }) => {
  const [expandedDetails, setExpandedDetails] = useState(false)

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div className="bc-key-val-container">
        <div className="bc-box-label">
          Issuer{' '}
          <HelpIcon text={`This is the name that the issuer of this ${docType} on the blockchain has selected to be displayed.`} />
        </div>
        <div className="bc-box-value">{issuer}</div>
      </div>
      {ownerResult && (
        <div className="bc-key-val-container">
          <div className="bc-box-label">
            Sub-issuer{' '}
            <HelpIcon text={`This is the name of the actual issuer of the ${docType} on behalf of whom  <br/>the issuer above issued on the blockchain.<br/>The issuer above vouches that the identity of the sub-issuer is valid.`} />
          </div>
          <div className="bc-box-value">{ownerResult.owner.name}</div>
          {!ownerResult.ownerValid && (
            <div className="bc-alert-danger">
              The signature of the sub-issuer could not be validated.
            </div>
          )}
        </div>
      )}

      {verifications && (
        <div className="bc-key-val-container">
          <div className="bc-box-label">
            Issuer verification{' '}
            <HelpIcon
              text={`Methods provided by the issuer to prove that issuer ID '${address}' <br/> corresponds to issuer name '${issuer}'`}
            />
          </div>
          {Object.keys(verifications).map((k, i) => {
            let verificationMethod

            if (k === 'block_co') {
              verificationMethod = verifications[k].success ? (
                <div>
                  Block.co verified the identity of this issuer{' '}
                  <FontAwesomeIcon
                    icon={faCheckCircle}
                    className="bc-text-success"
                  />{' '}
                  <HelpIcon text="Block.co has manually verified the identity of this issuer" />
                </div>
              ) : (
                  <div>
                    Block.co has not verified the identity of this issuer{' '}
                    <FontAwesomeIcon
                      icon={faTimesCircle}
                      className="bc-text-danger"
                    />{' '}
                    <HelpIcon text={`Block.co has not verified the identity of this issuer, treat this ${docType} with caution`} />
                  </div>
                )
            } else if (k === 'domain') {
              verificationMethod = (
                <div>
                  Issuer domain: {verifications[k].url}{' '}
                  {verifications[k].success ? (
                    <span>
                      <FontAwesomeIcon
                        icon={faCheckCircle}
                        className="bc-text-success"
                      />{' '}
                      <HelpIcon
                        text={`The ${docType} issuer proved ownership of the domain displayed.<br/> Please verify that this domain actually represents ${issuer}`}
                      />
                    </span>
                  ) : (
                      <span>
                        <FontAwesomeIcon
                          icon={faTimesCircle}
                          className="bc-text-danger"
                        />{' '}
                        <HelpIcon text={`The ${docType} issuer provided the domain displayed here but could not prove ownership.`} />
                      </span>
                    )}
                </div>
              )
            }

            return <div key={i}>{verificationMethod}</div>
          })}
        </div>
      )}
      {expandedDetails ? (
        <div className="bc-text-center" style={{ marginTop: '1rem' }}>
          <div className="bc-box-label">
            Blockchain{' '}
            <HelpIcon text="Displays the blockchain on which the issuance is anchored" />
          </div>
          <div style={{ wordBreak: 'break-all' }}>{chain}</div>
          <div className="bc-box-label">
            Issuer ID{' '}
            <HelpIcon text="Unique identifier of the issuer on the blockchain" />
          </div>
          <div style={{ wordBreak: 'break-all' }}>{address}</div>
          <div className="bc-box-label" style={{ marginTop: '0.5rem' }}>
            Issuance transaction ID{' '}
            <HelpIcon text="Transaction ID of the issuance on the blockchain" />
          </div>
          <div style={{ wordBreak: 'break-all' }}>{txid}</div>
          <div className="bc-box-label" style={{ marginTop: '0.5rem' }}>
            Block timestamp{' '}
            <HelpIcon text="The moment that the block containing this issuance was mined in the blockchain" />
          </div>
          <div style={{ wordBreak: 'break-all' }}>{timestamp}</div>
        </div>
      ) : (
          <div className="bc-text-center" style={{ marginTop: '0.5rem' }}>
            <small
              className="bc-more-btn"
              onClick={() => setExpandedDetails(true)}
            >
              Show technical details
          </small>
          </div>
        )}
    </div>
  )
}

const MetadataTable = ({ metadata }) => (
  <table className="bc-table">
    <thead>
      <tr>
        <th colSpan="2">
          Additional Information
        </th>
      </tr>
    </thead>
    <tbody>
      {metadata.map((m, i) => (
        <tr key={i}>
          <td>
            <strong>{m.label}</strong>
          </td>
          <td>{m.value}</td>
        </tr>
      ))}
    </tbody>
  </table>
)

const ErrorMsg = ({ customText, docType }) => (
  <div className="p-3">
    <p>
      <FontAwesomeIcon icon={faInfoCircle} className="text-primary" /> Please
      make sure this is the original PDF that was issued on the blockchain and
      not an edited file or a scanned copy of the {docType}. Even opening the
      PDF in Adobe Acrobat Reader and saving it will render it invalid because
      Acrobat Reader modifies the file internally when saving it.
    </p>
    {customText.contactEmail && (
      <>
        <br />
        <p>
          For manual validation of {customText.organization} {docType}s please
          contact {customText.contactName} (
          <a href={`mailto:${customText.contactEmail}`}>
            {customText.contactEmail}
          </a>
          ).
        </p>
      </>
    )}
  </div>
)

const Result = ({ docType, result, error, customText }) => {
  return (
    <div>
      {error && (
        <>
          <div className="bc-alert bc-alert-danger bc-text-center">
            <FontAwesomeIcon icon={faTimesCircle} /> {error.detail}
          </div>
          <ErrorMsg customText={customText} docType={docType} />
        </>
      )}
      {result && (
        <>
          {result.result.status === 'valid' ? (
            <>
              <div
                className={classNames('bc-alert bc-text-center', {
                  'bc-alert-success': result.id_proofs !== 0,
                  'bc-alert-warning': result.id_proofs === 0
                })}
              >
                <FontAwesomeIcon icon={faCheckCircle} /> {capitalize(docType)}{' '}
                <strong>{result.filename}</strong> is valid!
                {result.id_proofs === 0 && (
                  <p>
                    However, the issuer has not provided any proof for his identity.
                  </p>
                )}
                {result.result.expiry_date && (
                  <p>
                    It will expire at: <strong>{result.result.expiry_date}.</strong>
                  </p>
                )}
              </div>
              <IdentityObject
                address={result.address}
                issuer={result.issuer}
                ownerResult={result.ownerResult}
                txid={result.txid}
                timestamp={result.timestamp}
                verifications={result.result.verification}
                docType={docType}
                chain={result.chain}
              />
              {Array.isArray(result.metadata) && result.metadata.length > 0 && (
                <MetadataTable metadata={result.metadata} />
              )}
            </>
          ) : (
              <>
                <div className="bc-alert bc-alert-danger bc-text-center">
                  <FontAwesomeIcon icon={faTimesCircle} /> {capitalize(docType)}{' '}
                  <strong>{result.filename}</strong> is not valid.
                  {/* {result.result.reason && <p>{result.result.reason}</p>} */}
                  {result.result.expiry_date && (
                    <p>
                      It has expired at: <strong>{result.result.expiry_date}.</strong>
                    </p>
                  )}
                  {result.result.revoked === 'certificate' && (
                    <p>The {docType} has been revoked.</p>
                  )}
                  {result.result.revoked === 'address' && (
                    <p>The issuer has invalidated this issuing address.</p>
                  )}
                  {result.result.revoked === 'batch' && (
                    <p>The issuance containing this {docType} has been revoked.</p>
                  )}
                </div>
                <ErrorMsg customText={customText} docType={docType} />
              </>
            )}
        </>)}
    </div>
  )
}

export default Result
