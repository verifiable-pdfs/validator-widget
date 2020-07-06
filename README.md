Widget to validate [Verifiable PDFs](https://verifiable-pdfs.org/) in the browser

## Usage

To embed the widget on a web page you need to include the custom `blockco-validator` html tag somewhere in the page, and also include the built JS script below the custom tag. Block.co will always host the latest version of the JS script at [https://static.block.co/blockco-validator2.js](https://static.block.co/blockco-validator2.js) but anyone can built the latest code from this repository, host the JS script somewhere and include that instead.

### Example

```html
<blockco-validator organization="Example LTD" contact-name="John Smith" contact-email="foo@example.org"></blockco-validator>
<script src="https://static.block.co/blockco-validator2.js"></script>
```

### Custom tag options

Options for the widget can be added as html attributes in the custom `<blockco-validator>` tag. All values must be correctly escaped following html attributes rules.

| Attribute                      | Explanation                                                                                                                                                                                                                                                                                                                                                                                            |
|--------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| organization (optional)        | The name of the organization. It will be shown in the contact details for manual verification if some certificate does not validate.                                                                                                                                                                                                                                                                   |
| contact-name (optional)        | The name of the person to contact for manual verification if some certificate does not validate.                                                                                                                                                                                                                                                                                                       |
| contact-email (optional)       | The email of the person to contact for manual verification if some certificate does not validate.                                                                                                                                                                                                                                                                                                      |
| testnet (optional)             | If set to `true` the validator will query the bitcoin testnet network instead of mainnet to validate the certificate. Default: `false`                                                                                                                                                                                                                                                                 |
| blockchain-services (optional) | JSON with options for the services to be queried to access the bitcoin blockchain. Example: {      &quot;requiredSuccesses&quot;: 1,      &quot;services&quot;: [         {              &quot;name&quot;: &quot;BTCD API&quot;,              &quot;url&quot;: &quot;https://validator.block.co/api&quot;         },         {             &quot;name&quot;: &quot;BlockCypher&quot;         }     ] } |

## Developing

In the project directory, you can run:

### `yarn start`

Runs the app in the development mode.<br />
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br />
You will also see any lint errors in the console.

### `yarn build`

Builds the app for production to the `build` folder.<br />
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and a single JS file is produced under build/static/js/main.{HASH}.js.<br />
Your app is ready to be deployed!


## Deploying

To deploy the application, just use a web server or a CDN to serve the single JS file that was built in the previous step.
