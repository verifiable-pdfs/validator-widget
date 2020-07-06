import React, { useState } from 'react'
import classNames from 'classnames'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCheckCircle,
  faTimesCircle,
  faInfoCircle
} from '@fortawesome/free-solid-svg-icons'

import HelpIcon from './HelpIcon'

const IdentityObject = ({ address, issuer, txid, verifications }) => {
  const [expandedDetails, setExpandedDetails] = useState(false)

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div className="bc-key-val-container">
        <div className="bc-box-label">
          Issuer{' '}
          <HelpIcon text="This is the name that the issuer of the certificate has selected to be displayed" />
        </div>
        <div className="bc-box-value">{issuer}</div>
      </div>
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
                    <HelpIcon text="Block.co has not verified the identity of this issuer, treat this certificate with caution" />
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
                        text={`The certificate issuer proved ownership of the domain displayed.<br/> Please verify that this domain actually represents ${issuer}`}
                      />
                    </span>
                  ) : (
                      <span>
                        <FontAwesomeIcon
                          icon={faTimesCircle}
                          className="bc-text-danger"
                        />{' '}
                        <HelpIcon text="The certificate issuer provided the domain displayed here but could not prove ownership." />
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
            Issuer ID{' '}
            <HelpIcon text="Unique identifier of the issuer on the blockchain" />
          </div>
          <div style={{ wordBreak: 'break-all' }}>{address}</div>
          <div className="bc-box-label" style={{ marginTop: '0.5rem' }}>
            Issuance transaction ID{' '}
            <HelpIcon text="Transaction ID of the issuance on the blockchain" />
          </div>
          <div style={{ wordBreak: 'break-all' }}>{txid}</div>
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

const ErrorMsg = ({ customText }) => (
  <div className="p-3">
    <p>
      <FontAwesomeIcon icon={faInfoCircle} className="text-primary" /> Please
      make sure this is the original PDF that was issued on the blockchain and
      not an edited file or a scanned copy of the certificate. Even opening the
      PDF in Adobe Acrobat Reader and saving it will render it invalid because
      Acrobat Reader modifies the file internally when saving it.
    </p>
    {customText.contactEmail && (
      <>
        <br />
        <p>
          For manual validation of {customText.organization} certificates please
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

const Result = ({ result, error, customText }) => {
  return (
    <div>
      {error && (
        <>
          <div className="bc-alert bc-alert-danger bc-text-center">
            <FontAwesomeIcon icon={faTimesCircle} /> {error.detail}
          </div>
          <ErrorMsg customText={customText} />
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
                <FontAwesomeIcon icon={faCheckCircle} /> Certificate{' '}
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
                txid={result.txid}
                verifications={result.result.verification}
              />
              {Array.isArray(result.metadata) && result.metadata.length > 0 && (
                <MetadataTable metadata={result.metadata} />
              )}
            </>
          ) : (
              <>
                <div className="alert alert-danger text-center">
                  <FontAwesomeIcon icon={faTimesCircle} /> Certificate{' '}
                  <strong>{result.filename}</strong> is not valid.
            {/* {result.result.reason && <p>{result.result.reason}</p>} */}
                  {result.result.expiry_date && (
                    <p>
                      It has expired at: <strong>{result.result.expiry_date}.</strong>
                    </p>
                  )}
                  {result.result.revoked === 'certificate' && (
                    <p>The certificate has been revoked.</p>
                  )}
                  {result.result.revoked === 'address' && (
                    <p>The issuer has invalidated this issuing address.</p>
                  )}
                  {result.result.revoked === 'batch' && (
                    <p>The issuance containing this certificate has been revoked.</p>
                  )}
                </div>
                <ErrorMsg customText={customText} />
              </>
            )}
        </>)}
    </div>
  )
}

export default Result
