import { Trophy, Award, Star, Medal } from "lucide-react";
import awardImg from "@/assets/award-placeholder.jpg";

const awards = [
  {
    icon: Trophy,
    title: "Best Capstone Project",
    org: "Eastern Visayas State University",
    year: "2026",
    description: "Recognized for outstanding capstone project in Student Biometric System with SMS Notification.",
  },
  {
    icon: Award,
    title: "Dean's Lister",
    org: "EVSU — College of Engineering",
    year: "2024–2025",
    description: "Consistent academic excellence in the Bachelor of Science in Information Technology program.",
  },
  {
    icon: Star,
    title: "Top Performer — ABM Strand",
    org: "Gregorio C. Catenza National High School",
    year: "2022",
    description: "Graduated with honors in the Accountancy, Business and Management strand.",
  },
];

const AwardsSection = () => {
  return (
    <section id="awards" className="section-padding bg-card/50">
      <div className="container mx-auto">
        <h2 className="text-3xl md:text-4xl font-heading font-bold text-center mb-4">
          Awards & <span className="text-gradient">Achievements</span>
        </h2>
        <div className="w-16 h-1 bg-gradient-primary mx-auto rounded-full mb-12" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto items-start">
          {/* Awards list */}
          <div className="space-y-6">
            {awards.map((a) => (
              <div
                key={a.title}
                className="bg-card border border-border rounded-xl p-6 hover:border-gold/40 transition-colors card-shadow flex gap-4"
              >
                <div className="w-12 h-12 flex-shrink-0 rounded-lg bg-gold/10 flex items-center justify-center">
                  <a.icon size={24} className="text-gold" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-lg">{a.title}</h3>
                  <p className="text-xs text-primary mb-1">{a.org} · {a.year}</p>
                  <p className="text-sm text-muted-foreground">{a.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Achievement image placeholders */}
          <div className="space-y-6">
            <div className="rounded-xl overflow-hidden border border-border card-shadow">
              <img
                src={awardImg}
                alt="Award & Achievement"
                className="w-full h-56 object-cover"
                loading="lazy"
                width={800}
                height={600}
              />
              <div className="p-4 bg-card text-center">
                <p className="text-sm text-muted-foreground">Replace with your award photo</p>
              </div>
            </div>

            {/* More placeholders */}
            <div className="grid grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="bg-card border border-dashed border-border rounded-xl flex flex-col items-center justify-center p-6 min-h-[140px]"
                >
                  <Medal size={28} className="text-muted-foreground mb-2" />
                  <p className="text-xs text-muted-foreground text-center">
                    Achievement Photo {i + 1}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AwardsSection;
