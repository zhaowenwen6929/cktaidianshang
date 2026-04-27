import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { demoTasks } from "../data/tasks";
import { tools } from "../data/tools";

const filters = [{ value: "all", label: "全部任务" }, ...tools.map((tool) => ({ value: tool.slug, label: tool.shortName }))];

export const TaskCenterPage = () => {
  const [activeFilter, setActiveFilter] = useState("all");

  const tasks = useMemo(() => {
    if (activeFilter === "all") {
      return demoTasks;
    }

    return demoTasks.filter((task) => task.toolSlug === activeFilter);
  }, [activeFilter]);

  return (
    <div className="task-page">
      <div className="task-page-header">
        <div>
          <h1>我的任务</h1>
          <p>统一查看所有工具的生成任务，支持按功能筛选与回看结果。</p>
        </div>
        <Link className="back-link" to={`/tools/${tools[0].slug}`}>
          返回工具页
        </Link>
      </div>

      <div className="task-filter-bar">
        {filters.map((filter) => (
          <button
            key={filter.value}
            className={filter.value === activeFilter ? "active" : ""}
            onClick={() => setActiveFilter(filter.value)}
            type="button"
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="task-list">
        {tasks.map((task) => {
          const tool = tools.find((item) => item.slug === task.toolSlug);

          return (
            <article key={task.id} className="task-item">
              <img alt={task.title} className="task-thumb" src={task.thumb} />
              <div className="task-meta">
                <div className="task-title-row">
                  <strong>{task.title}</strong>
                  <span className={`status-badge ${task.status}`}>{task.status}</span>
                </div>
                <p>
                  工具：{tool?.shortName} · 创建时间：{task.createdAt}
                </p>
                <p>消耗积分：{task.credits}</p>
              </div>
              <div className="task-actions">
                <button type="button">查看结果</button>
                <button type="button">再次生成</button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};
