import { networks, ECPair } from 'bitcoinjs-lib'
import bitcoinMessage from 'bitcoinjs-message'
import { Buffer } from 'safe-buffer'

const validateOwner = (testnet, metadata, PDFHash) => {
  const { owner, ownerProof } = metadata

  const network = testnet ? networks.testnet : networks.bitcoin
  const ownerAddress = ECPair.fromPublicKeyBuffer(Buffer.from(owner.pk, 'hex'), network).getAddress()

  const res = bitcoinMessage.verify(PDFHash, ownerAddress, ownerProof)

  return res
}
export default validateOwner
