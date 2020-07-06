import React from 'react'
import Dropdown from './Dropdown'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons'

const HelpIcon = ({ text }) => (
  <Dropdown
    component="span"
    buttonClassName="bc-help-icon"
    menuClassName="bc-tooltip"
    includeCaret={false}
    position="left"
    button={<FontAwesomeIcon icon={faQuestionCircle} />}
  >
    <div className="bc-tooltip-content" dangerouslySetInnerHTML={{ __html: text }}></div>
  </Dropdown>
)

export default HelpIcon
