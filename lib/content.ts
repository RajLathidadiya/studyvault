export type Question = {
  id: string;
  question: string;
  type: "Important" | "Expected" | "Previous Year";
};

export type Chapter = { id: string; name: string; questions: Question[] };

export const chapters: Record<string, Chapter[]> = {
  physics: [
    { id: "current-electricity", name: "Current Electricity", questions: [
      { id: "p1", question: "Explain drift velocity and derive the relation between current and drift velocity.", type: "Important" },
      { id: "p2", question: "State Ohm's law. Discuss the factors affecting resistance of a conductor.", type: "Expected" },
      { id: "p3", question: "A numerical based on Kirchhoff's laws and a two-loop circuit.", type: "Previous Year" },
    ]},
    { id: "electrostatics", name: "Electric Charges and Fields", questions: [
      { id: "p4", question: "State Coulomb's law and explain the principle of superposition.", type: "Important" },
      { id: "p5", question: "Derive the electric field due to a uniformly charged spherical shell.", type: "Expected" },
    ]},
  ],
  chemistry: [{ id: "solutions", name: "Solutions", questions: [
    { id: "c1", question: "Define molarity, molality and mole fraction with suitable examples.", type: "Important" },
    { id: "c2", question: "Explain Raoult's law and its applications.", type: "Expected" },
  ]}],
  mathematics: [{ id: "relations-functions", name: "Relations and Functions", questions: [
    { id: "m1", question: "Define one-one and onto functions with examples.", type: "Important" },
    { id: "m2", question: "Solve a standard board-level problem involving composition of functions.", type: "Previous Year" },
  ]}],
  biology: [{ id: "reproduction", name: "Reproduction", questions: [
    { id: "b1", question: "Explain the process of double fertilisation in flowering plants.", type: "Important" },
    { id: "b2", question: "Describe the menstrual cycle with a labelled flow.", type: "Expected" },
  ]}],
};

export function getChapters(subject: string) { return chapters[subject.toLowerCase()] ?? []; }
export function getChapter(subject: string, chapterId: string) { return getChapters(subject).find((chapter) => chapter.id === chapterId); }
