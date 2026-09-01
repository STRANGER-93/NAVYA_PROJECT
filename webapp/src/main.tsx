import { useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

type IconName = "sparkle" | "download" | "arrow" | "calendar" | "heart" | "shield" | "drop" | "mood" | "journal" | "feather" | "phone" | "menu" | "close";

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  const paths: Record<IconName, ReactNode> = {
    sparkle: <><path d="m12 3-1.4 5.6L5 10l5.6 1.4L12 17l1.4-5.6L19 10l-5.6-1.4L12 3Z" /><path d="m19 16-.7 2.3L16 19l2.3.7L19 22l.7-2.3L22 19l-2.3-.7L19 16Z" /></>,
    download: <><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></>,
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
    heart: <path d="M20.8 8.1c0 5-8.8 10.4-8.8 10.4S3.2 13.1 3.2 8.1A4.7 4.7 0 0 1 12 5.9a4.7 4.7 0 0 1 8.8 2.2Z" />,
    shield: <><path d="M12 3 20 6v5c0 5.2-3.4 8.6-8 10-4.6-1.4-8-4.8-8-10V6l8-3Z" /><path d="m8.5 12 2.3 2.3 4.8-5" /></>,
    drop: <path d="M12 3.5S6 10 6 13.5a6 6 0 1 0 12 0C18 10 12 3.5 12 3.5Z" />,
    mood: <><circle cx="12" cy="12" r="9" /><path d="M8 14s1.4 2 4 2 4-2 4-2M8.5 9h.01M15.5 9h.01" /></>,
    journal: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 3v18M12 8h4M12 12h4M12 16h3" /></>,
    feather: <><path d="M20 4C11 4 5 9.4 5 16.5c0 1.5.4 2.6 1 3.5 1.1-3.9 5.2-7.4 11.7-9.5" /><path d="M4 21c4.2-5.2 8.7-8.2 15-10" /></>,
    phone: <><rect x="7" y="2" width="10" height="20" rx="2" /><path d="M11 18h2" /></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>, close: <><path d="m6 6 12 12M18 6 6 18" /></>
  };
  return <svg {...common}>{paths[name]}</svg>;
}

const apkUrl = import.meta.env.VITE_NAVYA_APK_URL || "/navya.apk";
function DownloadLink({ className = "", children }: { className?: string; children: ReactNode }) {
  return <a className={className} href={apkUrl || "#download"} {...(apkUrl ? { download: true } : {})}>{children}</a>;
}
function Logo() {
  return <a className="logo" href="#home" aria-label="NAVYA home">
    <img className="logo-mark" src="/navya-logo.png" alt="NAVYA logo" />
    <span>NAVYA</span>
  </a>;
}

function Nav() {
  const [open, setOpen] = useState(false); const links = ["Home", "About", "Features", "Download"];
  return <header><nav className="nav"><Logo /><div className="desktop-links">{links.map(x => <a href={`#${x.toLowerCase()}`} key={x}>{x}</a>)}<DownloadLink className="button small"><Icon name="download" size={16}/>Download App</DownloadLink></div><button className="menu-button" onClick={() => setOpen(!open)} aria-label="Toggle menu"><Icon name={open ? "close" : "menu"} /></button></nav>{open && <div className="mobile-links">{links.map(x => <a href={`#${x.toLowerCase()}`} key={x} onClick={() => setOpen(false)}>{x}</a>)}<DownloadLink className="button"><Icon name="download" size={16}/>Download App</DownloadLink></div>}</header>
}

function PhoneMockup() {
  return <div className="phone-wrap"><div className="glow one"/><div className="glow two"/><div className="phone"><div className="speaker"/><div className="phone-screen dashboard-screen"><img src="/navya-dashboard.jpg" alt="NAVYA app dashboard" /></div></div></div>;
}

const about = [["calendar", "Cycle clarity", "Log periods and see your cycle at a glance."], ["heart", "Wellness first", "Phase-aware guidance for everyday wellbeing."], ["shield", "Personal & private", "A calm, simple space that belongs to you."]] as const;
const features = [["drop", "Period & Cycle Tracking", "Track menstrual cycles and understand important dates in your cycle."], ["sparkle", "Cycle Prediction", "Get useful predictions based on your previous cycle information."], ["heart", "Wellness Insights", "Understand your current menstrual phase and receive useful wellness information."], ["mood", "Mood Tracking", "Keep track of your moods and receive supportive wellness content."], ["journal", "Personal Journal", "Maintain personal journal entries in a simple and private experience."], ["calendar", "Simple Calendar", "View cycle phases, predicted dates, and important menstrual information through an intuitive calendar."]] as const;
const highlights = [["feather", "Simple to use", "A calm interface with no clutter or confusion."], ["sparkle", "Personalized experience", "Insights shaped by your own cycle."], ["heart", "Everyday wellness", "Support that fits into your daily rhythm."]] as const;

function CardGrid({ items, kind = "card" }: { items: readonly (readonly [IconName, string, string])[]; kind?: "card" | "highlight" }) { return <div className={`cards ${kind}`}>{items.map(([icon, title, text]) => <article className={kind === "card" ? "card" : "highlight-card"} key={title}><span className="icon-box"><Icon name={icon}/></span><h3>{title}</h3><p>{text}</p></article>)}</div>; }
function App() { return <><Nav/><main><section id="home" className="hero"><div className="hero-copy"><span className="eyebrow"><Icon name="sparkle" size={15}/>Period tracking &amp; women's wellness</span><h1>Understand Your <em>Cycle.</em><br/>Care for Yourself <em>Better.</em></h1><p>NAVYA is your personal period tracking and women's wellness companion, designed to help you understand your cycle and stay informed about your wellness.</p><div className="actions"><DownloadLink className="button"><Icon name="download" size={17}/>Download NAVYA</DownloadLink><a className="button secondary" href="#about">Learn More <Icon name="arrow" size={17}/></a></div></div><PhoneMockup/></section><section id="about" className="section"><div className="intro"><h2>What is <em>NAVYA</em>?</h2><p>NAVYA is a women's wellness mobile application focused on making menstrual tracking simple, understandable, and accessible. It combines cycle tracking with useful wellness features in one clean mobile experience.</p></div><CardGrid items={about}/></section><section id="features" className="section feature-section"><div className="intro"><h2>Everything You Need, <em>In One Place</em></h2><p>Thoughtful tools that make tracking feel effortless.</p></div><CardGrid items={features}/></section><section className="section"><div className="intro"><h2>Wellness Should Feel <em>Simple</em></h2><p>NAVYA brings menstrual tracking, cycle awareness, mood support, and personal wellness tools together in one simple application.</p></div><CardGrid items={highlights} kind="highlight"/></section><section id="download" className="download-section"><div className="download-panel"><div className="bubble a"/><div className="bubble b"/><div className="download-content"><h2>Take NAVYA With You</h2><p>Download the NAVYA Android application and start exploring your cycle and wellness journey.</p><DownloadLink className="download-button"><Icon name="phone"/>Download for Android</DownloadLink><small>Android APK</small></div></div></section></main><footer><div><Logo/><p>Your Cycle. Your Wellness. Your NAVYA.</p></div><nav>{["Home", "About", "Features", "Download"].map(x => <a href={`#${x.toLowerCase()}`} key={x}>{x}</a>)}</nav><small>© 2026 NAVYA. All rights reserved.</small></footer></> }

createRoot(document.getElementById("root")!).render(<App/>);
