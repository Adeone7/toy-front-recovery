import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ChevronDownIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { useEffect, useRef, useState } from "react";
import { getJobs } from "@/api/jobi-api";
import { Checkbox } from "@/components/ui/checkbox";

export function ScenarioDialog() {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(() => new Date());
  const [jobs, setJobs] = useState([]);
  const [scenario, setScenario] = useState({
    description: "",
    jobIds: [],
    scheduleDate: new Date().toISOString(),
    scheduleTime: "09:00:00",
  });
  const formRef = useRef();
  const submitHandle = async (evt) => {
    console.log(new Date().toISOString());
    const scheduleAt =
      scenario.scheduleDate.split("T")[0] + "T" + scenario.scheduleTime;
    const response = await fetch(
      `http://${process.env.NEXT_PUBLIC_APS_SERVER_ADDRESS}:8080/api/scenarios`,
      {
        method: "POST",
        headers: {
          "Content-type": "application/json",
        },
        body: JSON.stringify({ ...scenario, scheduleAt }),
      }
    );
    const json = await response.json();
    window.alert(json.created.id);
  };

  useEffect(() => {
    getJobs().then((json) => setJobs(json.jobs));
  }, []);

  return (
    <Dialog>
      <form ref={formRef}>
        <div className="flex justify-end">
          <DialogTrigger asChild>
            <Button variant="outline">
              <Plus />
              New Scenario
            </Button>
          </DialogTrigger>
        </div>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>시나리오 생성</DialogTitle>
            <DialogDescription>
              시뮬레이팅할 시나리오를 설계하세요.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-3">
              <Label htmlFor="name-1">시나리오 상세</Label>
              <Input
                id="name-1"
                name="description"
                placeholder="시나리오 상세"
                onChange={(e) => {
                  setScenario({ ...scenario, description: e.target.value });
                }}
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="username-1">포함시킬 작업</Label>

              <div className="flex flex-col gap-2">
                {jobs.map((one) => (
                  <div key={one.id} className="flex items-start gap-3">
                    <Checkbox
                      id={one.id}
                      name="jobId"
                      value={one.id}
                      onCheckedChange={(flag) => {
                        const jobIds = flag
                          ? [...scenario.jobIds, one.id]
                          : scenario.jobIds.filter((id) => id !== one.id);

                        setScenario({ ...scenario, jobIds });
                      }}
                    />
                    <div className="grid gap-2">
                      <Label htmlFor={one.id}>{one.name}</Label>
                      <p className="text-muted-foreground text-sm">
                        {one.description}{" "}
                        <span>({one.tasks.length} 개 작업)</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-3">
              <Label htmlFor="username-1">시뮬레이팅 작업 시작 시간</Label>
              <div className="flex gap-4">
                <div className="flex flex-col gap-3">
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        id="date-picker"
                        className="w-32 justify-between font-normal"
                      >
                        {date ? date.toLocaleDateString() : "Select date"}
                        <ChevronDownIcon />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto overflow-hidden p-0"
                      align="start"
                    >
                      <Calendar
                        mode="single"
                        selected={date}
                        captionLayout="dropdown"
                        onSelect={(date) => {
                          setDate(date);
                          setOpen(false);
                          setScenario({
                            ...scenario,
                            scheduleDate: date.toISOString(),
                          });
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex flex-col gap-3">
                  <Input
                    type="time"
                    id="time-picker"
                    step="1"
                    defaultValue={scenario.scheduleTime}
                    onChange={(e) =>
                      setScenario({ ...scenario, scheduleTime: e.target.value })
                    }
                    className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">취소</Button>
            </DialogClose>
            <Button
              type="submit"
              className="cursor-pointer"
              onClick={submitHandle}
            >
              생성
            </Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}
