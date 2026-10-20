import { useMutation } from "@tanstack/react-query";

import { subscribeNewsletter } from "./api";

export const useSubscribeNewsletter = () => useMutation({ mutationFn: subscribeNewsletter });
