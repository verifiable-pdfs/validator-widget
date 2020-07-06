import React, { useState, useEffect } from 'react'
import classNames from 'classnames'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCaretDown } from '@fortawesome/free-solid-svg-icons'

export default function Dropdown({ onOpen, onClose, ...props }) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [dropdownStyle, setDropdownStyle] = useState(null)

  const buttonRef = React.createRef()
  const containerRef = React.createRef()

  useEffect(() => {
    const closeDropdown = e => {
      if (dropdownOpen) {
        setDropdownOpen(false)
        if (onClose) {
          onClose()
        }
      }
    }

    document.addEventListener('mousedown', closeDropdown)
    window.addEventListener('scroll', closeDropdown)

    return () => {
      document.removeEventListener('mousedown', closeDropdown)
      window.removeEventListener('scroll', closeDropdown)
    }
  }, [dropdownOpen, containerRef, onClose])

  const toggleDropdown = e => {
    e.stopPropagation()
    const newDropdownOpen = !dropdownOpen
    if (newDropdownOpen) {
      const buttonRect = buttonRef.current.getBoundingClientRect()
      const top = buttonRect.bottom
      const dropdownStyle = { top: `${top}px` }
      if (props.position === 'left') {
        dropdownStyle.left = `${buttonRect.left}px`
      } else {
        dropdownStyle.right = `${document.body.clientWidth -
          buttonRect.right}px`
      }

      setDropdownStyle(dropdownStyle)
    }
    setDropdownOpen(newDropdownOpen)

    if (newDropdownOpen && onOpen) {
      onOpen()
    }
    if (!newDropdownOpen && onClose) {
      onClose()
    }
  }

  const {
    component: Component,
    className,
    button,
    buttonClassName,
    menuClassName,
    position = 'right',
    includeCaret = true,
    children
  } = props

  return (
    <Component className={classNames(className, 'bc-dropdown')} ref={containerRef}>
      <button
        className={classNames(buttonClassName, 'bc-dropdown-toggle', {
          active: dropdownOpen
        })}
        onClick={toggleDropdown}
        type="button"
        aria-haspopup="true"
        aria-expanded={dropdownOpen ? 'true' : 'false'}
        ref={buttonRef}
      >
        <div className="d-flex">
          {button}
          {includeCaret && (
            <FontAwesomeIcon
              icon={faCaretDown}
              className="align-self-center ml-2"
            />
          )}
        </div>
      </button>
      {dropdownOpen && (
        <div
          className={classNames(
            'bc-dropdown-menu',
            `bc-dropdown-menu-${position}`,
            'bc-show',
            'bc-position-fixed',
            menuClassName
          )}
          style={dropdownStyle}
          aria-labelledby="dropdown-popup"
          onClick={toggleDropdown}
        >
          {children}
        </div>
      )}
    </Component>
  )
}
