import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleNotch } from '@fortawesome/free-solid-svg-icons'

const Loader = ({ text }) => (
  <div className="bc-text-center" style={{ margin: '2rem 0' }}>
    <FontAwesomeIcon icon={faCircleNotch} size="2x" spin />
    {text && <div className="bc-text-center bc-text-muted" style={{ marginTop: '0.7rem' }}>{text}</div>}
  </div>
)

export default Loader
