import { Mail, Phone, MapPin, Send } from "lucide-react";

const ContactSection = () => {
  return (
    <section id="contact" className="section-padding bg-card/50">
      <div className="container mx-auto">
        <h2 className="text-3xl md:text-4xl font-heading font-bold text-center mb-4">
          Get In <span className="text-gradient">Touch</span>
        </h2>
        <div className="w-16 h-1 bg-gradient-primary mx-auto rounded-full mb-12" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Info */}
          <div>
            <h3 className="font-heading font-semibold text-xl mb-6">
              Let's work together
            </h3>
            <p className="text-muted-foreground mb-8">
              I'm currently looking for junior developer opportunities. Feel free to reach out if you'd like to connect or have an opportunity that matches my skills.
            </p>

            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Phone size={20} className="text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="text-foreground font-medium">+63 977 360 2258</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Mail size={20} className="text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-foreground font-medium">andreyahabainza@gmail.com</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MapPin size={20} className="text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="text-foreground font-medium">Carigara, Leyte, Philippines</p>
                </div>
              </div>
            </div>

            {/* References */}
            <div className="mt-10">
              <h4 className="font-heading font-semibold text-sm text-primary mb-4 uppercase tracking-wider">
                References
              </h4>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-foreground font-medium">Mrs. Elvera B. Quilaquil</p>
                  <p className="text-muted-foreground">Head of Entrepreneurship Dept. · elvera.quilaquil@evsu.edu.ph</p>
                </div>
                <div>
                  <p className="text-foreground font-medium">Mrs. Arlene Teodora D. Cebu</p>
                  <p className="text-muted-foreground">Head of IT Dept. · arlene.teodora@evsu.edu.ph</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact form */}
          <form
            className="bg-card border border-border rounded-xl p-6 card-shadow space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              alert("Thank you for your message! I will get back to you soon.");
            }}
          >
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="you@email.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">
                Subject
              </label>
              <input
                type="text"
                required
                className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Job opportunity"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">
                Message
              </label>
              <textarea
                required
                rows={4}
                className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                placeholder="Tell me about the opportunity..."
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-primary text-primary-foreground py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            >
              <Send size={18} />
              Send Message
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
