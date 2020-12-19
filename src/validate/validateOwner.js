import { networks, ECPair } from 'bitcoinjs-lib'
import bitcoinMessage from 'bitcoinjs-message'
import { Buffer } from 'safe-buffer'


// bitcoinjs-lib doesn't include litecoin-testnet network
// Only `messagePrefix` and `pubKeyHash` are needed for our case
// but it breaks if the rest of the values are missing
const LITECOIN_TESTNET_NETWORK = {
  messagePrefix: '\x19Litecoin Signed Message:\n',
  bip32: {
    public: 0x043587cf,
    private: 0x04358394
  },
  pubKeyHash: 0x6f,
  scriptHash: 0xc4,
  wif: 0xef,
  dustThreshold: 0
}


const validateOwner = (metadata, PDFHash) => {
  const { owner, ownerProof } = metadata

  let network
  if (metadata.chain === 'bitcoin') {
    network = metadata.testnet ? networks.testnet : networks.bitcoin
  } else if (metadata.chain === 'litecoin') {
    network = metadata.testnet ? LITECOIN_TESTNET_NETWORK : networks.litecoin
  }
  const ownerAddress = ECPair.fromPublicKeyBuffer(Buffer.from(owner.pk, 'hex'), network).getAddress()

  const res = bitcoinMessage.verify(PDFHash, ownerAddress, ownerProof, network.messagePrefix)

  return res
}

export default validateOwner