import { ExternalLink } from "lucide-react";
import projectBiometric from "@/assets/project-biometric.jpg";
import projectInternship from "@/assets/project-internship.jpg";

const projects = [
  {
    title: "Student Biometric System with SMS Notification",
    subtitle: "Capstone Project · 2025–2026",
    image: projectBiometric,
    description:
      "A web-based attendance tracking system with biometric login, dashboard features for students, and SMS notifications for parents.",
    tech: ["PHP", "MySQL", "Bootstrap", "SMS API"],
    bullets: [
      "Developed web-based attendance tracking",
      "Built login and dashboard features",
      "Integrated SMS notifications for parents",
    ],
  },
  {
    title: "IT Intern — EVSU Office",
    subtitle: "Internship · 2026",
    image: projectInternship,
    description:
      "Assisted in troubleshooting hardware and software issues, supported system maintenance and updates at the university's IT department.",
    tech: ["Hardware", "Networking", "System Maintenance"],
    bullets: [
      "Troubleshot hardware and software issues",
      "Supported system maintenance and updates",
    ],
  },
];

const ProjectsSection = () => {
  return (
    <section id="projects" className="section-padding">
      <div className="container mx-auto">
        <h2 className="text-3xl md:text-4xl font-heading font-bold text-center mb-4">
          Projects & <span className="text-gradient">Experience</span>
        </h2>
        <div className="w-16 h-1 bg-gradient-primary mx-auto rounded-full mb-12" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {projects.map((p) => (
            <div
              key={p.title}
              className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/40 transition-all card-shadow group"
            >
              <div className="relative overflow-hidden h-52">
                <img
                  src={p.image}
                  alt={p.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  width={800}
                  height={600}
                />
                <div className="absolute inset-0 bg-background/40 group-hover:bg-background/20 transition-colors" />
              </div>
              <div className="p-6">
                <p className="text-xs text-primary font-semibold uppercase tracking-wider mb-1">
                  {p.subtitle}
                </p>
                <h3 className="text-xl font-heading font-bold mb-2">
                  {p.title}
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  {p.description}
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 mb-4">
                  {p.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap gap-2">
                  {p.tech.map((t) => (
                    <span
                      key={t}
                      className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-md font-medium"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Placeholder for more projects */}
        <div className="mt-8 max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-card border border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center min-h-[200px] hover:border-primary/40 transition-colors"
              >
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-3">
                  <ExternalLink size={24} className="text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-sm font-medium">
                  Project {i + 2}
                </p>
                <p className="text-xs text-muted-foreground/60">Coming Soon</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProjectsSection;
