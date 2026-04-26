import { GraduationCap, School } from "lucide-react";

const education = [
  {
    icon: GraduationCap,
    school: "Eastern Visayas State University",
    degree: "Bachelor of Science in Information Technology",
    year: "Expected Graduation: June 2026",
    details: "Focused on software development, web technologies, database management, and system analysis.",
  },
  {
    icon: School,
    school: "Gregorio C. Catenza National High School",
    degree: "Accountancy, Business and Management (ABM)",
    year: "2020 – 2022",
    details: "Gained strong foundation in business principles, accounting, and management.",
  },
];

const EducationSection = () => {
  return (
    <section id="education" className="section-padding">
      <div className="container mx-auto">
        <h2 className="text-3xl md:text-4xl font-heading font-bold text-center mb-4">
          <span className="text-gradient">Education</span>
        </h2>
        <div className="w-16 h-1 bg-gradient-primary mx-auto rounded-full mb-12" />

        <div className="max-w-3xl mx-auto relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border hidden md:block" />

          <div className="space-y-8">
            {education.map((e) => (
              <div key={e.school} className="flex gap-6 items-start">
                <div className="w-12 h-12 flex-shrink-0 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center z-10">
                  <e.icon size={22} className="text-primary" />
                </div>
                <div className="bg-card border border-border rounded-xl p-6 flex-1 card-shadow hover:border-primary/30 transition-colors">
                  <p className="text-xs text-accent font-semibold uppercase tracking-wider mb-1">
                    {e.year}
                  </p>
                  <h3 className="font-heading font-bold text-lg mb-1">{e.school}</h3>
                  <p className="text-primary text-sm font-medium mb-2">{e.degree}</p>
                  <p className="text-muted-foreground text-sm">{e.details}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default EducationSection;
