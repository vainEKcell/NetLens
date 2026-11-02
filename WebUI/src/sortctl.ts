// 页头排序控件：列下拉 + 方向按钮（循环 无→升→降），作用于传入的 AG Grid
import { GridApi } from "ag-grid-community";
import { t } from "./i18n";

export type SortColumn = { key: string; label: string };

let btnSeq = 0;

/// 在 pageHead 容器右侧插入排序控件；返回清理函数占位（页面重建即随 DOM 销毁）
export function mountSortControl(
  head: HTMLElement,
  api: GridApi,
  columns: SortColumn[],
  initialKey: string,
  initialDir: "asc" | "desc" = "desc",
): void {
  const wrap = document.createElement("div");
  wrap.className = "sort-ctl";
  wrap.style.marginLeft = "auto";

  const sel = document.createElement("select");
  sel.className = "sort-select";
  columns.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c.key;
    opt.textContent = c.label;
    sel.appendChild(opt);
  });
  sel.value = initialKey;

  const dirBtn = document.createElement("button");
  dirBtn.className = "btn sort-dir";
  const setDirLabel = (dir: string) => {
    dirBtn.textContent = dir === "asc" ? "↑" : dir === "desc" ? "↓" : "⇅";
    dirBtn.dataset.dir = dir;
  };
  setDirLabel(initialDir);

  const apply = (key: string, dir: string) => {
    if (dir === "none") { api.applyColumnState({ defaultState: { sort: null } }); return; }
    api.applyColumnState({
      state: [{ colId: key, sort: dir as "asc" | "desc" }],
      defaultState: { sort: null },
    });
  };

  sel.addEventListener("change", () => {
    const dir = (dirBtn.dataset.dir ?? "desc") === "none" ? "desc" : (dirBtn.dataset.dir ?? "desc");
    setDirLabel(dir);
    apply(sel.value, dir);
  });
  dirBtn.addEventListener("click", () => {
    const cur = dirBtn.dataset.dir ?? "desc";
    const next = cur === "desc" ? "asc" : cur === "asc" ? "none" : "desc";
    setDirLabel(next);
    if (next === "none") apply("", "none");
    else apply(sel.value, next);
  });

  const label = document.createElement("span");
  label.className = "sort-label";
  label.textContent = t("sort.label");

  wrap.appendChild(label);
  wrap.appendChild(sel);
  wrap.appendChild(dirBtn);
  head.appendChild(wrap);
}
