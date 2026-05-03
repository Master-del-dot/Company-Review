import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Facebook,
  Globe,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Music2,
  Phone,
  Plus,
  Share2,
  Star,
} from "lucide-react";
import { hasSupabaseConfig, supabase } from "./supabase";
import "./styles.css";

const fallbackSettings = {
  logo_url: "",
  business_name: "restroelaichi",
  tagline: "Multi Cuisine Food | Cafe | Bar | Music | Karaoke",
  primary_color: "#03736e",
  page_background_color: "#f5f7f4",
  card_background_color: "transparent",
  heading_color: "#03736e",
  body_text_color: "#52605c",
  button_color: "#111111",
  button_text_color: "#ffffff",
  icon_color: "#03736e",
  accent_color: "#03736e",
  phone: "",
  whatsapp_url: "",
  email: "",
  google_review_url: "",
  facebook_url: "",
  instagram_url: "",
  tiktok_url: "",
  website_url: "",
  whatsapp_icon_url: "",
  facebook_icon_url: "",
  instagram_icon_url: "",
  tiktok_icon_url: "",
  website_icon_url: "",
  address_text: "Shivachowk, Lalitpur 44700",
  google_maps_url: "",
  map_embed_code: "",
  vcf_file_url: "",
  star_rating: 5,
  review_text: "Give us your valuable rating...",
};

function normalizeUrl(value) {
  if (!value) return "";
  if (value.startsWith("http") || value.startsWith("mailto:") || value.startsWith("tel:")) {
    return value;
  }
  return `https://${value}`;
}

function getMapSrc(embedCode) {
  const match = embedCode?.match(/src=["']([^"']+)["']/i);
  return match?.[1] || "";
}

function escapeVcardText(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function downloadVcard(settings) {
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${escapeVcardText(settings.business_name)}`,
    `ORG:${escapeVcardText(settings.business_name)}`,
  ];

  if (settings.phone) lines.push(`TEL;TYPE=WORK,VOICE:${settings.phone}`);
  if (settings.email) lines.push(`EMAIL;TYPE=WORK:${settings.email}`);
  if (settings.address_text) lines.push(`ADR;TYPE=WORK:;;${escapeVcardText(settings.address_text)};;;;`);
  if (settings.website_url) lines.push(`URL:${settings.website_url}`);
  if (settings.tagline) lines.push(`NOTE:${escapeVcardText(settings.tagline)}`);

  lines.push("END:VCARD");

  const blob = new Blob([`${lines.join("\n")}\n`], { type: "text/vcard;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const safeName = String(settings.business_name || "contact").replace(/[^a-z0-9-]+/gi, "-").toLowerCase();
  link.href = url;
  link.download = `${safeName}.vcf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function IconLink({ href, label, children, dark }) {
  if (!href) {
    return (
      <span className={dark ? "quick-icon disabled dark" : "quick-icon disabled"} aria-label={label}>
        {children}
      </span>
    );
  }

  return (
    <a className={dark ? "quick-icon dark" : "quick-icon"} href={href} aria-label={label}>
      {children}
    </a>
  );
}

function SocialLink({ href, label, icon, imageUrl }) {
  return (
    <a className="social-link" href={href || "#"} aria-label={label}>
      {imageUrl ? <img src={imageUrl} alt="" /> : icon}
    </a>
  );
}

function getDynamicIcon(iconName) {
  const iconMap = {
    facebook: <Facebook size={22} />,
    globe: <Globe size={22} />,
    instagram: <Instagram size={22} />,
    mail: <Mail size={22} />,
    phone: <Phone size={22} />,
    tiktok: <Music2 size={22} />,
    whatsapp: <MessageCircle size={22} />,
  };

  return iconMap[String(iconName || "").toLowerCase()] || <ExternalLink size={22} />;
}

function App() {
  const [settings, setSettings] = useState(fallbackSettings);
  const [offers, setOffers] = useState([]);
  const [customLinks, setCustomLinks] = useState([]);
  const [customSections, setCustomSections] = useState([]);
  const [visitorCount, setVisitorCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);
  const [copyLabel, setCopyLabel] = useState("Copy Link");
  const [offerPopupOpen, setOfferPopupOpen] = useState(false);
  const [activeOfferIndex, setActiveOfferIndex] = useState(0);

  useEffect(() => {
    async function loadSite() {
      if (!hasSupabaseConfig) {
        setLoading(false);
        return;
      }

      const [settingsResult, offersResult, linksResult, sectionsResult, analyticsResult] = await Promise.all([
        supabase.from("site_settings").select("*").eq("id", 1).maybeSingle(),
        supabase.from("offers").select("*").eq("active", true).order("created_at", { ascending: false }),
        supabase.from("custom_links").select("*").eq("active", true).order("sort_order", { ascending: true }),
        supabase.from("custom_sections").select("*").eq("active", true).order("sort_order", { ascending: true }),
        supabase.rpc("increment_visitor_count"),
      ]);

      if (settingsResult.data) {
        setSettings({ ...fallbackSettings, ...settingsResult.data });
      }
      if (offersResult.data) {
        setOffers(offersResult.data);
        setOfferPopupOpen(offersResult.data.length > 0);
      }
      if (linksResult.data) {
        setCustomLinks(linksResult.data);
      }
      if (sectionsResult.data) {
        setCustomSections(sectionsResult.data);
      }
      if (typeof analyticsResult.data === "number") {
        setVisitorCount(analyticsResult.data);
      }
      setLoading(false);
    }

    loadSite();
  }, []);

  useEffect(() => {
    if (!offerPopupOpen || offers.length < 2) return undefined;

    const timer = window.setInterval(() => {
      setActiveOfferIndex((index) => (index + 1) % offers.length);
    }, 3500);

    return () => window.clearInterval(timer);
  }, [offerPopupOpen, offers.length]);

  const brandColor = settings.primary_color || fallbackSettings.primary_color;
  const stars = useMemo(
    () => Array.from({ length: Math.max(0, Math.min(Number(settings.star_rating || 5), 5)) }),
    [settings.star_rating],
  );
  const phoneHref = settings.phone ? `tel:${settings.phone}` : "";
  const emailHref = settings.email ? `mailto:${settings.email}` : "";
  const whatsappHref = normalizeUrl(settings.whatsapp_url);
  const mapSrc = getMapSrc(settings.map_embed_code);
  const activeOffer = offers[activeOfferIndex];
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(shareUrl)}`;
  const shareLinks = [
    {
      href: whatsappHref,
      label: "WhatsApp",
      imageUrl: settings.whatsapp_icon_url,
      icon: <MessageCircle size={22} />,
    },
    {
      href: normalizeUrl(settings.facebook_url),
      label: "Facebook",
      imageUrl: settings.facebook_icon_url,
      icon: <Facebook size={22} />,
    },
    {
      href: normalizeUrl(settings.instagram_url),
      label: "Instagram",
      imageUrl: settings.instagram_icon_url,
      icon: <Instagram size={22} />,
    },
    {
      href: normalizeUrl(settings.tiktok_url),
      label: "TikTok",
      imageUrl: settings.tiktok_icon_url,
      icon: <Music2 size={22} />,
    },
    {
      href: normalizeUrl(settings.website_url),
      label: "Website",
      imageUrl: settings.website_icon_url,
      icon: <Globe size={22} />,
    },
    ...customLinks.map((link) => ({
      href: normalizeUrl(link.url),
      label: link.label,
      imageUrl: link.icon_image_url,
      icon: getDynamicIcon(link.icon_name),
    })),
  ].filter((link) => link.href);
  const customStyle = {
    "--brand": brandColor,
    "--page-bg": settings.page_background_color || fallbackSettings.page_background_color,
    "--card-bg": settings.card_background_color || fallbackSettings.card_background_color,
    "--heading": settings.heading_color || brandColor,
    "--body-text": settings.body_text_color || fallbackSettings.body_text_color,
    "--button-bg": settings.button_color || fallbackSettings.button_color,
    "--button-text": settings.button_text_color || fallbackSettings.button_text_color,
    "--icon": settings.icon_color || brandColor,
    "--accent": settings.accent_color || brandColor,
  };

  async function shareSite() {
    if (navigator.share) {
      await navigator.share({
        title: settings.business_name || "Digital Business Card",
        text: settings.tagline || "",
        url: shareUrl,
      });
      return;
    }
    setShareOpen(true);
  }

  async function copyLink() {
    await navigator.clipboard.writeText(shareUrl);
    setCopyLabel("Copied");
    setTimeout(() => setCopyLabel("Copy Link"), 1400);
  }

  return (
    <main className="page" style={customStyle}>
      <section className="business-card">
        <button className="share-button" onClick={() => setShareOpen(true)} type="button" aria-label="Share this website">
          <Share2 size={20} />
        </button>

        <header className="identity">
          <div className="logo-ring">
            {settings.logo_url ? (
              <img src={settings.logo_url} alt={`${settings.business_name} logo`} />
            ) : (
              <span>{settings.business_name?.slice(0, 1) || "R"}</span>
            )}
          </div>
          <h1>{settings.business_name}</h1>
          <p>{settings.tagline}</p>
        </header>

        <nav className="quick-row" aria-label="Quick contact">
          <IconLink href={phoneHref} label="Call">
            <Phone size={22} />
          </IconLink>
          <IconLink href={whatsappHref} label="WhatsApp">
            <MessageCircle size={22} />
          </IconLink>
          <IconLink href={emailHref} label="Email">
            <Mail size={22} />
          </IconLink>
        </nav>

        <section className="rating-block" aria-label="Ratings and reviews">
          <div className="stars">
            {stars.map((_, index) => (
              <Star key={index} size={22} fill="#ffc107" stroke="#ffc107" />
            ))}
          </div>
          <p>{settings.review_text || fallbackSettings.review_text}</p>
          <a className="google-button" href={settings.google_review_url || "#"}>
            <span>G</span>
            Review us on Google
          </a>
        </section>

        <section className="socials" aria-label="Social media">
          <SocialLink href={whatsappHref} label="WhatsApp" imageUrl={settings.whatsapp_icon_url} icon={<MessageCircle size={22} />} />
          <SocialLink href={normalizeUrl(settings.facebook_url)} label="Facebook" imageUrl={settings.facebook_icon_url} icon={<Facebook size={22} />} />
          <SocialLink href={normalizeUrl(settings.instagram_url)} label="Instagram" imageUrl={settings.instagram_icon_url} icon={<Instagram size={22} />} />
          <SocialLink href={normalizeUrl(settings.tiktok_url)} label="TikTok" imageUrl={settings.tiktok_icon_url} icon={<Music2 size={22} />} />
          <SocialLink href={normalizeUrl(settings.website_url)} label="Website" imageUrl={settings.website_icon_url} icon={<Globe size={22} />} />
          {customLinks.map((link) => (
            <SocialLink key={link.id} href={normalizeUrl(link.url)} label={link.label} imageUrl={link.icon_image_url} icon={getDynamicIcon(link.icon_name)} />
          ))}
        </section>

        {customSections.length > 0 && (
          <section className="custom-sections" aria-label="More information">
            {customSections.map((section) => (
              <article className={`custom-section ${section.layout || "card"}`} key={section.id}>
                {section.image_url && <img src={section.image_url} alt="" />}
                <div>
                  {section.title && <h2>{section.title}</h2>}
                  {section.body && <p>{section.body}</p>}
                  {section.button_url && section.button_label && (
                    <a className="section-link" href={normalizeUrl(section.button_url)}>
                      {section.button_label}
                    </a>
                  )}
                </div>
              </article>
            ))}
          </section>
        )}

        <button className="contact-button" onClick={() => downloadVcard(settings)} type="button">
          <Plus size={20} />
          Add to Contact
        </button>

        <section className="location">
          <div className="location-heading">
            <MapPin size={22} />
            <div>
              <h2>Location</h2>
              <p>{settings.address_text}</p>
            </div>
          </div>
          <a className="maps-link" href={settings.google_maps_url || "#"}>
            Open in Maps
          </a>
          <div className="map-frame">
            {mapSrc ? (
              <iframe title="Business location" src={mapSrc} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
            ) : (
              <div className="map-empty">Map preview appears after adding an embed code.</div>
            )}
          </div>
        </section>

        <footer className="visitor-count">
          <span>Total Visitors</span>
          <strong>{loading ? "..." : visitorCount.toLocaleString()}</strong>
        </footer>
      </section>

      {shareOpen && (
        <div className="share-dialog" role="dialog" aria-modal="true" aria-label="Share this website">
          <div className="share-panel">
            <button className="share-close" onClick={() => setShareOpen(false)} type="button" aria-label="Close">
              ×
            </button>
            <div className="share-logo">
              {settings.logo_url ? (
                <img src={settings.logo_url} alt={`${settings.business_name} logo`} />
              ) : (
                <span>{settings.business_name?.slice(0, 1) || "R"}</span>
              )}
            </div>
            <img className="share-qr" src={qrUrl} alt="QR code for this website" />
            <h2>{settings.business_name}</h2>
            {shareLinks.length > 0 && (
              <div className="share-socials" aria-label="Share links">
                {shareLinks.map((link) => (
                  <SocialLink key={`${link.label}-${link.href}`} href={link.href} label={link.label} imageUrl={link.imageUrl} icon={link.icon} />
                ))}
              </div>
            )}
            <div className="share-link-row">
              <p>{shareUrl}</p>
              <button onClick={copyLink} type="button" aria-label="Copy link">
                {copyLabel}
              </button>
            </div>
            {navigator.share && (
              <button className="copy-button" onClick={shareSite} type="button">
                <Share2 size={18} />
                Share
              </button>
            )}
          </div>
        </div>
      )}

      {offerPopupOpen && activeOffer && (
        <div className="offer-popup" role="dialog" aria-modal="true" aria-label="Offers and announcements">
          <section className="offer-popup-panel">
            <button className="offer-close" onClick={() => setOfferPopupOpen(false)} type="button" aria-label="Close offers">
              ×
            </button>
            <div className="offer-slider" style={{ transform: `translateX(-${activeOfferIndex * 100}%)` }}>
              {offers.map((offer) => (
                <article className="offer-slide" key={offer.id}>
                  {offer.image_url && <img src={offer.image_url} alt="" />}
                  <div>
                    <p className="offer-kicker">Offer & Announcement</p>
                    <h2>{offer.title}</h2>
                    <p>{offer.description}</p>
                    {offer.button_label && offer.button_url && (
                      <a className="offer-cta" href={normalizeUrl(offer.button_url)}>
                        {offer.button_label}
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
            {offers.length > 1 && (
              <div className="offer-controls">
                <button
                  type="button"
                  aria-label="Previous offer"
                  onClick={() => setActiveOfferIndex((index) => (index - 1 + offers.length) % offers.length)}
                >
                  <ChevronLeft size={18} />
                </button>
                <div className="offer-dots" aria-label="Offer pages">
                  {offers.map((offer, index) => (
                    <button
                      className={index === activeOfferIndex ? "active" : ""}
                      key={offer.id}
                      type="button"
                      aria-label={`Show offer ${index + 1}`}
                      onClick={() => setActiveOfferIndex(index)}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  aria-label="Next offer"
                  onClick={() => setActiveOfferIndex((index) => (index + 1) % offers.length)}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
