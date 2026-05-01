import { Info, ProviderContext } from "../types";

export const GetMetaData = async ({
  link,
  provider,
  providerContext,
}: {
  link: string;
  provider: string;
  providerContext: ProviderContext;
}): Promise<Info> => {
  return {
    title: "",
    image: "",
    synopsis: "",
    imdbId: "",
    type: "",
    linkList: [],
  };
};
