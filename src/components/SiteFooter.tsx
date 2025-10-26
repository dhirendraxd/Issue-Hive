export default function SiteFooter() {
  return (
    <footer className="px-4 pb-12">
      <div className="mx-auto max-w-6xl rounded-2xl border bg-white/90 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="text-2xl font-semibold select-none">
              Issue<span className="text-orange-600">Hive</span><span className="text-orange-600">.</span>
            </div>
          </div>
          <div>
            <div className="font-medium mb-2">Company</div>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li><a href="#about">About</a></li>
              <li><a href="#careers">Report</a></li>
            </ul>
          </div>
          <div>
            <div className="font-medium mb-2">Terms</div>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li><a href="#privacy">Privacy Policy</a></li>
              <li><a href="#terms">Terms of Use</a></li>
            </ul>
          </div>
        </div>
        <hr className="my-6" />
        <div className="text-xs text-muted-foreground">{new Date().getFullYear()} © IssueHive — All rights reserved</div>
      </div>
    </footer>
  );
}
