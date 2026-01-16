import React, { useEffect, useState } from "react";

import { useRouter } from "next/router";
import {
  Gantt,
  GanttContent,
  GanttFooter,
  GanttHeader,
} from "@/components/ui/gantt";
import { Button } from "@/components/ui/button";

const columns = [
  { type: "string", label: "Task ID" },
  { type: "string", label: "Task Name" },
  { type: "string", label: "Resource" },
  { type: "date", label: "Start Date" },
  { type: "date", label: "End Date" },
  { type: "number", label: "Duration" },
  { type: "number", label: "Percent Complete" },
  { type: "string", label: "Dependencies" },
];

const options = {
  gantt: {},
};

export default function SimulateResultPage() {
  const [schedules, setSchedules] = useState([]);
  const [sort, setSort] = useState("job");
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    if (!id) return;

    fetch("http://192.168.0.15:8080/api/scenarios/" + id + "/simulate")
      .then((response) => response.json())
      .then((json) => setSchedules(json.schedules));
  }, [id]);

  const groupIds = [];
  if (!id || schedules.length === 0) return <div>로딩중</div>;

  const jobIds = [];
  schedules.forEach((one) => {
    if (sort === "job") {
      if (!jobIds.includes(one.jobId)) groupIds.push(one.jobId);
    } else {
      if (!groupIds.includes(one.toolId)) groupIds.push(one.toolId);
    }
  });

  const groups = groupIds.map((id) => {
    return {
      id: id,
      title: id,
      tasks: schedules
        .filter((one) => one.jobId === id)
        .map((one) => ({ ...one, name: one.taskId }))
        .sort((a, b) => a.seq - b.seq),
    };
  });
  console.log(groups);

  return (
    <div className="min-h-screen bg-background">
      <div className="flesx gap-1">
        <Button variant="ghost" size="sm" onClick={() => setSort("job")}>
          작업
        </Button>{" "}
        <Button ariant="ghost" size="sm" onClick={() => setSort("tool")}>
          툴
        </Button>
      </div>
      <Gantt
        options={{
          title: "gantt",
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
