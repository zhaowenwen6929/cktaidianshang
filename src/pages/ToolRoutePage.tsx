import { Navigate, useParams } from "react-router-dom";
import { ToolPage } from "../components/ToolPage";
import { defaultTool, tools } from "../data/tools";
import { usePageMeta } from "../hooks/usePageMeta";

export const ToolRoutePage = () => {
  const { slug } = useParams();
  const tool = tools.find((item) => item.slug === slug) ?? defaultTool;

  usePageMeta({
    title: `${tool.name} - 创客贴 AI 电商`,
    description: tool.description,
    keywords: tool.keywords
  });

  if (!tools.some((item) => item.slug === slug)) {
    return <Navigate replace to={`/tools/${defaultTool.slug}`} />;
  }

  return <ToolPage tool={tool} />;
};
