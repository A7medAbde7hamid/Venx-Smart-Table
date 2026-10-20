export type Week = "W1" | "W2";

export type Day = "sat" | "sun" | "mon" | "tue" | "wed" | "thu" | "fri";

export type SessionType = "lecture" | "section";

export interface Session {
  id: string;
  courseId: string;
  courseName: string;
  type: SessionType;
  week: Week;
  day: Day;
  start: string;
  end: string;
  instructor: string;
  room: string;
  sections: number[];
}

export interface MaintenanceWindow {
  id: string;
  day: Day;
  room: string;
  note?: string;
}

export interface Timetable {
  version: number;
  term: string;
  sessions: Session[];
  maintenance: MaintenanceWindow[];
}
