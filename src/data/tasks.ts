import type { TaskRecord } from "../types";

export const demoTasks: TaskRecord[] = [
  {
    id: "task-001",
    toolSlug: "product-retouch",
    title: "耳机棚拍主图精修",
    createdAt: "2026-04-22 22:14",
    status: "已完成",
    credits: 10,
    thumb: "/assets/task-thumb-1.png"
  },
  {
    id: "task-002",
    toolSlug: "product-retouch",
    title: "耳机场景图精修",
    createdAt: "2026-04-22 22:09",
    status: "生成中",
    credits: 10,
    thumb: "/assets/task-thumb-2.png"
  },
  {
    id: "task-003",
    toolSlug: "model-tryon",
    title: "春装模特换装图",
    createdAt: "2026-04-22 19:30",
    status: "已完成",
    credits: 20,
    thumb: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=700&q=80"
  },
  {
    id: "task-004",
    toolSlug: "model-change",
    title: "香水模特表情调整",
    createdAt: "2026-04-23 10:16",
    status: "已完成",
    credits: 10,
    thumb: "/assets/task-gallery-6.png"
  },
  {
    id: "task-005",
    toolSlug: "copy-writing",
    title: "蓝牙耳机卖点文案",
    createdAt: "2026-04-22 18:12",
    status: "失败",
    credits: 5,
    thumb: "https://images.unsplash.com/photo-1518444065439-e933c06ce9cd?auto=format&fit=crop&w=700&q=80"
  }
];

export const productRetouchGallery = [
  "/assets/task-thumb-1.png",
  "/assets/task-gallery-2.png",
  "/assets/task-thumb-2.png",
  "/assets/task-gallery-4.png",
  "/assets/task-gallery-5.png",
  "/assets/task-gallery-6.png",
  "/assets/task-gallery-7.png",
  "/assets/task-gallery-8.png"
];
