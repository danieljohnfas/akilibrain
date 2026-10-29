import Link from 'next/link';
import { NewsletterForm } from '@/components/home/NewsletterForm';
import { CookieSettingsButton } from '@/components/consent/CookieSettingsButton';
import { Logo } from '@/components/shared/Logo';
import { Icon } from '@iconify/react';
import { ShoppingBag, ArrowUpRight } from 'lucide-react';
import { AMAZON_ASSOCIATE_TAG } from '@/lib/amazon-ads/catalog';

const FOOTER_AMAZON_PRODUCTS = [
  { id: 'ab-active-1', title: 'Logitech Zone Vibe 100 Wireless Interview Headset', price: '$89.99', badge: 'Zoom/Teams Mic', url: `https://www.amazon.com/s?k=Logitech+Zone+Vibe+100+wireless+headset&tag=${AMAZON_ASSOCIATE_TAG}` },
  { id: 'ab-active-2', title: 'PMP Exam Prep Simplified (PMBOK 7th Edition)', price: '$42.99', badge: '#1 NGO/UN Cert', url: `https://www.amazon.com/dp/B08SBFTXQT?tag=${AMAZON_ASSOCIATE_TAG}` },
  { id: 'ab-active-3', title: 'Brother ADS-1700W Wireless Duplex Tender Scanner', price: '$229.99', badge: '25ppm Bid Scanner', url: `https://www.amazon.com/s?k=Brother+ADS-1700W+wireless+duplex+document+scanner&tag=${AMAZON_ASSOCIATE_TAG}` },
  { id: 'akil-4', title: 'Logitech C920x HD Pro 1080p Webcam', price: '$59.99', badge: 'Remote Standard', url: `https://www.amazon.com/dp/B006JH8T3S?tag=${AMAZON_ASSOCIATE_TAG}` },
  { id: 'akil-13', title: 'Anker 737 Power Bank 24,000mAh 140W Laptop Backup', price: '$129.99', badge: 'Outage Proof', url: `https://www.amazon.com/s?k=Anker+737+power+bank+24000mAh+140W+fast+charger&tag=${AMAZON_ASSOCIATE_TAG}` },
  { id: 'akil-15', title: 'ASUS ZenScreen 15.6" Full HD Portable USB-C Monitor', price: '$149.00', badge: 'Dual Screen', url: `https://www.amazon.com/dp/B08CVTTNN4?tag=${AMAZON_ASSOCIATE_TAG}` },
  { id: 'akil-11', title: 'Logitech MX Keys Wireless Illuminated Keyboard', price: '$109.99', badge: 'Pro Typing', url: `https://www.amazon.com/dp/B07S92QBCJ?tag=${AMAZON_ASSOCIATE_TAG}` },
  { id: 'akil-12', title: 'Logitech MX Master 3S Wireless Ergonomic Mouse', price: '$99.99', badge: '8K DPI Glass', url: `https://www.amazon.com/dp/B07S395RWD?tag=${AMAZON_ASSOCIATE_TAG}` },
  { id: 'akil-19', title: 'APC 600VA UPS Battery Backup & Surge Protector', price: '$76.99', badge: 'Router & PC UPS', url: `https://www.amazon.com/s?k=APC+UPS+600VA+battery+backup+surge+protector&tag=${AMAZON_ASSOCIATE_TAG}` },
  { id: 'akil-9', title: 'Crucial X9 1TB Portable USB-C SSD (1050MB/s)', price: '$109.99', badge: 'Audit Backup', url: `https://www.amazon.com/s?k=Crucial+X9+1TB+Portable+External+SSD+USB-C&tag=${AMAZON_ASSOCIATE_TAG}` },
  { id: 'akil-22', title: 'Sony WH-1000XM4 Active Noise-Canceling Headphones', price: '$248.00', badge: 'Deep Focus', url: `https://www.amazon.com/dp/B0863TXGM3?tag=${AMAZON_ASSOCIATE_TAG}` },
  { id: 'akil-24', title: 'Yubico YubiKey 5 NFC Two-Factor Hardware Security Key', price: '$50.00', badge: 'Zero-Trust Auth', url: `https://www.amazon.com/s?k=Yubico+YubiKey+5+NFC+security+key&tag=${AMAZON_ASSOCIATE_TAG}` },
];

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black/40 mt-16 backdrop-blur-md">
      {/* Sitewide Amazon Associates Professional & Office Hardware Showcase */}
      <div className="border-b border-white/10 bg-gradient-to-r from-amber-500/[0.06] via-black/30 to-indigo-500/[0.06]" data-amz-slot="footer-tech-marketplace">
        <div className="container mx-auto px-4 py-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5" /> East Africa Remote Work, Tender &amp; Executive Hardware Storefront
              </span>
              <p className="text-xs text-muted-foreground">
                Verified equipment for remote interviews, government tender scanning, power-cut resilience, and international certifications.
              </p>
            </div>
            <a
              href={`https://www.amazon.com/s?k=home+office+remote+work+equipment+headset+scanner+ups&tag=${AMAZON_ASSOCIATE_TAG}`}
              target="_blank"
              rel="sponsored nofollow noopener"
              className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400 hover:text-amber-300 shrink-0"
            >
              Shop Full Office Storefront on Amazon <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {FOOTER_AMAZON_PRODUCTS.map((item) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="sponsored nofollow noopener"
                data-amz-product-id={item.id}
                data-amz-slot="footer-tech-marketplace"
                className="group rounded-lg border border-white/10 bg-white/[0.03] hover:border-amber-400/40 hover:bg-amber-500/[0.05] p-2.5 flex items-center justify-between gap-2 transition-all"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300">
                      {item.badge}
                    </span>
                    <span className="text-[11px] font-mono text-emerald-400 font-semibold">{item.price}</span>
                  </div>
                  <p className="text-xs font-medium text-white/90 group-hover:text-amber-300 truncate">
                    {item.title}
                  </p>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-amber-400 shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16 flex flex-col lg:flex-row justify-between gap-12">
        <div className="space-y-6 max-w-sm">
          <div className="flex items-center space-x-2">
            <Logo className="h-7 w-7" />
            <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">AkiliBrain</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            East Africa&apos;s unified professional intelligence platform.
            Providing critical data for professionals across the region.
          </p>
          <div className="flex items-center gap-4">
            <Link href="https://twitter.com/akilibrain" target="_blank" aria-label="Follow AkiliBrain on Twitter" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:text-primary transition-all">
              <Icon icon="mdi:twitter" className="w-4 h-4 text-white" />
            </Link>
            <Link href="https://linkedin.com/company/akilibrain" target="_blank" aria-label="Follow AkiliBrain on LinkedIn" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:text-primary transition-all">
              <Icon icon="mdi:linkedin" className="w-4 h-4 text-white" />
            </Link>
          </div>
          <p className="text-xs text-muted-foreground/50 border-t border-white/5 pt-4 mt-2">
            Independent platform. Not affiliated with or endorsed by any government body.
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 lg:flex-1">
          <div className="space-y-4">
            <h4 className="font-semibold text-white">Modules</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/tenders" className="hover:text-primary transition-colors flex items-center gap-2">Procurement</Link></li>
              <li><Link href="/jobs" className="hover:text-primary transition-colors flex items-center gap-2">Jobs</Link></li>
              <li><Link href="/compliance" className="hover:text-primary transition-colors flex items-center gap-2">Compliance</Link></li>
              <li><Link href="/health" className="hover:text-primary transition-colors flex items-center gap-2">Health Data</Link></li>
              <li><Link href="/salaries" className="hover:text-primary transition-colors flex items-center gap-2">Salaries</Link></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="font-semibold text-white">Company</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
              <li><Link href="/editorial-policy" className="hover:text-primary transition-colors">Editorial Policy</Link></li>
              <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
          <div className="space-y-4 col-span-2 md:col-span-1">
            <h4 className="font-semibold text-white">Data Sources</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="https://ppra.go.tz" target="_blank" className="hover:text-white transition-colors underline decoration-white/20 underline-offset-4">PPRA (TZ)</Link> / <Link href="https://tenders.go.ke" target="_blank" className="hover:text-white transition-colors underline decoration-white/20 underline-offset-4">PPIP (KE)</Link></li>
              <li><Link href="https://who.int" target="_blank" className="hover:text-white transition-colors underline decoration-white/20 underline-offset-4">WHO AFRO</Link> / World Bank</li>
              <li><Link href="https://brela.go.tz" target="_blank" className="hover:text-white transition-colors underline decoration-white/20 underline-offset-4">BRELA</Link> / <Link href="https://kra.go.ke" target="_blank" className="hover:text-white transition-colors underline decoration-white/20 underline-offset-4">KRA</Link></li>
            </ul>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="space-y-4 max-w-sm w-full bg-white/5 p-6 rounded-2xl border border-white/10">
          <h4 className="font-semibold text-white text-lg">Stay Ahead</h4>
          <p className="text-sm text-muted-foreground">
            Get a weekly digest of the top East African tenders and high-paying jobs.
          </p>
          <NewsletterForm compact />
        </div>
      </div>
      <div className="border-t border-white/5 py-6 text-center text-sm text-muted-foreground bg-black/20 space-y-1">
        <div>
          © {new Date().getFullYear()} AkiliBrain. All rights reserved. · <CookieSettingsButton />
        </div>
        <div className="text-xs text-muted-foreground/60">
          As an Amazon Associate (ID: photoid03-20) AkiliBrain earns from qualifying purchases.
        </div>
      </div>
    </footer>
  );
}
