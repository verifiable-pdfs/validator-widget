import React from 'react';
import Dropzone from 'react-dropzone';
import classNames from 'classnames';
import { hot } from 'react-hot-loader';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons'
import CoreValidator from './CoreValidator';

import Modal from './components/Modal';

import './scss/App.scss';
import '@fortawesome/fontawesome-svg-core/styles.css';


class App extends React.Component {
    state = {
        loading: false,
        preError: null,
        result: null,
        error: null,
        modalOpen: false,
        pdf: null
    };
    lastDropEvent;

    validateJS = (file) => {
        // Validates a vPDF on the browser-side
        // const filename = file.name;

        const reader = new FileReader();
        reader.onload = (e) => {
            // Core validator will take over with validating and displaying the PDF
            this.setState({ pdfArrayBuffer: e.target.result, modalOpen: true });
        };

        reader.readAsArrayBuffer(file);
    }

    processPDF = (acceptedFiles) => {
        // Rendering inside the web component makes the drop event fire twice
        // (because of https://www.npmjs.com/package/react-shadow-dom-retarget-events)
        // binding it on top of Dropzone's listener
        // This is a quick hack to avoid this
        if (this.lastDropEvent && (Date.now() - this.lastDropEvent < 500)) return;
        this.lastDropEvent = Date.now();

        if (!acceptedFiles.length) {
            const preError = 'Not a valid PDF file';
            console.error(preError);
            this.setState({ preError });
            return;
        }
        if (acceptedFiles.length > 1) {
            const preError = 'You can only validate one file at a time';
            console.error(preError);
            this.setState({ preError });
            return;
        }

        this.setState({ loading: true, preError: null });

        this.validateJS(acceptedFiles[0]);
    }

    cleanUp = () => {
        this.setState({
            result: null,
            error: null,
            loading: false,
            pdf: null
        });
    }

    closeModal = () => {
        this.setState({ modalOpen: false });
        this.cleanUp();
    }

    render() {
        return (
            <div className="App">
                {this.state.preError && (
                    <div className="bc-alert bc-alert-danger">
                        <FontAwesomeIcon icon={faExclamationCircle} />
                        {this.state.preError}
                    </div>
                )}
                <Dropzone onDrop={this.processPDF} multiple={false} accept="application/pdf">
                    {({ getRootProps, getInputProps, isDragActive }) => (
                        <section>
                            <div {...getRootProps()} className={classNames('dropzone', { 'hover': isDragActive })}>
                                <input {...getInputProps()} />
                                {
                                    isDragActive ?
                                        <div>Drop the file here ...</div> :
                                        <div>Drag 'n' drop the PDF {this.props.docType} here, or click to select it from your device</div>
                                }
                            </div>
                        </section>
                    )}
                </Dropzone>
                <Modal
                    isOpen={this.state.modalOpen}
                    closeModal={this.closeModal}
                    body={
                        <CoreValidator
                            pdfArrayBuffer={this.state.pdfArrayBuffer}
                            contactName={this.props.contactName}
                            contactEmail={this.props.contactEmail}
                            organization={this.props.organization}
                            docType={this.props.docType}
                            testnet={this.props.testnet}
                            blockchainServices={this.props.blockchainServices}
                            closeFunction={this.closeModal}
                        />
                    }
                />
            </div>
        );
    }
}

App.defaultProps = {
    testnet: false,
    blockchainServices: { requiredSuccesses: 1, services: [{ name: 'BTCD API', url: 'https://validator.block.co/api' }] }
};

export default hot(module)(App);
