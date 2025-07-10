import { clientEnv } from "../src/_env/clientEnv";

export default {
  providers: [
    {
      domain: clientEnv.VITE_CONVEX_URL,
      applicationID: "convex",
    },
  ],
};
