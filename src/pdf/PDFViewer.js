import React, { useState, useRef, useEffect } from 'react'

import Pagination from './Pagination'
import PDFZoom from './PDFZoom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes } from '@fortawesome/free-solid-svg-icons'

const pdfContainerStyle = {
  height: '100%',
  position: 'relative',
  backgroundColor: '#666'
}
const toolbarStyle = {
  padding: '0.5rem 1rem',
  position: 'absolute',
  width: '100%',
  boxSizing: 'border-box',
  display: 'flex',
  justifyContent: 'space-between'
}
const canvasContainerStyle = {
  textAlign: 'center',
  verticalAlign: 'middle',
  padding: '0.5rem',
  paddingTop: '60px',
  height: '100%',
  overflow: 'auto',
  borderLeft: '3px solid #666',
  boxSizing: 'border-box'
}

const CloseButton = ({ closeFunction }) =>
  closeFunction ? (
    <button
      className="bc-btn"
      onClick={closeFunction}
    >
      <FontAwesomeIcon icon={faTimes} fixedWidth />
    </button>
  ) : null

function renderPDFPage(pdf, page, scale, canvasRef) {
  pdf.getPage(page).then(pdfPage => {
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    const scaledViewport = pdfPage.getViewport({ scale })

    canvas.width = scaledViewport.width
    canvas.height = scaledViewport.height

    const renderContext = {
      canvasContext: context,
      viewport: scaledViewport
    }

    pdfPage.render(renderContext)
  })
}

export default function PDFViewer({ pdf, closeFunction }) {
  const [page, setPage] = useState(1)
  const [scale, setScale] = useState(1)

  const firstRender = useRef(true)
  const canvasRef = useRef(null)
  const canvasContainerRef = useRef(null)

  useEffect(() => {
    function calculateInitialScale() {
      pdf.getPage(page).then(pdfPage => {
        // Creating the page view with default parameters.
        const viewport = pdfPage.getViewport({ scale: 1 })
        const canvasContainer = canvasContainerRef.current
        const canvasContainerPadding = parseFloat(
          window
            .getComputedStyle(canvasContainer, null)
            .getPropertyValue('padding-left')
            .replace('px', '')
        )
        const canvasContainerWidth =
          canvasContainer.offsetWidth - canvasContainerPadding * 2 - 80
        const canvasContainerHeight =
          canvasContainer.offsetHeight - canvasContainerPadding * 2 - 80
        let newScale = canvasContainerWidth / viewport.width
        if (viewport.height * newScale > canvasContainerHeight) {
          newScale = canvasContainerHeight / viewport.height
        }

        setScale(newScale)
      })
    }

    if (firstRender.current) {
      firstRender.current = false
      calculateInitialScale()
    } else {
      renderPDFPage(pdf, page, scale, canvasRef)
    }
  }, [pdf, page, scale, canvasRef])

  return (
    <div style={pdfContainerStyle}>
      <div style={toolbarStyle}>
        <PDFZoom scale={scale} setScale={setScale} />
        <div className="bc-inline-block">
          <Pagination page={page} numPages={pdf.numPages} setPage={setPage} />
        </div>
        <div className="bc-inline-block">
          <CloseButton closeFunction={closeFunction} />
        </div>
      </div>
      <div style={canvasContainerStyle} ref={canvasContainerRef}>
        <canvas ref={canvasRef}></canvas>
      </div>
    </div>
  )
}
