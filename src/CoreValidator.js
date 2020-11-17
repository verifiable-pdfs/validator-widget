import React, { useState, useEffect } from 'react'
import PDFJS from 'pdfjs-dist'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimesCircle } from '@fortawesome/free-solid-svg-icons'
import Loader from './components/Loader'
import Result from './components/Result'
import PDFViewer from './pdf/PDFViewer'
import validate from './validate/validate'

// Init PDF.js service worker
PDFJS.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS.version}/pdf.worker.js`

export default function CoreValidator({
  pdfArrayBuffer,
  closeFunction,
  topDisplay,
  bottomDisplay,
  blockchainServices = { requiredSuccesses: 1, services: [{ name: 'BlockCypher' }] },
  contactEmail,
  contactName,
  organization,
  docType,
  testnet = false
}) {
  const [loading, setLoading] = useState(true)
  const [preError, setPreError] = useState(null)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [pdf, setPdf] = useState(null)

  useEffect(() => {
    // Validates a vPDF on the browser-side
    setLoading(true)

    async function parsePDF() {
      // Parse the PDF with PDFJS
      const pdfJSDocument = await PDFJS.getDocument(
        pdfArrayBuffer
      ).promise.catch(err => {
        console.error(err)
        throw new Error('Could not parse the PDF document.')
      })

      // Parse the PDF metadata from the PDFJS document
      const pdfJSMetadata = await pdfJSDocument.getMetadata().catch(err => {
        console.error(err)
        throw new Error('Could not parse the PDF metadata.')
      })

      setPdf(pdfJSDocument)

      validate(pdfArrayBuffer, pdfJSMetadata, blockchainServices, testnet)
        .then(res => {
          setLoading(false)
          setResult(res)
        })
        .catch(err => {
          console.error(err.message)
          setLoading(false)
          setError({ detail: err.message })
        })
    }

    parsePDF().catch(err => {
      console.error(err.message)
      setLoading(false)
      setPreError(err.message)
    })
  }, [blockchainServices, pdfArrayBuffer, testnet])

  return (
    <div className="core-validator" style={{ height: '100%', overflowY: 'none' }}>
      <div className="bc-clearfix" style={{ height: '100%' }}>
        <div className="bc-column bc-col-left bc-text-center">
          {topDisplay}
          {loading ? (
            <Loader text={`Validating ${docType}, please wait...`} />
          ) : (preError ?
            <div className="bc-alert bc-alert-danger bc-text-center">
              <FontAwesomeIcon icon={faTimesCircle} /> {preError.detail}
            </div> :
            <>
              {testnet && <div>TESTNET</div>}
              <Result
                docType={docType}
                result={result}
                error={error}
                customText={{ contactEmail, contactName, organization }}
              />
              {bottomDisplay}
            </>
            )
          }
        </div>
        <div className="bc-column bc-col-right">
          {pdf && <PDFViewer pdf={pdf} closeFunction={closeFunction} />}
        </div>
      </div>
    </div>
  )
}
