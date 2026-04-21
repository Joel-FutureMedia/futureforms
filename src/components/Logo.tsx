import logo from "@/assets/logo.png";

export function Logo({ className = "h-8" }: { className?: string }) {
  return <img src={logo} alt="FutureMedia" className={className} />;
}

export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <div className={`${className} rounded-2xl bg-primary flex items-center justify-center shadow-soft`}>
      <span className="h-2.5 w-2.5 rounded-full bg-background" />
    </div>
  );
}
