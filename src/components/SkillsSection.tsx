const programmingSkills = [
  { name: "JavaScript", level: 80 },
  { name: "PHP", level: 75 },
  { name: "Java", level: 65 },
  { name: "C++", level: 60 },
  { name: "C", level: 55 },
  { name: "Python", level: 70 },
];

const webSkills = [
  { name: "HTML", level: 90 },
  { name: "CSS", level: 85 },
  { name: "Bootstrap", level: 80 },
];

const dbSkills = [
  { name: "MySQL", level: 75 },
  { name: "SQL", level: 70 },
  { name: "Django", level: 55 },
];

const languages = [
  { name: "Tagalog", level: "Native" },
  { name: "English", level: "Professional" },
];

const SkillBar = ({ name, level }: { name: string; level: number }) => (
  <div className="mb-4">
    <div className="flex justify-between mb-1">
      <span className="text-sm font-medium text-foreground">{name}</span>
      <span className="text-xs text-muted-foreground">{level}%</span>
    </div>
    <div className="h-2 bg-secondary rounded-full overflow-hidden">
      <div
        className="h-full bg-gradient-primary rounded-full transition-all duration-1000"
        style={{ width: `${level}%` }}
      />
    </div>
  </div>
);

const SkillsSection = () => {
  return (
    <section id="skills" className="section-padding bg-card/50">
      <div className="container mx-auto">
        <h2 className="text-3xl md:text-4xl font-heading font-bold text-center mb-4">
          Technical <span className="text-gradient">Skills</span>
        </h2>
        <div className="w-16 h-1 bg-gradient-primary mx-auto rounded-full mb-12" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Programming */}
          <div className="bg-card border border-border rounded-xl p-6 card-shadow">
            <h3 className="font-heading font-semibold text-lg text-primary mb-6">
              Programming Languages
            </h3>
            {programmingSkills.map((s) => (
              <SkillBar key={s.name} {...s} />
            ))}
          </div>

          {/* Web */}
          <div className="bg-card border border-border rounded-xl p-6 card-shadow">
            <h3 className="font-heading font-semibold text-lg text-primary mb-6">
              Web Technologies
            </h3>
            {webSkills.map((s) => (
              <SkillBar key={s.name} {...s} />
            ))}
            <div className="mt-8">
              <h3 className="font-heading font-semibold text-lg text-primary mb-6">
                Database
              </h3>
              {dbSkills.map((s) => (
                <SkillBar key={s.name} {...s} />
              ))}
            </div>
          </div>

          {/* Languages & Soft Skills */}
          <div className="bg-card border border-border rounded-xl p-6 card-shadow">
            <h3 className="font-heading font-semibold text-lg text-primary mb-6">
              Languages
            </h3>
            {languages.map((l) => (
              <div
                key={l.name}
                className="flex items-center justify-between py-3 border-b border-border last:border-0"
              >
                <span className="text-foreground font-medium">{l.name}</span>
                <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">
                  {l.level}
                </span>
              </div>
            ))}

            <h3 className="font-heading font-semibold text-lg text-primary mt-8 mb-6">
              Soft Skills
            </h3>
            <div className="flex flex-wrap gap-2">
              {["Problem Solving", "Debugging", "Team Work", "Communication", "Time Management", "Adaptability"].map(
                (s) => (
                  <span
                    key={s}
                    className="text-xs bg-secondary text-secondary-foreground px-3 py-1.5 rounded-full"
                  >
                    {s}
                  </span>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SkillsSection;
