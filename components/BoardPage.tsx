import Link from "next/link";

const subjects = [
  ["Physics", "Mechanics, electricity, optics & more"],
  ["Chemistry", "Physical, organic & inorganic chemistry"],
  ["Mathematics", "Algebra, calculus, vectors & more"],
  ["Biology", "Botany, zoology, genetics & more"],
];

export function BoardPage({ board }: { board: "GSEB" | "CBSE" }) {
  return (
    <div className="page">
      <div className="container">
        <Link className="back" href="/">← Home</Link>
        <span className="eyebrow">{board} • CLASS 12</span>
        <h1>{board} Science</h1>
        <p className="lead">Choose a subject to explore important questions and question papers.</p>
        <div className="subject-grid">
          {subjects.map(([name, desc], index) => (
            <Link href={`/subjects/${board.toLowerCase()}/${name.toLowerCase().replaceAll(" ", "-")}`} className="subject-card" key={name}>
              <span className="number">0{index + 1}</span>
              <h2>{name}</h2>
              <p>{desc}</p>
              <span className="card-arrow">Explore →</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}