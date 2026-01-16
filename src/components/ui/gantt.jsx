import React, { createContext, useContext, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Clock } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

/**
 * data shape
 * group: { id, title, tasks: [{id, name, startAt, endAt}] }
 */

const GanttCtx = createContext(null);
const useGantt = () => {
  const v = useContext(GanttCtx);
  if (!v) throw new Error("Gantt components must be used inside <Gantt/>");
  return v;
};

// ====== utils ======
const pad2 = (n) => String(n).padStart(2, "0");
const fmtHM = (d) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
const dayKey = (d) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const toDate = (x) => (x instanceof Date ? x : new Date(x));
const toMs = (x) => toDate(x).getTime();

const floorToStep = (date, minutes) => {
  const ms = toMs(date);
  const stepMs = minutes * 60 * 1000;
  return new Date(Math.floor(ms / stepMs) * stepMs);
};
const ceilToStep = (date, minutes) => {
  const ms = toMs(date);
  const stepMs = minutes * 60 * 1000;
  return new Date(Math.ceil(ms / stepMs) * stepMs);
};
const buildTicks = (start, end, stepMin) => {
  const stepMs = stepMin * 60 * 1000;
  const out = [];
  for (let t = start.getTime(); t <= end.getTime(); t += stepMs)
    out.push(new Date(t));
  return out;
};
const hashHue = (str) => {
  if (!str) return 0;
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h % 360;
};

// ====== Wrapper ======
export function Gantt({ options = {}, children }) {
  const opt = {
    // card/header
    showCard: true,
    showHeader: true,
    title: "Gantt (shadcn skin)",
    compact: false,

    // layout
    leftWidth: options.compact ? 240 : 280,
    colWidth: options.compact ? 56 : 64,
    stepMinutes: 60,
    rowHeight: options.compact ? 44 : 50,
    groupHeaderHeight: options.compact ? 44 : 50,
    headerHeight: options.compact ? 40 : 50,

    // colors
    groupColors: {}, // { [groupId]: {hue} or {bg,border} }
    hueOffset: 0,

    ...options,
  };

  // ✅ Content가 계산해서 여기에 채워줄 값들(range/ticks/cols/width)
  const [meta, setMeta] = useState(null);

  // ✅ value는 opt + meta + setMeta (Header가 meta를 읽음)
  const value = useMemo(
    () => ({ opt, meta, setMeta }),
    // opt가 바뀌면 전체 갱신
    // (JSON stringify 싫으면 key 배열로 바꿔도 됨)
    [JSON.stringify(opt), meta]
  );

  const inner = (
    <GanttCtx.Provider value={value}>
      <div className={opt.compact ? "p-2" : "p-4"}>{children}</div>
    </GanttCtx.Provider>
  );

  if (!opt.showCard) return inner;

  return (
    <div className={opt.compact ? "p-2" : "p-4"}>
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <GanttCtx.Provider value={value}>{children}</GanttCtx.Provider>
        </CardContent>
      </Card>
    </div>
  );
}

// ====== Header (✅ 원래 카드 헤더 살린 버전) ======
export function GanttHeader() {
  const { opt, meta } = useGantt();
  if (!opt.showHeader) return null;

  const rangeStart = meta?.rangeStart;
  const rangeEnd = meta?.rangeEnd;

  return (
    <CardHeader className={opt.compact ? "py-2 px-3" : "pb-3"}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <CardTitle className={opt.compact ? "text-sm" : "text-lg"}>
            {opt.title}
          </CardTitle>

          {/* ✅ compact면 헤더 메타는 숨기거나 줄이기 */}
          {!opt.compact && (
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <Clock className="h-3.5 w-3.5" />
              <span>
                {rangeStart && rangeEnd ? (
                  <>
                    {dayKey(rangeStart)} {fmtHM(rangeStart)} ~{" "}
                    {dayKey(rangeEnd)} {fmtHM(rangeEnd)}
                  </>
                ) : (
                  "range loading..."
                )}
              </span>
              <Badge variant="secondary" className="ml-2">
                step {opt.stepMinutes}m
              </Badge>
            </div>
          )}
        </div>

        {!opt.compact && (
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="outline">col {opt.colWidth}px</Badge>
            <Badge variant="outline">groups {meta?.groupCount ?? "-"}</Badge>
          </div>
        )}
      </div>

      {/* Header 쓰면 아래 구분선이 자연스러움 */}
      <Separator className="mt-3" />
    </CardHeader>
  );
}

// ====== Content (only this receives data) ======
export function GanttContent({ data }) {
  const { opt, setMeta } = useGantt();
  const groups = data || [];

  // range
  const computed = useMemo(() => {
    const allTasks = groups.flatMap((g) => g.tasks || []);
    const stepMinutes = opt.stepMinutes;

    if (allTasks.length === 0) {
      const now = new Date();
      const rangeStart = floorToStep(now, stepMinutes);
      const rangeEnd = new Date(rangeStart.getTime() + 8 * 60 * 60 * 1000);
      const totalMinutes = (rangeEnd.getTime() - rangeStart.getTime()) / 60000;
      const totalCols = Math.max(1, Math.ceil(totalMinutes / stepMinutes));
      const gridWidthPx = totalCols * opt.colWidth;

      return {
        rangeStart,
        rangeEnd,
        ticks: buildTicks(rangeStart, rangeEnd, stepMinutes),
        totalCols,
        gridWidthPx,
      };
    }

    let min = Infinity,
      max = -Infinity;
    for (const t of allTasks) {
      min = Math.min(min, toMs(t.startAt));
      max = Math.max(max, toMs(t.endAt));
    }

    const rangeStart = floorToStep(new Date(min), stepMinutes);
    const rangeEnd = ceilToStep(new Date(max), stepMinutes);
    const totalMinutes = (rangeEnd.getTime() - rangeStart.getTime()) / 60000;
    const totalCols = Math.max(1, Math.ceil(totalMinutes / stepMinutes));
    const gridWidthPx = totalCols * opt.colWidth;

    return {
      rangeStart,
      rangeEnd,
      ticks: buildTicks(rangeStart, rangeEnd, stepMinutes),
      totalCols,
      gridWidthPx,
    };
  }, [groups, opt.stepMinutes, opt.colWidth]);

  const { rangeStart, rangeEnd, ticks, totalCols, gridWidthPx } = computed;

  // ✅ Header가 쓸 메타를 Context로 밀어넣기
  // 렌더 중 setState 방지 위해 useMemo 말고 "effect"가 정석이지만,
  // 너 스타일(심플) 유지하려면 아래처럼 "조건 가드"로도 충분히 안정적임.
  useMemo(() => {
    setMeta?.({
      rangeStart,
      rangeEnd,
      totalCols,
      gridWidthPx,
      groupCount: groups.length,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    rangeStart?.getTime?.(),
    rangeEnd?.getTime?.(),
    totalCols,
    gridWidthPx,
    groups.length,
  ]);

  // collapse
  const [collapsed, setCollapsed] = useState(() =>
    Object.fromEntries(groups.map((g) => [g.id, false]))
  );
  const toggleGroup = (id) => setCollapsed((p) => ({ ...p, [id]: !p[id] }));

  // color resolver
  const resolveGroupColor = (g) => {
    const override = opt.groupColors?.[g.id];
    if (override?.bg && override?.border) {
      return { ...override, dot: override.dot || override.border };
    }
    const baseHue =
      typeof override?.hue === "number" ? override.hue : hashHue(g.id);

    const hue = (baseHue + (opt.hueOffset || 0) + 360) % 360;
    return {
      bg: `hsla(${hue}, 85%, 55%, 0.22)`,
      border: `hsla(${hue}, 85%, 42%, 0.85)`,
      dot: `hsla(${hue}, 85%, 42%, 0.95)`,
      hue,
    };
  };

  // bar calc
  const calcBar = (task) => {
    const s = toMs(task.startAt);
    const e = toMs(task.endAt);
    const startMin = (s - rangeStart.getTime()) / 60000;
    const endMin = (e - rangeStart.getTime()) / 60000;
    const left = (startMin / opt.stepMinutes) * opt.colWidth;
    const width = Math.max(
      12,
      ((endMin - startMin) / opt.stepMinutes) * opt.colWidth
    );
    return { left, width };
  };

  // rows
  const rows = useMemo(() => {
    const out = [];
    for (const g of groups) {
      out.push({ type: "group", group: g });
      if (!collapsed[g.id]) {
        for (const t of g.tasks || [])
          out.push({ type: "task", group: g, task: t });
      }
    }
    return out;
  }, [groups, collapsed]);

  return (
    <div className="relative overflow-auto">
      {/* 전체 캔버스 폭 */}
      <div style={{ width: opt.leftWidth + gridWidthPx }}>
        {/* ✅ Content 쪽 sticky 시간축은 유지 */}
        <div
          className="sticky top-0 z-20 border-b bg-muted"
          style={{ height: opt.headerHeight }}
        >
          <div className="flex h-full">
            <div
              className="sticky left-0 z-30 bg-muted shrink-0"
              style={{ width: opt.leftWidth }}
            >
              <div className="px-3 h-full flex items-center justify-between">
                <div className="text-sm font-medium">작업</div>
                {!opt.compact && (
                  <div className="text-xs text-muted-foreground">
                    {fmtHM(rangeStart)} ~ {fmtHM(rangeEnd)}
                  </div>
                )}
              </div>
            </div>

            <div className="relative" style={{ width: gridWidthPx }}>
              <div className="absolute inset-0 flex">
                {Array.from({ length: totalCols }).map((_, i) => {
                  const d =
                    ticks[i] ||
                    new Date(
                      rangeStart.getTime() + i * opt.stepMinutes * 60 * 1000
                    );
                  return (
                    <div
                      key={i}
                      className="h-full border-l border-border flex items-center justify-center text-xs text-muted-foreground"
                      style={{ width: opt.colWidth }}
                    >
                      {pad2(d.getHours())}:00
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* body */}
        <div>
          {rows.map((r, idx) => {
            if (r.type === "group") {
              const g = r.group;
              const isCollapsed = !!collapsed[g.id];
              const c = resolveGroupColor(g);

              return (
                <div key={`g-${g.id}-${idx}`} className="border-b">
                  <div
                    className="flex"
                    style={{ height: opt.groupHeaderHeight }}
                  >
                    <div
                      className="sticky left-0 z-10 bg-background shrink-0"
                      style={{ width: opt.leftWidth }}
                    >
                      <div className="px-2 h-full flex items-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-between"
                          onClick={() => toggleGroup(g.id)}
                        >
                          <span className="flex items-center gap-2 min-w-0">
                            {isCollapsed ? (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span
                              className="inline-block h-2.5 w-2.5 rounded-full"
                              style={{ background: c.dot }}
                            />
                            <span className="font-semibold truncate">
                              {g.title}
                            </span>
                            <Badge variant="secondary" className="ml-1">
                              {(g.tasks || []).length}
                            </Badge>
                          </span>
                        </Button>
                      </div>
                    </div>

                    <div
                      className="bg-muted/20"
                      style={{ width: gridWidthPx }}
                    />
                  </div>
                </div>
              );
            }

            // task row
            const g = r.group;
            const t = r.task;
            const c = resolveGroupColor(g);
            const { left, width } = calcBar(t);

            return (
              <div key={`t-${t.id}-${idx}`} className="border-b">
                <div className="flex" style={{ height: opt.rowHeight }}>
                  <div
                    className="sticky left-0 z-10 bg-background hover:bg-muted/40 transition-colors shrink-0"
                    style={{ width: opt.leftWidth }}
                  >
                    <div className="px-3 h-full flex items-center">
                      <div className="text-sm truncate">{t.name}</div>
                    </div>
                  </div>

                  <div className="relative" style={{ width: gridWidthPx }}>
                    <div
                      className="absolute rounded-lg border shadow-sm px-3 py-1.5 flex items-center"
                      style={{
                        left,
                        width,
                        top: opt.compact ? 5 : 6,
                        height: opt.compact ? 34 : 38,
                        background: c.bg,
                        borderColor: c.border,
                      }}
                      title={`${g.title} / ${t.name}\n${fmtHM(
                        toDate(t.startAt)
                      )} ~ ${fmtHM(toDate(t.endAt))}`}
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium leading-snug truncate">
                          {t.name}
                        </div>
                        {!opt.compact && (
                          <div className="text-[11px] leading-snug text-muted-foreground truncate">
                            {fmtHM(toDate(t.startAt))} ~{" "}
                            {fmtHM(toDate(t.endAt))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <Separator />
      </div>
    </div>
  );
}

// ====== Footer (slot) ======
export function GanttFooter({ children }) {
  const { opt } = useGantt();
  return (
    <div className="px-3 py-2 text-xs text-muted-foreground bg-muted/30 border-t">
      {children ?? (
        <span>
          팁:{" "}
          <code className="px-1 rounded bg-background border">colWidth</code>로
          확대/축소,
          <code className="px-1 ml-1 rounded bg-background border">
            stepMinutes
          </code>
          로 축 조절.
          {opt.compact ? " (compact)" : ""}
        </span>
      )}
    </div>
  );
}
