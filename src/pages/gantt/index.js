import React, { useState } from "react";
import {
  Gantt,
  GanttHeader,
  GanttContent,
  GanttFooter,
} from "@/components/ui/gantt";

// ===== 샘플 데이터 (네가 다른 데서 가져와서 여기만 교체하면 됨) =====
const groups = [
  {
    id: "job-bread-a",
    title: "Bread-A",
    tasks: [
      {
        id: "t-1",
        name: "반죽",
        startAt: "2026-01-13T09:00:00",
        endAt: "2026-01-13T13:00:00",
      },
      {
        id: "t-2",
        name: "발효",
        startAt: "2026-01-13T13:00:00",
        endAt: "2026-01-13T19:00:00",
      },
      {
        id: "t-3",
        name: "굽기",
        startAt: "2026-01-13T19:00:00",
        endAt: "2026-01-13T21:00:00",
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
        startAt: "2026-01-13T10:00:00",
        endAt: "2026-01-13T12:00:00",
      },
      {
        id: "t-5",
        name: "발효",
        startAt: "2026-01-13T12:00:00",
        endAt: "2026-01-13T16:00:00",
      },
      {
        id: "t-6",
        name: "굽기",
        startAt: "2026-01-13T16:00:00",
        endAt: "2026-01-13T18:00:00",
      },
      {
        id: "t-7",
        name: "포장",
        startAt: "2026-01-13T18:00:00",
        endAt: "2026-01-13T19:00:00",
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
        startAt: "2026-01-13T09:30:00",
        endAt: "2026-01-13T11:30:00",
      },
      {
        id: "t-9",
        name: "크림 준비",
        startAt: "2026-01-13T11:30:00",
        endAt: "2026-01-19T12:30:00",
      },
      {
        id: "t-10",
        name: "조립/데코",
        startAt: "2026-01-13T12:30:00",
        endAt: "2026-01-13T15:00:00",
      },
      {
        id: "t-11",
        name: "냉장 휴지",
        startAt: "2026-01-13T15:00:00",
        endAt: "2026-01-13T18:00:00",
      },
    ],
  },
];
export default function GanttDemoPage() {
  return (
    <div className="min-h-screen bg-background">
      <Gantt
        options={{
          title: "Gantt",
          showHeader: true,
          groupColors: {
            "job-bread-a": { hue: 25 },
            "job-cake-a": { hue: 120 },
          },
        }}
      >
        <GanttHeader />
        <GanttContent data={groups} />
        <GanttFooter />
      </Gantt>
    </div>
  );
}
