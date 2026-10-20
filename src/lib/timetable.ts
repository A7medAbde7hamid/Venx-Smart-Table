import timetableData from "../../data/timetable.json";
import type { Timetable } from "./types";

export const timetable = timetableData as unknown as Timetable;
