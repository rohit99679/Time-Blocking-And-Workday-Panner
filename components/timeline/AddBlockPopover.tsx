"use client";

import { useMemo, useState } from "react";

import { useBlockStore } from "@/features/blocks/blockStore";
import { TimeBlock } from "@/features/blocks/types";
import { useWorkHoursStore } from "@/features/settings/workHoursStore";
import { findNextAvailableSlot } from "@/features/blocks/findSlot";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Modal from "../reusable/Modal";
import { fmtHM } from "@/lib/time";
import { TextField } from "../reusable/TextField";
import { FormWrapper } from "../reusable/form-wrapper";
import { NonSearchableSelectField } from "../reusable/NonSearchableSelectField";
import { Button } from "../ui/button";
import { Plus } from "lucide-react";

function uid() {
  return Math.random().toString(16).slice(2);
}

function currentMinutes() {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

const schema = z.object({
  title: z.string().min(2, "Block name is required (min 2 characters)"),
  type: z.enum(["task", "focus", "meeting", "break"]),
  duration: z.number().min(15, "Min 15 minutes").max(240, "Max 240 minutes"),
});

type FormValues = z.infer<typeof schema>;

export default function AddBlockPopover() {
  const { blocks, addBlock } = useBlockStore();
  const { workStartMin, workEndMin } = useWorkHoursStore();

  const [open, setOpen] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      type: "task",
      duration: 60,
    },
    mode: "onChange",
  });

  const duration = form.watch("duration");

  const suggested = useMemo(() => {
    const now = currentMinutes();
    return findNextAvailableSlot({
      blocks,
      desiredStartMin: now,
      durationMin: Number(duration || 60),
      workStartMin,
      workEndMin,
      stepMin: 15,
    });
  }, [blocks, duration, workStartMin, workEndMin]);

  const onSubmit = (values: FormValues) => {
    setSubmitMsg(null);

    if (!suggested) {
      setSubmitMsg("No available slot within working hours.");
      return;
    }

    const b: TimeBlock = {
      id: uid(),
      title: values.title.trim(),
      type: values.type,
      startMin: suggested.startMin,
      endMin: suggested.endMin,
      completed: false,
    };

    addBlock(b);

    setSubmitMsg("Added ✅");
    form.reset({ title: "", type: values.type, duration: values.duration });

    // close after short delay (optional)
    setTimeout(() => {
      setOpen(false);
      setSubmitMsg(null);
    }, 400);
  };

  return (
    <>
      {/* Button that opens modal */}
      <Button
        onClick={() => {
          setSubmitMsg(null);
          setOpen(true);
        }}
      >
        <Plus className="h-4 w-4" />
        Add block
      </Button>

      {/* Modal */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Create time block"
        description="Add a block into the next available slot within your working hours."
        maxWidth="lg"
        overflowAuto
      >
        <FormWrapper
          form={form}
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
        >
          {/* Slot preview */}
          <div className="rounded-xl border p-3 text-sm">
            {suggested ? (
              <div className="text-neutral-700">
                Next available slot: <b>{fmtHM(suggested.startMin)}</b> –{" "}
                <b>{fmtHM(suggested.endMin)}</b>
                <div className="text-xs text-neutral-500 mt-1">
                  Working hours: {fmtHM(workStartMin)} – {fmtHM(workEndMin)}
                </div>
              </div>
            ) : (
              <div className="text-neutral-700">
                No available slot in working hours.
                <div className="text-xs text-neutral-500 mt-1">
                  Try shorter duration or adjust working hours in Settings.
                </div>
              </div>
            )}
          </div>

          {/* Title */}
          <TextField
            placeholder="e.g., Deep work"
            label="Block name"
            name="title"
          />

          {/* Type + Duration */}
          <div className="grid sm:grid-cols-2 gap-4">
            <NonSearchableSelectField
              label="Type"
              name="type"
              options={[
                { value: "task", label: "Task" },
                { value: "focus", label: "Focus" },
                { value: "meeting", label: "Meeting" },
                { value: "break", label: "Break" },
              ]}
            />

            <NonSearchableSelectField
              label="Duration"
              name="duration"
              options={[
                { value: 15, label: "15m" },
                { value: 30, label: "30m" },
                { value: 45, label: "45m" },
                { value: 60, label: "60m" },
                { value: 90, label: "90m" },
                { value: 120, label: "120m" },
                { value: 150, label: "150m" },
                { value: 180, label: "180m" },
              ]}
            />
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={!form.formState.isValid || !suggested}
            >
              Create
            </Button>
          </div>

          {submitMsg ? (
            <div className="text-sm text-neutral-700">{submitMsg}</div>
          ) : null}
        </FormWrapper>
      </Modal>
    </>
  );
}
