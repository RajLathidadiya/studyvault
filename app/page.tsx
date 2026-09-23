import Link from "next/link";

const boards = [
  { name: "GSEB", title: "Gujarat Board", href: "/gseb" },
  { name: "CBSE", title: "Central Board", href: "/cbse" },
];

const features = [
  ["⭐", "Important Questions", "Chapter-wise questions focused on exam preparation."],
  ["📝", "Question Papers", "Practice with previous and model question papers."],
  ["🎯", "Expected Questions", "High-priority revision material in one place."],
  ["🔐", "Protected Access", "Paid content stays inside your StudyVault account."],
];

export default function Home() {
  return (
    <div>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <span className="eyebrow">CLASS 12 SCIENCE • GSEB + CBSE</span>
            <h1>Prepare smarter.<br /><span>Score better.</span></h1>
            <p className="hero-copy">
              StudyVault brings important questions, question papers and chapter-wise
              preparation material into one focused study platform.
            </p>
            <div className="actions">
              <Link className="btn primary" href="/gseb">Explore GSEB</Link>
              <Link className="btn secondary" href="/cbse">Explore CBSE</Link>
            </div>
          </div>
          <div className="vault-card">
            <div className="vault-top"><span>STUDYVAULT</span><span>12 SCIENCE</span></div>
            <div className="vault-icon">▣</div>
            <h3>Your exam library.</h3>
            <p>Questions. Papers. Revision. All in one vault.</p>
            <div className="mini-row"><span>Physics</span><b>●</b></div>
            <div className="mini-row"><span>Chemistry</span><b>●</b></div>
            <div className="mini-row"><span>Mathematics / Biology</span><b>●</b></div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading">
            <span className="eyebrow">CHOOSE YOUR BOARD</span>
            <h2>Start with your syllabus.</h2>
          </div>
          <div className="board-grid">
            {boards.map((board) => (
              <Link href={board.href} className="board-card" key={board.name}>
                <span>{board.name}</span>
                <div><h3>Class 12 Science</h3><p>{board.title}</p></div>
                <strong>→</strong>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section soft">
        <div className="container">
          <div className="section-heading">
            <span className="eyebrow">WHAT&apos;S INSIDE</span>
            <h2>Everything you need to revise faster.</h2>
          </div>
          <div className="feature-grid">
            {features.map(([icon, title, text]) => (
              <div className="feature-card" key={title}>
                <div className="feature-icon">{icon}</div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cta">
        <div className="container cta-inner">
          <div><span className="eyebrow">STUDYVAULT</span><h2>Build your preparation, one chapter at a time.</h2></div>
          <Link className="btn primary" href="/pricing">View Plans</Link>
        </div>
      </section>
    </div>
  );
}