import type {
  ApiResponse,
  Carpet,
  CreateCarpetInput,
  UpdateCarpetInput,
  UploadedImage,
} from "@farsh/contracts";

import { api } from "@/lib/api/client";

export const createCarpet = async (input: CreateCarpetInput) =>
  (await api<ApiResponse<Carpet>>("/carpets", { method: "POST", json: input })).data;

export const updateCarpet = async (slug: string, input: UpdateCarpetInput) =>
  (await api<ApiResponse<Carpet>>(`/carpets/${slug}`, { method: "PATCH", json: input })).data;

export const deleteCarpet = (slug: string) => api<void>(`/carpets/${slug}`, { method: "DELETE" });

export async function uploadCarpetImage(photo: Blob): Promise<UploadedImage> {
  const form = new FormData();
  form.append("image", photo, "photo.jpg");
  return (await api<ApiResponse<UploadedImage>>("/media/carpets", { method: "POST", form })).data;
}
