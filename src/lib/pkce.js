const base64Url = (bytes) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")

export function randomString(byteLength = 64) {
  return base64Url(crypto.getRandomValues(new Uint8Array(byteLength)))
}

export async function createPkcePair() {
  const verifier = randomString(64)
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier))
  return { verifier, challenge: base64Url(new Uint8Array(digest)) }
}
