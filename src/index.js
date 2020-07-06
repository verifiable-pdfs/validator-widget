import 'react-app-polyfill/ie11';
import 'react-app-polyfill/stable';
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

let rootEls = document.getElementsByTagName('blockco-validator');

if (rootEls.length) {
    const rootEl = rootEls[0];
    const contactName = rootEl.getAttribute("contact-name");
    const contactEmail = rootEl.getAttribute("contact-email");
    const org = rootEl.getAttribute("organization");
    const testnet = rootEl.getAttribute("testnet") === 'true' ? true : false;
    const blockchainServicesAttr = rootEl.getAttribute('blockchain-services');

    let blockchainServices;
    try {
        blockchainServices = JSON.parse(blockchainServicesAttr);
    } catch(err) {
        console.error('blockchain-services attribute is not valid JSON', blockchainServicesAttr);
    }

    ReactDOM.render(
        <App
            testnet={testnet}
            contactName={contactName}
            contactEmail={contactEmail}
            organization={org}
            blockchainServices={blockchainServices || undefined}
        />,
        rootEl
    );
}
