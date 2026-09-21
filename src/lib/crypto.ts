// Criptografia simétrica (AES-256-GCM) pra guardar connection strings de banco
// de clientes no banco central sem deixar em texto puro.
// A chave vem de ENCRYPTION_KEY (32 bytes, em base64). Gerar uma nova com:
//   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

function getKey(): Buffer {
  const b64 = process.env.ENCRYPTION_KEY
  if (!b64) {
    throw new Error(
      'ENCRYPTION_KEY não definida. Gere uma com: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))" e coloque no .env.'
    )
  }
  const key = Buffer.from(b64, 'base64')
  if (key.length !== 32) {
    throw new Error('ENCRYPTION_KEY inválida: precisa ter 32 bytes (gerar com o comando do .env.example).')
  }
  return key
}

// Formato armazenado: "iv:authTag:ciphertext", tudo em base64, separado por ":".
export function encrypt(texto: string): string {
  const key = getKey()
  const iv = randomBytes(12) // GCM recomenda IV de 12 bytes
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(texto, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return [iv.toString('base64'), authTag.toString('base64'), encrypted.toString('base64')].join(':')
}

export function decrypt(valorCriptografado: string): string {
  const key = getKey()
  const [ivB64, authTagB64, dataB64] = valorCriptografado.split(':')
  if (!ivB64 || !authTagB64 || !dataB64) {
    throw new Error('Valor criptografado em formato inválido.')
  }
  const iv = Buffer.from(ivB64, 'base64')
  const authTag = Buffer.from(authTagB64, 'base64')
  const data = Buffer.from(dataB64, 'base64')
  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(authTag)
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()])
  return decrypted.toString('utf8')
}
