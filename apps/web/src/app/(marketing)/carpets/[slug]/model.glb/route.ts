import { buildCarpetGlb, modelResponse } from "@/features/carpet-ar";

interface Context {
  params: Promise<{ slug: string }>;
}

export async function GET(request: Request, { params }: Context) {
  return modelResponse(request, (await params).slug, "glb", buildCarpetGlb);
}
