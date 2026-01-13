import { getTasks, parseXLS, postTasks } from "@/api/task-api";
import { DataGrid } from "@/components/data-grid/data-grid";

import { useDataGrid } from "@/hooks/use-data-grid";
import { useEffect, useRef, useState } from "react";

export default function JobsPage() {
  const [data, setData] = useState([]);
  const fileRef = useRef();

  const columns = [
    {
      id: "flag",
      accessorKey: "flag",
      header: "",
      maxSize: 30,
    },
    {
      id: "id",
      accessorKey: "id",
      header: "Task Id",
      minSize: 180,
    },
    {
      id: "jobId",
      accessorKey: "jobId",
      header: "Job Id",
      minSize: 120,
      maxSize: 150,
    },
    {
      id: "seq",
      accessorKey: "seq",
      header: "Seq",
      minSize: 20,
      maxSize: 80,
    },
    {
      id: "name",
      accessorKey: "name",
      header: "Name",
      minSize: 180,
    },
    {
      id: "description",
      accessorKey: "description",
      header: "Description",
      minSize: 380,
    },
    {
      id: "toolId",
      accessorKey: "toolId",
      header: "Tool Id",
      minSize: 120,
      maxSize: 150,
    },
    {
      id: "duration",
      accessorKey: "duration",
      header: "Duration",
      minSize: 120,
      maxSize: 150,
    },
  ];

  const onRowAdd = function () {
    setData((prev) => [...prev, { id: "" }]);

    return {
      rowIndex: data.length,
      columnId: "id",
    };
  };

  const onRowsDelete = function (rows, rowIdx) {
    setData((prev) => prev.filter((row) => !rows.includes(row)));
  };

  const { table, ...dataGridProps } = useDataGrid({
    data,
    columns,
    onRowAdd,
    onRowsDelete,
    onDataChange: setData,
    getRowId: (row) => row.id,
  });

  const upsertBtHandle = function () {
    postTasks(data).then((r) => window.alert(r));
  };

  const fileChangeHandle = function () {
    console.log(fileRef.current.files);
    parseXLS(fileRef.current.files[0]).then((json) => {
      const withFlags = json.items.map((e) => ({ ...e, flag: "N" }));

      setData((prev) => [...prev, ...withFlags]);
    });
    fileRef.current.value = "";
  };

  // 데이터 로드
  useEffect(function () {
    getTasks().then((json) => {
      const withFlags = json.tasks.map((e) => ({
        ...e,
        flag: "Y",
        jobId: e.job.id,
        toolId: e.tool ? e.tool.id : "",
      }));
      setData(withFlags);
    });
  }, []);

  return (
    <>
      <div className="flex justify-end gap-4">
        <input
          type="file"
          className="hidden"
          ref={fileRef}
          accept=".xls,.xlsx"
          onChange={fileChangeHandle}
        />
        <button onClick={() => fileRef.current.click()}>XLS</button>
        <button onClick={upsertBtHandle}>저장</button>
      </div>

      <DataGrid table={table} {...dataGridProps} />
    </>
  );
}
