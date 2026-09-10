import assert from "node:assert/strict";
import test from "node:test";
import { dayPhase, padTime, bangkokDateISO } from "../lib/bangkok";
import { scheduleFields, scheduleSchema } from "../lib/schedule";

const at = (clock: string) => new Date(`2026-09-10T${clock}+07:00`);

test("minute deadlines switch exactly at the cutoff in Bangkok", () => {
  const before = dayPhase(12, 22, at("12:29:59"), 30, 45);
  assert.equal(before.phase, "submit");
  assert.equal(before.secondsLeft, 1);
  assert.equal(before.nextLabel, "ส่งลิงก์ถึง 12:30");
  assert.equal(dayPhase(12, 22, at("12:30:00"), 30, 45).phase, "click");
  assert.equal(dayPhase(12, 22, at("22:44:59"), 30, 45).secondsLeft, 1);
  assert.equal(dayPhase(12, 22, at("22:45:00"), 30, 45).phase, "closed");
});

test("extending reopens today's round and shortening closes it", () => {
  const now = at("13:15:00");
  assert.equal(dayPhase(12, 22, now).phase, "click");
  assert.equal(dayPhase(13, 22, now, 30).phase, "submit");
  assert.equal(dayPhase(12, 13, now, 0, 10).phase, "closed");
});

test("new rounds start at Thai midnight regardless of UTC date", () => {
  const midnight = new Date("2026-09-09T17:00:00Z");
  assert.equal(bangkokDateISO(midnight), "2026-09-10");
  assert.equal(dayPhase(12, 22, midnight, 30, 45).secondsLeft, 45000);
  assert.equal(dayPhase(12, 22, at("23:59:59"), 30, 45).phase, "closed");
  assert.equal(padTime(9), "09:00");
});

test("rejects invalid, equal, and overnight schedules", () => {
  for (const [submitTime, proofTime] of [["12:30", "12:30"], ["22:00", "12:00"], ["24:00", "24:01"], ["9:00", "22:00"], ["12:60", "22:00"], ["", "22:00"]]) {
    assert.equal(scheduleSchema.safeParse({ submitTime, proofTime }).success, false);
  }
  assert.equal(scheduleSchema.safeParse({ submitTime: "00:00", proofTime: "00:01" }).success, true);
  assert.deepEqual(scheduleFields("12:30", "22:45"), { submitHour: 12, submitMinute: 30, proofHour: 22, proofMinute: 45 });
});
