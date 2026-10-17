export interface WebGLSupport {
  /** Highest WebGL version the browser offers; 0 when none. */
  version: 0 | 1 | 2;
  /**
   * A CPU rasteriser (SwiftShader, llvmpipe) instead of a GPU: every frame runs on the processor,
   * so the scenes render lighter and slower to keep the page responsive.
   */
  software: boolean;
}

const softwareRenderers = /swiftshader|llvmpipe|softpipe|software/i;

let cached: WebGLSupport | undefined;

/**
 * Probed once per page. Browsers cap live WebGL contexts, so probing on every render would push
 * out the contexts the scenes are drawing with.
 */
export function webglSupport(): WebGLSupport {
  if (cached) return cached;
  cached = { version: 0, software: false };
  try {
    const canvas = document.createElement("canvas");
    const webgl2 = canvas.getContext("webgl2");
    const context = webgl2 ?? canvas.getContext("webgl");
    if (context) {
      const info = context.getExtension("WEBGL_debug_renderer_info");
      const renderer = info ? String(context.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "";
      cached = { version: webgl2 ? 2 : 1, software: softwareRenderers.test(renderer) };
      context.getExtension("WEBGL_lose_context")?.loseContext();
    }
  } catch {
    // Probing can throw where WebGL is blocked; that is the same as having none.
  }
  return cached;
}
