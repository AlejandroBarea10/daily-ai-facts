export default function TerminalFooter() {
  return (
    <footer className="mt-12 pt-8 border-t border-primary/30">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="text-accent">$</span>
          <span>SYSTEM_STATUS: ONLINE</span>
          <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
        </div>

        <div className="text-xs">
          <span className="text-accent">{"["}</span>
          POWERED BY TECH_HISTORY.SYS v1.0
          <span className="text-accent">{"]"}</span>
        </div>

        <a
          href="https://www.linkedin.com/in/alejandro-barea-fuertes/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs hover:text-primary transition-colors"
        >
          <span className="text-accent">{"["}</span>
          CREATED BY <span className="text-primary font-semibold">ALEJANDRO BAREA FUERTES</span>
          <span className="text-accent">{"]"}</span>
        </a>
      </div>
    </footer>
  )
}
