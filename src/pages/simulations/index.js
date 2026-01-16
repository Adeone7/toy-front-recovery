import React, { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Clock } from "lucide-react";

// shadcn/ui (설치돼 있으면 경로 그대로 사용)
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

/**
 * Single-file, JS-only Gantt + shadcn skin
 * - Groups collapse/expand
 * - Hour scale
 * - Sticky left
 * - Now line
 */
export default function ShadcnGanttDemo() {
  // ====== SAMPLE DATA ======
  const [groups] = useState(() => [
    {
      id: "job-bread-a",
      title: "Bread-A",
      tasks: [
        {
          id: "t-1",
          name: "반죽",
          startAt: new Date("2026-01-13T09:00:00"),
          endAt: new Date("2026-01-13T13:00:00"),
        },
        {
          id: "t-2",
          name: "발효",
          startAt: new Date("2026-01-13T13:00:00"),
          endAt: new Date("2026-01-13T19:00:00"),
        },
        {
          id: "t-3",
          name: "굽기",
          startAt: new Date("2026-01-13T19:00:00"),
          endAt: new Date("2026-01-13T21:00:00"),
        },
      ],
    },
    {
      id: "job-bread-b",
      title: "Bread-B",
      tasks: [
        {
          id: "t-4",
          name: "반죽",
          startAt: new Date("2026-01-13T10:00:00"),
          endAt: new Date("2026-01-13T12:00:00"),
        },
        {
          id: "t-5",
          name: "발효",
          startAt: new Date("2026-01-13T12:00:00"),
          endAt: new Date("2026-01-13T16:00:00"),
        },
        {
          id: "t-6",
          name: "굽기",
          startAt: new Date("2026-01-13T16:00:00"),
          endAt: new Date("2026-01-13T18:00:00"),
        },
        {
          id: "t-7",
          name: "포장",
          startAt: new Date("2026-01-13T18:00:00"),
          endAt: new Date("2026-01-13T19:00:00"),
        },
      ],
    },
    {
      id: "job-cake-a",
      title: "Cake-A",
      tasks: [
        {
          id: "t-8",
          name: "시트 굽기",
          startAt: new Date("2026-01-13T09:30:00"),
          endAt: new Date("2026-01-13T11:30:00"),
        },
        {
          id: "t-9",
          name: "크림 준비",
          startAt: new Date("2026-01-13T11:00:00"),
          endAt: new Date("2026-01-13T12:30:00"),
        },
        {
          id: "t-10",
          name: "조립/데코",
          startAt: new Date("2026-01-13T12:30:00"),
          endAt: new Date("2026-01-13T15:00:00"),
        },
        {
          id: "t-11",
          name: "냉장 휴지",
          startAt: new Date("2026-01-13T15:00:00"),
          endAt: new Date("2026-01-13T18:00:00"),
        },
      ],
    },
  ]);

  // ====== CONFIG ======
  const stepMinutes = 60; // hour scale
  const colWidth = 64; // px per hour
  const rowHeight = 44;
  const groupHeaderHeight = 44;
  const leftWidth = 280;

  // ====== HELPERS ======
  const pad2 = (n) => String(n).padStart(2, "0");
  const fmtHM = (d) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  const dayKey = (d) =>
    `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  const toMs = (d) => (d instanceof Date ? d.getTime() : new Date(d).getTime());

  const floorToStep = (date, minutes) => {
    const ms = new Date(date).getTime();
    const stepMs = minutes * 60 * 1000;
    return new Date(Math.floor(ms / stepMs) * stepMs);
  };
  const ceilToStep = (date, minutes) => {
    const ms = new Date(date).getTime();
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

  // ====== RANGE ======
  const { rangeStart, rangeEnd, ticks } = useMemo(() => {
    const allTasks = groups.flatMap((g) => g.tasks);
    if (allTasks.length === 0) {
      const now = new Date();
      const start = floorToStep(now, stepMinutes);
      const end = new Date(start.getTime() + 8 * 60 * 60 * 1000);
      return {
        rangeStart: start,
        rangeEnd: end,
        ticks: buildTicks(start, end, stepMinutes),
      };
    }
    let min = Infinity,
      max = -Infinity;
    for (const t of allTasks) {
      min = Math.min(min, toMs(t.startAt));
      max = Math.max(max, toMs(t.endAt));
    }
    const start = floorToStep(new Date(min), stepMinutes);
    const end = ceilToStep(new Date(max), stepMinutes);
    return {
      rangeStart: start,
      rangeEnd: end,
      ticks: buildTicks(start, end, stepMinutes),
    };
  }, [groups]);

  const totalMinutes = (rangeEnd.getTime() - rangeStart.getTime()) / 60000;
  const totalCols = Math.max(1, Math.ceil(totalMinutes / stepMinutes));
  const gridWidthPx = totalCols * colWidth;

  // ====== COLLAPSE ======
  const [collapsed, setCollapsed] = useState(() =>
    Object.fromEntries(groups.map((g) => [g.id, false]))
  );
  const toggleGroup = (id) => setCollapsed((p) => ({ ...p, [id]: !p[id] }));

  // ====== NOW LINE ======
  const now = new Date();
  const showNow = now >= rangeStart && now <= rangeEnd;
  const nowLeftPx = useMemo(() => {
    const diffMin = (now.getTime() - rangeStart.getTime()) / 60000;
    const ratio = diffMin / (totalCols * stepMinutes);
    return Math.max(0, Math.min(gridWidthPx, ratio * gridWidthPx));
  }, [rangeStart, totalCols, stepMinutes, gridWidthPx]);

  const calcBar = (task) => {
    const s = toMs(task.startAt);
    const e = toMs(task.endAt);
    const startMin = (s - rangeStart.getTime()) / 60000;
    const endMin = (e - rangeStart.getTime()) / 60000;
    const left = (startMin / stepMinutes) * colWidth;
    const width = Math.max(6, ((endMin - startMin) / stepMinutes) * colWidth);
    return { left, width };
  };

  return (
    <div className="p-4">
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-lg">Gantt (shadcn skin)</CardTitle>
              <div className="text-xs text-muted-foreground flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" />
                <span>
                  {dayKey(rangeStart)} {fmtHM(rangeStart)} ~ {dayKey(rangeEnd)}{" "}
                  {fmtHM(rangeEnd)}
                </span>
                <Badge variant="secondary" className="ml-2">
                  step {stepMinutes}m
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline">col {colWidth}px</Badge>
              <Badge variant="outline">groups {groups.length}</Badge>
            </div>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="p-0">
          {/* Header row */}
          <div className="flex border-b bg-muted/40">
            <div
              className="shrink-0 px-3 flex items-center justify-between"
              style={{ width: leftWidth, height: 46 }}
            >
              <div className="text-sm font-medium">작업</div>
              <div className="text-xs text-muted-foreground">시간축</div>
            </div>

            <div
              className="relative flex-1 overflow-hidden"
              style={{ height: 46 }}
            >
              <div className="absolute inset-0 overflow-x-auto overflow-y-hidden">
                <div
                  className="relative"
                  style={{ width: gridWidthPx, height: 46 }}
                >
                  <div className="absolute inset-0 flex">
                    {Array.from({ length: totalCols }).map((_, i) => {
                      const d =
                        ticks[i] ||
                        new Date(
                          rangeStart.getTime() + i * stepMinutes * 60 * 1000
                        );
                      return (
                        <div
                          key={i}
                          className="h-full  border-border flex items-center justify-center text-xs text-muted-foreground"
                          style={{ width: colWidth }}
                        >
                          {pad2(d.getHours())}:00
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="flex">
            {/* Left column */}
            <div
              className="shrink-0  bg-background"
              style={{ width: leftWidth }}
            >
              {groups.map((g) => {
                const isCollapsed = !!collapsed[g.id];
                return (
                  <div key={g.id} className="border-b">
                    <div
                      style={{ height: groupHeaderHeight }}
                      className="px-2 flex items-center"
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleGroup(g.id)}
                        className="w-full justify-between"
                      >
                        <span className="flex items-center gap-2">
                          {isCollapsed ? (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="font-semibold">{g.title}</span>
                          <Badge variant="secondary" className="ml-2">
                            {g.tasks.length}
                          </Badge>
                        </span>
                        <span className="text-xs text-muted-foreground">
                          toggle
                        </span>
                      </Button>
                    </div>

                    {!isCollapsed &&
                      g.tasks.map((t) => (
                        <div
                          key={t.id}
                          className="px-3 flex items-center justify-between hover:bg-muted/40 transition-colors"
                          style={{ height: rowHeight }}
                        >
                          <div className="min-w-0">
                            <div className="text-sm truncate">{t.name}</div>
                            <div className="text-[11px] text-muted-foreground">
                              {fmtHM(t.startAt)} ~ {fmtHM(t.endAt)}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                );
              })}
            </div>

            {/* Timeline */}
            <div className="relative flex-1 overflow-auto">
              <div className="relative" style={{ width: gridWidthPx }}>
                {/* grid + now line */}
                <div className="absolute inset-0">
                  <div className="absolute inset-0 flex">
                    {Array.from({ length: totalCols }).map((_, i) => (
                      <div
                        key={i}
                        className="h-full  border-border/80"
                        style={{ width: colWidth }}
                      />
                    ))}
                  </div>

                  {showNow && (
                    <div
                      className="absolute top-0 bottom-0 w-[2px] bg-foreground/50"
                      style={{ left: nowLeftPx }}
                      title={`Now: ${fmtHM(now)}`}
                    />
                  )}
                </div>

                <div className="relative">
                  {groups.map((g) => {
                    const isCollapsed = !!collapsed[g.id];
                    return (
                      <div key={g.id} className="border-b">
                        <div
                          style={{ height: groupHeaderHeight }}
                          className="bg-muted/20"
                        />
                        {!isCollapsed &&
                          g.tasks.map((t) => {
                            const { left, width } = calcBar(t);
                            return (
                              <div
                                key={t.id}
                                className="relative"
                                style={{ height: rowHeight }}
                              >
                                {/* bar */}
                                <div
                                  className={[
                                    "absolute top-2 h-[28px] rounded-lg border bg-card shadow-sm",
                                    "hover:shadow transition-shadow px-2 flex items-center",
                                  ].join(" ")}
                                  style={{ left, width }}
                                  title={`${g.title} / ${t.name}\n${fmtHM(
                                    t.startAt
                                  )} ~ ${fmtHM(t.endAt)}`}
                                >
                                  <div className="min-w-0">
                                    <div className="text-xs font-medium truncate">
                                      {t.name}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground truncate">
                                      {fmtHM(t.startAt)} ~ {fmtHM(t.endAt)}
                                    </div>
                                  </div>
                                </div>

                                <div className="absolute inset-0 hover:bg-muted/20 transition-colors z-0" />
                              </div>
                            );
                          })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="px-3 py-2 text-xs text-muted-foreground bg-muted/30 border-t">
            팁: 확대/축소는{" "}
            <code className="px-1 rounded bg-background border">colWidth</code>{" "}
            조절, 더 촘촘한 축은{" "}
            <code className="px-1 rounded bg-background border">
              stepMinutes
            </code>
            를 30으로.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
