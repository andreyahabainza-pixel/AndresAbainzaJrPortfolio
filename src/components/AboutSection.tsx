import { Code, Globe, Database, Bug } from "lucide-react";

const highlights = [
  { icon: Code, label: "Programming", desc: "JS, PHP, Java, C++, C, Python" },
  { icon: Globe, label: "Web Dev", desc: "HTML, CSS, Bootstrap" },
  { icon: Database, label: "Database", desc: "MySQL, SQL, Django" },
  { icon: Bug, label: "Debugging", desc: "Problem Solving & QA" },
];

const AboutSection = () => {
  return (
    <section id="about" className="section-padding">
      <div className="container mx-auto">
        <h2 className="text-3xl md:text-4xl font-heading font-bold text-center mb-4">
          About <span className="text-gradient">Me</span>
        </h2>
        <div className="w-16 h-1 bg-gradient-primary mx-auto rounded-full mb-12" />

        <div className="max-w-3xl mx-auto text-center mb-16">
          <p className="text-muted-foreground text-lg leading-relaxed">
            I am a recent IT graduate from{" "}
            <span className="text-foreground font-medium">
              Eastern Visayas State University
            </span>{" "}
            seeking a junior software developer position. I am passionate about
            building efficient and user-friendly applications, with a strong
            foundation in programming, web development, and problem solving. I
            am eager to contribute to a dynamic team and continue learning in
            the tech industry.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {highlights.map((h, i) => (
            <div
              key={h.label}
              className={`bg-card border border-border rounded-xl p-6 text-center hover:border-primary/40 transition-colors card-shadow animate-fade-in-up stagger-${i + 1}`}
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center">
                <h.icon size={28} className="text-primary" />
              </div>
              <h3 className="font-heading font-semibold text-lg mb-1">
                {h.label}
              </h3>
              <p className="text-muted-foreground text-sm">{h.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
