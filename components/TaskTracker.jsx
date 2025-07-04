"use client";

import { useState, useRef } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent } from "./ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const TASK_DEFINITIONS = {
  "Website Build": [
    { name: "Wireframes", projected: 2 },
    { name: "Design", projected: 3 },
    { name: "Development", projected: 5 },
    { name: "Testing", projected: 2 }
  ],
  "Marketing Campaign": [
    { name: "Research", projected: 1 },
    { name: "Content Creation", projected: 4 },
    { name: "Distribution", projected: 2 }
  ]
};

export default function TaskTracker() {
  const [selectedTaskKey, setSelectedTaskKey] = useState("");
  const [customTaskName, setCustomTaskName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [actuals, setActuals] = useState({});
  const reportRef = useRef(null);

  const subtasks = TASK_DEFINITIONS[selectedTaskKey] || [];

  const handleActualChange = (index, value) => {
    setActuals({ ...actuals, [index]: value });
  };

  const exportData = () => {
    const exportObj = {
      taskKey: selectedTaskKey,
      taskName: customTaskName || selectedTaskKey,
      startDate,
      subtasks: subtasks.map((s, i) => ({
        name: s.name,
        projected: s.projected,
        actual: Number(actuals[i] || 0)
      }))
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${exportObj.taskName || "task"}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const importData = (event) => {
    const fileReader = new FileReader();
    fileReader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        if (imported.taskKey && TASK_DEFINITIONS[imported.taskKey]) {
          setSelectedTaskKey(imported.taskKey);
          setCustomTaskName(imported.taskName || imported.taskKey);
          setStartDate(imported.startDate || "");
          const actualsMap = {};
          (imported.subtasks || []).forEach((s, i) => actualsMap[i] = s.actual);
          setActuals(actualsMap);
        } else {
          alert("Invalid task key or format in JSON.");
        }
      } catch (error) {
        alert("Failed to parse JSON.");
      }
    };
    if (event.target.files[0]) fileReader.readAsText(event.target.files[0]);
  };

  const chartData = subtasks.map((sub, i) => ({
    name: sub.name,
    projected: sub.projected,
    actual: Number(actuals[i] || 0)
  }));

  const exportPDF = async () => {
    if (!reportRef.current) return;
    const canvas = await html2canvas(reportRef.current, {
      backgroundColor: "#ffffff",
      useCORS: true,
      ignoreElements: (element) => {
        const style = getComputedStyle(element);
        return style.backgroundColor.includes("oklch");
      }
    });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [canvas.width, canvas.height] });
    pdf.addImage(imgData, "PNG", 0, 0);
    pdf.save(`${customTaskName || selectedTaskKey || "task"}_report.pdf`);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">Task Tracker</h1>

      <div className="flex flex-col sm:flex-row gap-2 items-start">
        <label className="font-semibold">Import JSON:</label>
        <Input type="file" accept="application/json" onChange={importData} className="w-full max-w-xs" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div ref={reportRef} className="bg-white p-4 border rounded space-y-4">
          <label className="block font-semibold">Select Task</label>
          <select
            className="w-full border rounded p-2 text-sm"
            value={selectedTaskKey}
            onChange={(e) => {
              setSelectedTaskKey(e.target.value);
              setActuals({});
            }}
          >
            <option value="">-- Choose a task --</option>
            {Object.keys(TASK_DEFINITIONS).map((task) => (
              <option key={task} value={task}>{task}</option>
            ))}
          </select>

          <Input
            className="text-sm"
            placeholder="Optional custom task name"
            value={customTaskName}
            onChange={(e) => setCustomTaskName(e.target.value)}
          />

          <label className="block font-semibold mt-2">Start Date</label>
          <Input
            type="date"
            className="text-sm"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />

          {subtasks.length > 0 && (
            <div className="space-y-2 mt-4">
              <h2 className="text-lg font-semibold">Subtasks</h2>
              {subtasks.map((sub, i) => (
                <div key={i} className="flex items-center justify-between gap-2 text-sm border p-2 rounded">
                  <div className="flex-1">{sub.name}</div>
                  <div className="w-24 text-right">{sub.projected} days</div>
                  <Input
                    type="number"
                    className="w-24 text-sm"
                    placeholder="Actual"
                    value={actuals[i] || ""}
                    onChange={(e) => handleActualChange(i, e.target.value)}
                  />
                </div>
              ))}

              <div className="flex flex-col gap-2 pt-4">
                <Button onClick={exportData}>Export Task Data</Button>
                <Input type="file" accept="application/json" onChange={importData} />
              </div>
            </div>
          )}
</div>
<div className="bg-white p-4 border rounded">
  <h2 className="text-lg font-semibold mb-2">Comparison Chart</h2>
  <div className="hidden md:block">
    <div style={{ minWidth: 600, height: 400 }} className="mx-auto">
      <BarChart width={600} height={400} data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Bar dataKey="projected" fill="#8884d8" name="Projected" />
        <Bar dataKey="actual" fill="#82ca9d" name="Actual" />
      </BarChart>
    </div>
  </div>
  <div className="block md:hidden" style={{ fontSize: '14px' }}>
    <table className="table-auto w-full border border-gray-300">
      <thead>
        <tr className="bg-gray-100">
          <th className="border px-2 py-1 text-left">Subtask</th>
          <th className="border px-2 py-1 text-right">Projected (days)</th>
          <th className="border px-2 py-1 text-right">Actual (days)</th>
        </tr>
      </thead>
      <tbody>
        {chartData.map((row, idx) => (
          <tr key={idx}>
            <td className="border px-2 py-1">{row.name}</td>
            <td className="border px-2 py-1 text-right">{row.projected}</td>
            <td className="border px-2 py-1 text-right">{row.actual}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
      </div>

      {subtasks.length > 0 && (
        <div className="text-right" hidden="true">
          <Button onClick={exportPDF} className="mt-2">Export PDF Report</Button>
        </div>
      )}
    </div>
  );
}
