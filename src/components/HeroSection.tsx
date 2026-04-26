import { MapPin, Download } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import profileImg from "@/assets/profile-placeholder.jpg";

const HeroSection = () => {
  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Background */}
      <img
        src={heroBg}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        width={1920}
        height={1080}
      />
      <div className="absolute inset-0 bg-background/70" />

      <div className="relative container mx-auto flex flex-col-reverse md:flex-row items-center gap-12 py-32 px-4">
        {/* Text */}
        <div className="flex-1 text-center md:text-left animate-fade-in-up">
          <p className="text-primary font-semibold tracking-widest uppercase text-sm mb-3">
            Junior Software Developer
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold leading-tight mb-4">
            Hi, I'm{" "}
            <span className="text-gradient">Andres G. Abainza Jr.</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-lg mb-6">
            A passionate IT graduate eager to build efficient, user-friendly
            applications. Strong foundation in web development, programming, and
            problem solving.
          </p>
          <div className="flex items-center justify-center md:justify-start gap-2 text-muted-foreground text-sm mb-8">
            <MapPin size={16} className="text-primary" />
            Carigara, Leyte, Philippines
          </div>
          <div className="flex flex-wrap gap-4 justify-center md:justify-start">
            <a
              href="#contact"
              className="bg-gradient-primary text-primary-foreground px-7 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              Get In Touch
            </a>
            <a
              href="#projects"
              className="border border-border text-foreground px-7 py-3 rounded-lg font-semibold hover:bg-secondary transition-colors"
            >
              View Projects
            </a>
          </div>
        </div>

        {/* Profile Image */}
        <div className="flex-shrink-0 animate-fade-in-up stagger-2">
          <div className="relative">
            <div className="w-56 h-56 md:w-72 md:h-72 rounded-full overflow-hidden border-4 border-primary/30 animate-pulse-glow">
              <img
                src={profileImg}
                alt="Andres G. Abainza Jr."
                className="w-full h-full object-cover"
                width={600}
                height={600}
              />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-accent text-accent-foreground rounded-full px-3 py-1 text-xs font-bold">
              Open to Work
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float">
        <div className="w-6 h-10 border-2 border-primary/40 rounded-full flex items-start justify-center p-1">
          <div className="w-1.5 h-3 bg-primary rounded-full animate-bounce" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
