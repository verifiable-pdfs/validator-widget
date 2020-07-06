import { TextEncoder, TextDecoder } from 'text-encoding'

const textToHex = string => {
  let byte = new TextEncoder().encode(string)
  return bytesToHex(byte)
}

const hexToText = hex => {
  return new TextDecoder().decode(hexToBytes(hex))
}

const hexToBytes = hex => {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i !== bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16)
  }
  return bytes
}

const bytesToHex = bytes => {
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
}

export { textToHex, hexToText, hexToBytes, bytesToHex }
