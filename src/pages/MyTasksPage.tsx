import { TaskCenterPage } from "../components/TaskCenterPage";
import { usePageMeta } from "../hooks/usePageMeta";

export const MyTasksPage = () => {
  usePageMeta({
    title: "我的任务 - 创客贴 AI 电商",
    description: "统一查看创客贴 AI 电商站内所有工具的任务列表，可按功能快速筛选。",
    keywords: "我的任务,任务列表,AI电商任务,创客贴"
  });

  return <TaskCenterPage />;
};
