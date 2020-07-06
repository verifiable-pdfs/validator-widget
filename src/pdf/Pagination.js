import React from 'react'
import classNames from 'classnames'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faChevronLeft,
  faChevronRight
} from '@fortawesome/free-solid-svg-icons'

const btnLabelStyle = {
  display: 'inline-block',
  minWidth: '100px',
  textAlign: 'center',
  backgroundColor: '#fff',
  lineHeight: '24px',
  padding: '7px 10px',
  verticalAlign: 'middle',
  borderRadius: 1000
}

function calculatePage(page, dir, numPages) {
  const newPage = page + dir
  return newPage < 1 || newPage > numPages ? page : newPage
}

function Pagination({ page, setPage, numPages }) {
  if (numPages <= 1) return null

  return (
    <div>
      <button
        className={classNames('bc-btn', {
          disabled: page === 1
        })}
        aria-label="Previous"
        onClick={() => setPage(page => calculatePage(page, -1, numPages))}
      >
        <FontAwesomeIcon icon={faChevronLeft} fixedWidth />
      </button>
      <span style={btnLabelStyle}>
        Page {page} of {numPages}
      </span>
      <button
        className={classNames('bc-btn', {
          disabled: page === numPages
        })}
        aria-label="Next"
        onClick={() => setPage(page => calculatePage(page, 1, numPages))}
      >
        <FontAwesomeIcon icon={faChevronRight} fixedWidth />
      </button>
    </div>
  )
}

export default Pagination
