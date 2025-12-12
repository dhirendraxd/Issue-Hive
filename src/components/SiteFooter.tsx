import { Link } from 'react-router-dom';

export default function SiteFooter() {
  return (
    <footer className="px-4 pb-12">
      <div className="mx-auto max-w-6xl rounded-2xl border border-white/60 bg-white/50 backdrop-blur-2xl shadow-lg shadow-orange-100/20 p-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="text-2xl font-semibold select-none">
              Issue<span className="text-orange-600">Hive</span><span className="text-orange-600">.</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Collaborate, discuss, and resolve community issues</p>
          </div>
          <div>
            <div className="font-medium mb-3 text-stone-900">Product</div>
            <ul className="space-y-2 text-sm">
              <li><Link to="/issues" className="text-muted-foreground hover:text-orange-600 transition-colors">Browse Issues</Link></li>
              <li><Link to="/raise-issue" className="text-muted-foreground hover:text-orange-600 transition-colors">Raise Issue</Link></li>
              <li><Link to="/about" className="text-muted-foreground hover:text-orange-600 transition-colors">About</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-medium mb-3 text-stone-900">Legal</div>
            <ul className="space-y-2 text-sm">
              <li><Link to="/terms" className="text-muted-foreground hover:text-orange-600 transition-colors">Terms & Conditions</Link></li>
              <li><Link to="/privacy" className="text-muted-foreground hover:text-orange-600 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms-of-use" className="text-muted-foreground hover:text-orange-600 transition-colors">Terms of Use</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-medium mb-3 text-stone-900">Community</div>
            <ul className="space-y-2 text-sm">
              <li><a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-orange-600 transition-colors">GitHub</a></li>
              <li><a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-orange-600 transition-colors">Twitter</a></li>
              <li><a href="mailto:support@issue-hive.com" className="text-muted-foreground hover:text-orange-600 transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>
        <hr className="my-6 border-white/30" />
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} Issue-Hive — All rights reserved</div>
          <div className="text-xs text-muted-foreground">Powered by the community, for the community</div>
        </div>
      </div>
    </footer>
  );
}
