import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCalendarAlt, faClock } from '@fortawesome/free-regular-svg-icons'


const prependZeroes = (n) => {
    if (n <= 9) {
        return '0' + n;
    }
    return n;
}

const Datetime = ({ utc, singleRow=false }) => {
    if (!utc) {
        return '-';
    }
    const timeStringUTC = utc;
    const timeStringUTCEpoch = Date.parse(timeStringUTC);
    const timeUTC = new Date();
    timeUTC.setTime(timeStringUTCEpoch);
    const formattedDate = `${timeUTC.getFullYear()}-${prependZeroes(timeUTC.getMonth() + 1)}-${prependZeroes(timeUTC.getDate())}`
    const formattedTime = `${prependZeroes(timeUTC.getHours())}:${prependZeroes(timeUTC.getMinutes())}`

    return (
        <div className="datetime">
            {singleRow ?
                <><FontAwesomeIcon icon={faCalendarAlt} /> {formattedDate}&nbsp;&nbsp; <FontAwesomeIcon icon={faClock} /> {formattedTime}</> :
                <>
                    <div><FontAwesomeIcon icon={faCalendarAlt} /> {formattedDate}</div>
                    <div><FontAwesomeIcon icon={faClock} /> {formattedTime}</div>
                </>
            }
        </div>
    );
}

export default Datetime;