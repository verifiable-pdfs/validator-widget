const config = {
    VALIDATOR_API_URL: process.env.REACT_APP_ENVIRONMENT === 'prod' ?
        'https://validator.block.co/verification-api':
        'http://localhost:5000/verification-api'
};

export default config;