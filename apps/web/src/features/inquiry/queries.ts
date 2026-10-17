import { useMutation } from "@tanstack/react-query";

import { createInquiry } from "./api";

export const useCreateInquiry = () => useMutation({ mutationFn: createInquiry });
