export interface TaskPreset {
  id: string;
  label: string;
  task: string;
}

export const taskPresets: TaskPreset[] = [
  {
    id: "late-friend",
    label: "10 minutes late",
    task: "Tell my friend I'll be 10 minutes late."
  },
  {
    id: "missed-dinner",
    label: "Missed dinner",
    task: "Write a polite apology for missing dinner."
  },
  {
    id: "one-sentence-meeting",
    label: "Meeting sentence",
    task: "Summarize this meeting in one sentence."
  },
  {
    id: "rename-file",
    label: "Clearer filename",
    task: "Rename this file to something clearer: final_final_notes_v3.txt"
  }
];
