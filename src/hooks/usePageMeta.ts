import { useEffect } from "react";

type PageMeta = {
  title: string;
  description: string;
  keywords: string;
};

const ensureMeta = (name: string) => {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);

  if (!element) {
    element = document.createElement("meta");
    element.name = name;
    document.head.appendChild(element);
  }

  return element;
};

export const usePageMeta = ({ title, description, keywords }: PageMeta) => {
  useEffect(() => {
    document.title = title;
    ensureMeta("description").content = description;
    ensureMeta("keywords").content = keywords;
  }, [description, keywords, title]);
};
