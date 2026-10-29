import { type CarpetQuad, quadCorners } from "./carpet-quad";
import { storedZip } from "./zip";

const TEXTURE = "textures/carpet.jpg";

const vec = (values: readonly number[]) => `(${values.map((v) => String(v)).join(", ")})`;

/** The scene as USD text, laid out like three.js's USDZ exporter output that Quick Look accepts. */
export function carpetUsda(quad: CarpetQuad): string {
  const corners = quadCorners(quad);
  // USD's texture origin is the bottom-left, glTF's the top-left
  const st = corners.map((c) => vec([c.u, 1 - c.v])).join(", ");
  const points = corners.map((c) => vec(c.position)).join(", ");
  return `#usda 1.0
(
    customLayerData = {
        string creator = "farsh"
    }
    defaultPrim = "Root"
    metersPerUnit = 1
    upAxis = "Y"
)

def Xform "Root" (
    assetInfo = {
        string name = "Root"
    }
    kind = "component"
)
{
    def Mesh "Carpet" (
        prepend apiSchemas = ["MaterialBindingAPI"]
    )
    {
        rel material:binding = </Root/Materials/Carpet>
        int[] faceVertexCounts = [4]
        int[] faceVertexIndices = [0, 1, 2, 3]
        normal3f[] normals = [(0, 1, 0), (0, 1, 0), (0, 1, 0), (0, 1, 0)] (
            interpolation = "vertex"
        )
        point3f[] points = [${points}]
        texCoord2f[] primvars:st = [${st}] (
            interpolation = "vertex"
        )
        uniform bool doubleSided = 1
        uniform token subdivisionScheme = "none"
    }

    def Scope "Materials"
    {
        def Material "Carpet"
        {
            token outputs:surface.connect = </Root/Materials/Carpet/Surface.outputs:surface>

            def Shader "Surface"
            {
                uniform token info:id = "UsdPreviewSurface"
                color3f inputs:diffuseColor.connect = </Root/Materials/Carpet/Photo.outputs:rgb>
                float inputs:metallic = 0
                float inputs:roughness = 1
                token outputs:surface
            }

            def Shader "St"
            {
                uniform token info:id = "UsdPrimvarReader_float2"
                token inputs:varname = "st"
                float2 outputs:result
            }

            def Shader "Photo"
            {
                uniform token info:id = "UsdUVTexture"
                asset inputs:file = @${TEXTURE}@
                token inputs:sourceColorSpace = "sRGB"
                float2 inputs:st.connect = </Root/Materials/Carpet/St.outputs:result>
                token inputs:wrapS = "clamp"
                token inputs:wrapT = "clamp"
                float3 outputs:rgb
            }
        }
    }
}
`;
}

/** What iPhone's Quick Look places on the floor. The scene file must come first in the archive. */
export function buildCarpetUsdz(quad: CarpetQuad, jpeg: Uint8Array): Uint8Array {
  return storedZip([
    { name: "carpet.usda", data: new TextEncoder().encode(carpetUsda(quad)) },
    { name: TEXTURE, data: jpeg },
  ]);
}
