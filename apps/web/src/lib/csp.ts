/**
 * The site's Content-Security-Policy. Scripts run only with this request's nonce ('strict-dynamic'
 * lets those scripts load the chunks they import). Styles stay 'unsafe-inline' because React and the
 * 3D canvas write style attributes, which a nonce cannot cover.
 */
export function buildCsp(nonce: string, isDev: boolean): string {
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data:",
    "font-src 'self'",
    // three.js loaders and drei read blob: and data: URLs; dev also needs the HMR socket
    `connect-src 'self' blob: data:${isDev ? " ws:" : ""}`,
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ];
  return directives.join("; ");
}

export function createNonce(): string {
  return btoa(crypto.randomUUID());
}
