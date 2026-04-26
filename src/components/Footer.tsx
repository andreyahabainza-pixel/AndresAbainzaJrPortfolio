import { Heart } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border py-8 px-4">
      <div className="container mx-auto text-center">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Andres G. Abainza Jr. — Built with{" "}
          <Heart size={14} className="inline text-destructive" /> and code.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
