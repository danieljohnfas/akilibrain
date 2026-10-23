import Link from 'next/link';
import { Send, MessageSquare, Bell, CheckCircle2 } from 'lucide-react';

export function CommunityAlerts() {
  return (
    <section className="container mx-auto px-4 w-full max-w-5xl my-10">
      <div className="rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 via-background to-emerald-500/5 p-6 md:p-10 shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold uppercase tracking-wider">
              <Bell className="w-3.5 h-3.5" />
              <span>Instant Broadcast Channels</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Never Miss a Verified Job or Public Tender
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              Join thousands of East African contractors, engineers, and professionals receiving daily morning digests directly on their phones.
            </p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-medium text-muted-foreground pt-1">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Kenya, TZ, UG &amp; Rwanda</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Free Forever</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> No Spam</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-3 w-full sm:w-auto shrink-0">
            <a
              href="https://whatsapp.com/channel/0029Vb1PZ2Y3WHRu0k9AbX1c"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition-all hover:scale-[1.02]"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Join WhatsApp Channel</span>
            </a>
            <a
              href="https://t.me/akilibrain"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm shadow-md transition-all hover:scale-[1.02]"
            >
              <Send className="w-4 h-4" />
              <span>Join Telegram Alerts</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
