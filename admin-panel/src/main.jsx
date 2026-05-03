import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { ImagePlus, LogOut, Plus, Save, Trash2, UploadCloud } from "lucide-react";
import { hasSupabaseConfig, supabase } from "./supabase";
import "./styles.css";

const defaultSettings = {
  id: 1,
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

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function submit(event) {
    event.preventDefault();
    setMessage("Checking...");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage(error.message);
      return;
    }
    setMessage("");
    onLogin();
  }

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={submit}>
        <div>
          <p className="eyebrow">Admin Panel</p>
          <h1>Sign in</h1>
        </div>
        <label>
          Email
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
        </label>
        <label>
          Password
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required />
        </label>
        <button className="primary-button" type="submit">
          Sign in
        </button>
        {message && <p className="form-message">{message}</p>}
      </form>
    </main>
  );
}

function Field({ label, value, onChange, type = "text", textarea = false }) {
  return (
    <label>
      {label}
      {textarea ? (
        <textarea value={value || ""} onChange={(event) => onChange(event.target.value)} rows={5} />
      ) : (
        <input value={value || ""} onChange={(event) => onChange(event.target.value)} type={type} />
      )}
    </label>
  );
}

function UploadField({ label, path, onUploaded, accept, keepLast = 5 }) {
  const [busy, setBusy] = useState(false);

  async function cleanupOldFiles(currentFilePath) {
    if (!keepLast) return;

    const { data, error } = await supabase.storage.from("site-assets").list(path, {
      limit: 100,
      sortBy: { column: "created_at", order: "desc" },
    });

    if (error || !data) return;

    const files = data
      .filter((item) => item.name && item.id)
      .map((item) => ({
        name: item.name,
        fullPath: `${path}/${item.name}`,
        createdAt: item.created_at || item.updated_at || item.name,
      }))
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));

    const protectedFiles = new Set(files.slice(0, keepLast).map((file) => file.fullPath));
    protectedFiles.add(currentFilePath);

    const oldFiles = files.filter((file) => !protectedFiles.has(file.fullPath)).map((file) => file.fullPath);

    if (oldFiles.length > 0) {
      await supabase.storage.from("site-assets").remove(oldFiles);
    }
  }

  async function upload(file) {
    if (!file) return;
    setBusy(true);
    const safeName = file.name.replace(/[^a-z0-9.\-_]/gi, "-").toLowerCase();
    const filePath = `${path}/${Date.now()}-${safeName}`;
    const { error } = await supabase.storage.from("site-assets").upload(filePath, file, { upsert: true });
    if (error) {
      alert(error.message);
      setBusy(false);
      return;
    }
    const { data } = supabase.storage.from("site-assets").getPublicUrl(filePath);
    onUploaded(data.publicUrl);
    await cleanupOldFiles(filePath);
    setBusy(false);
  }

  return (
    <label className="upload-field">
      <UploadCloud size={18} />
      <span>{busy ? "Uploading..." : label}</span>
      <input type="file" accept={accept} onChange={(event) => upload(event.target.files?.[0])} />
    </label>
  );
}

function Dashboard() {
  const [settings, setSettings] = useState(defaultSettings);
  const [offers, setOffers] = useState([]);
  const [customLinks, setCustomLinks] = useState([]);
  const [customSections, setCustomSections] = useState([]);
  const [analytics, setAnalytics] = useState(0);
  const [status, setStatus] = useState("");
  const [accountStatus, setAccountStatus] = useState("");
  const [accountForm, setAccountForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [newOffer, setNewOffer] = useState({
    title: "",
    description: "",
    image_url: "",
    button_label: "",
    button_url: "",
    active: true,
  });
  const [newLink, setNewLink] = useState({ label: "", url: "", icon_name: "globe", icon_image_url: "", active: true, sort_order: 100 });
  const [newSection, setNewSection] = useState({
    title: "",
    body: "",
    image_url: "",
    button_label: "",
    button_url: "",
    layout: "card",
    active: true,
    sort_order: 100,
  });

  const previewColor = useMemo(() => settings.primary_color || "#03736e", [settings.primary_color]);

  useEffect(() => {
    loadAll();
    supabase.auth.getUser().then(({ data }) => {
      setAccountForm((current) => ({ ...current, email: data.user?.email || "" }));
    });
  }, []);

  async function loadAll() {
    const [settingsResult, offersResult, linksResult, sectionsResult, analyticsResult] = await Promise.all([
      supabase.from("site_settings").select("*").eq("id", 1).maybeSingle(),
      supabase.from("offers").select("*").order("created_at", { ascending: false }),
      supabase.from("custom_links").select("*").order("sort_order", { ascending: true }),
      supabase.from("custom_sections").select("*").order("sort_order", { ascending: true }),
      supabase.from("analytics").select("visitor_count").eq("id", 1).maybeSingle(),
    ]);

    if (settingsResult.data) setSettings({ ...defaultSettings, ...settingsResult.data });
    if (offersResult.data) setOffers(offersResult.data);
    if (linksResult.data) setCustomLinks(linksResult.data);
    if (sectionsResult.data) setCustomSections(sectionsResult.data);
    if (analyticsResult.data) setAnalytics(analyticsResult.data.visitor_count || 0);
  }

  function updateSetting(key, value) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  async function saveSettings() {
    setStatus("Saving...");
    const { error } = await supabase.from("site_settings").upsert(settings).eq("id", 1);
    setStatus(error ? error.message : "Saved.");
  }

  async function addOffer() {
    if (!newOffer.title.trim()) return;
    const { error } = await supabase.from("offers").insert(newOffer);
    if (error) {
      alert(error.message);
      return;
    }
    setNewOffer({ title: "", description: "", image_url: "", button_label: "", button_url: "", active: true });
    loadAll();
  }

  async function updateOffer(id, patch) {
    const nextOffers = offers.map((offer) => (offer.id === id ? { ...offer, ...patch } : offer));
    setOffers(nextOffers);
    const { error } = await supabase.from("offers").update(patch).eq("id", id);
    if (error) alert(error.message);
  }

  async function deleteOffer(id) {
    const { error } = await supabase.from("offers").delete().eq("id", id);
    if (error) {
      alert(error.message);
      return;
    }
    setOffers((current) => current.filter((offer) => offer.id !== id));
  }

  async function addLink() {
    if (!newLink.label.trim() || !newLink.url.trim()) return;
    const { error } = await supabase.from("custom_links").insert(newLink);
    if (error) {
      alert(error.message);
      return;
    }
    setNewLink({ label: "", url: "", icon_name: "globe", icon_image_url: "", active: true, sort_order: 100 });
    loadAll();
  }

  async function updateLink(id, patch) {
    setCustomLinks((current) => current.map((link) => (link.id === id ? { ...link, ...patch } : link)));
    const { error } = await supabase.from("custom_links").update(patch).eq("id", id);
    if (error) alert(error.message);
  }

  async function deleteLink(id) {
    const { error } = await supabase.from("custom_links").delete().eq("id", id);
    if (error) {
      alert(error.message);
      return;
    }
    setCustomLinks((current) => current.filter((link) => link.id !== id));
  }

  async function addSection() {
    if (!newSection.title.trim() && !newSection.body.trim() && !newSection.image_url) return;
    const { error } = await supabase.from("custom_sections").insert(newSection);
    if (error) {
      alert(error.message);
      return;
    }
    setNewSection({
      title: "",
      body: "",
      image_url: "",
      button_label: "",
      button_url: "",
      layout: "card",
      active: true,
      sort_order: 100,
    });
    loadAll();
  }

  async function updateSection(id, patch) {
    setCustomSections((current) => current.map((section) => (section.id === id ? { ...section, ...patch } : section)));
    const { error } = await supabase.from("custom_sections").update(patch).eq("id", id);
    if (error) alert(error.message);
  }

  async function deleteSection(id) {
    const { error } = await supabase.from("custom_sections").delete().eq("id", id);
    if (error) {
      alert(error.message);
      return;
    }
    setCustomSections((current) => current.filter((section) => section.id !== id));
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.reload();
  }

  async function updateAdminAccount(event) {
    event.preventDefault();
    setAccountStatus("Updating...");

    if (accountForm.password && accountForm.password !== accountForm.confirmPassword) {
      setAccountStatus("Passwords do not match.");
      return;
    }

    const updates = {};
    if (accountForm.email.trim()) updates.email = accountForm.email.trim();
    if (accountForm.password) updates.password = accountForm.password;

    if (!updates.email && !updates.password) {
      setAccountStatus("Add an email or password first.");
      return;
    }

    const redirectTo = window.location.href.split("#")[0].split("?")[0];
    const { error } = await supabase.auth.updateUser(updates, {
      emailRedirectTo: redirectTo,
    });

    if (error) {
      setAccountStatus(error.message);
      return;
    }

    setAccountForm((current) => ({ ...current, password: "", confirmPassword: "" }));
    setAccountStatus(
      updates.email
        ? "Updated. If email confirmation is enabled in Supabase, check the new email inbox."
        : "Password updated.",
    );
  }

  return (
    <main className="admin-shell" style={{ "--brand": previewColor }}>
      <header className="topbar">
        <div>
          <p className="eyebrow">Digital Business Card</p>
          <h1>Admin Dashboard</h1>
        </div>
        <button className="ghost-button" onClick={signOut} type="button">
          <LogOut size={18} />
          Sign out
        </button>
      </header>

      <section className="stats-band">
        <div>
          <span>Total Visitors</span>
          <strong>{analytics.toLocaleString()}</strong>
        </div>
        <div>
          <span>Active Offers</span>
          <strong>{offers.filter((offer) => offer.active).length}</strong>
        </div>
        <div>
          <span>Custom Items</span>
          <strong>{customLinks.length + customSections.length}</strong>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h2>Admin Account</h2>
        </div>
        <form className="form-grid" onSubmit={updateAdminAccount}>
          <Field
            label="Admin Email"
            type="email"
            value={accountForm.email}
            onChange={(value) => setAccountForm((current) => ({ ...current, email: value }))}
          />
          <Field
            label="New Password"
            type="password"
            value={accountForm.password}
            onChange={(value) => setAccountForm((current) => ({ ...current, password: value }))}
          />
          <Field
            label="Confirm New Password"
            type="password"
            value={accountForm.confirmPassword}
            onChange={(value) => setAccountForm((current) => ({ ...current, confirmPassword: value }))}
          />
          <label className="form-action-label">
            Save Login Details
            <button className="primary-button" type="submit">
              <Save size={18} />
              Update Account
            </button>
          </label>
        </form>
        {accountStatus && <p className="form-message">{accountStatus}</p>}
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h2>Branding Setup</h2>
          <button className="primary-button" onClick={saveSettings} type="button">
            <Save size={18} />
            Save Settings
          </button>
        </div>
        <div className="form-grid">
          <div className="logo-preview">
            {settings.logo_url ? <img src={settings.logo_url} alt="" /> : <ImagePlus size={34} />}
            <UploadField label="Upload Logo" path="logos" accept="image/*" onUploaded={(url) => updateSetting("logo_url", url)} />
          </div>
          <Field label="Business Name" value={settings.business_name} onChange={(value) => updateSetting("business_name", value)} />
          <Field label="Tagline / Services" value={settings.tagline} onChange={(value) => updateSetting("tagline", value)} />
          <Field label="Primary Brand Color" type="color" value={settings.primary_color} onChange={(value) => updateSetting("primary_color", value)} />
          <Field label="Review Text" value={settings.review_text} onChange={(value) => updateSetting("review_text", value)} />
          <Field label="Star Rating" type="number" value={settings.star_rating} onChange={(value) => updateSetting("star_rating", value)} />
        </div>
      </section>

      <section className="panel">
        <h2>God Level Colors</h2>
        <div className="form-grid color-grid">
          <Field label="Page Background" type="color" value={settings.page_background_color} onChange={(value) => updateSetting("page_background_color", value)} />
          <Field label="Card Background" value={settings.card_background_color} onChange={(value) => updateSetting("card_background_color", value)} />
          <Field label="Heading Text" type="color" value={settings.heading_color} onChange={(value) => updateSetting("heading_color", value)} />
          <Field label="Body Text" type="color" value={settings.body_text_color} onChange={(value) => updateSetting("body_text_color", value)} />
          <Field label="Button Background" type="color" value={settings.button_color} onChange={(value) => updateSetting("button_color", value)} />
          <Field label="Button Text" type="color" value={settings.button_text_color} onChange={(value) => updateSetting("button_text_color", value)} />
          <Field label="Icon Color" type="color" value={settings.icon_color} onChange={(value) => updateSetting("icon_color", value)} />
          <Field label="Accent / Link Color" type="color" value={settings.accent_color} onChange={(value) => updateSetting("accent_color", value)} />
        </div>
      </section>

      <section className="panel">
        <h2>Contact Information</h2>
        <div className="form-grid">
          <Field label="Phone Number" value={settings.phone} onChange={(value) => updateSetting("phone", value)} />
          <Field label="WhatsApp Number / Link" value={settings.whatsapp_url} onChange={(value) => updateSetting("whatsapp_url", value)} />
          <Field label="Email Address" type="email" value={settings.email} onChange={(value) => updateSetting("email", value)} />
          <Field label="Google Review URL" value={settings.google_review_url} onChange={(value) => updateSetting("google_review_url", value)} />
          <UploadField label="Upload VCF Contact File" path="vcf" accept=".vcf,text/vcard" onUploaded={(url) => updateSetting("vcf_file_url", url)} />
        </div>
      </section>

      <section className="panel">
        <h2>Social Media Links</h2>
        <div className="form-grid">
          <Field label="Facebook URL" value={settings.facebook_url} onChange={(value) => updateSetting("facebook_url", value)} />
          <Field label="Instagram URL" value={settings.instagram_url} onChange={(value) => updateSetting("instagram_url", value)} />
          <Field label="TikTok URL" value={settings.tiktok_url} onChange={(value) => updateSetting("tiktok_url", value)} />
          <Field label="Website URL" value={settings.website_url} onChange={(value) => updateSetting("website_url", value)} />
        </div>
        <div className="icon-upload-grid">
          <div className="icon-upload-card">
            {settings.whatsapp_icon_url && <img src={settings.whatsapp_icon_url} alt="" />}
            <UploadField label="Upload WhatsApp Logo" path="social-icons/whatsapp" accept="image/*" onUploaded={(url) => updateSetting("whatsapp_icon_url", url)} />
          </div>
          <div className="icon-upload-card">
            {settings.facebook_icon_url && <img src={settings.facebook_icon_url} alt="" />}
            <UploadField label="Upload Facebook Logo" path="social-icons/facebook" accept="image/*" onUploaded={(url) => updateSetting("facebook_icon_url", url)} />
          </div>
          <div className="icon-upload-card">
            {settings.instagram_icon_url && <img src={settings.instagram_icon_url} alt="" />}
            <UploadField label="Upload Instagram Logo" path="social-icons/instagram" accept="image/*" onUploaded={(url) => updateSetting("instagram_icon_url", url)} />
          </div>
          <div className="icon-upload-card">
            {settings.tiktok_icon_url && <img src={settings.tiktok_icon_url} alt="" />}
            <UploadField label="Upload TikTok Logo" path="social-icons/tiktok" accept="image/*" onUploaded={(url) => updateSetting("tiktok_icon_url", url)} />
          </div>
          <div className="icon-upload-card">
            {settings.website_icon_url && <img src={settings.website_icon_url} alt="" />}
            <UploadField label="Upload Website Logo" path="social-icons/website" accept="image/*" onUploaded={(url) => updateSetting("website_icon_url", url)} />
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h2>Extra Links</h2>
          <button className="primary-button" onClick={addLink} type="button">
            <Plus size={18} />
            Add Link
          </button>
        </div>
        <div className="dynamic-editor">
          <Field label="Label" value={newLink.label} onChange={(value) => setNewLink((link) => ({ ...link, label: value }))} />
          <Field label="URL" value={newLink.url} onChange={(value) => setNewLink((link) => ({ ...link, url: value }))} />
          <label>
            Icon
            <select value={newLink.icon_name} onChange={(event) => setNewLink((link) => ({ ...link, icon_name: event.target.value }))}>
              <option value="globe">Website</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="facebook">Facebook</option>
              <option value="instagram">Instagram</option>
              <option value="tiktok">TikTok</option>
              <option value="phone">Phone</option>
              <option value="mail">Email</option>
              <option value="external">External</option>
            </select>
          </label>
          <Field label="Sort" type="number" value={newLink.sort_order} onChange={(value) => setNewLink((link) => ({ ...link, sort_order: Number(value) }))} />
          <UploadField label="Upload Logo" path="custom-link-icons" accept="image/*" onUploaded={(url) => setNewLink((link) => ({ ...link, icon_image_url: url }))} />
          <label className="toggle-label">
            <input type="checkbox" checked={newLink.active} onChange={(event) => setNewLink((link) => ({ ...link, active: event.target.checked }))} />
            Active
          </label>
        </div>
        <div className="dynamic-list">
          {customLinks.map((link) => (
            <article className="dynamic-row" key={link.id}>
              <input value={link.label || ""} onChange={(event) => updateLink(link.id, { label: event.target.value })} />
              <input value={link.url || ""} onChange={(event) => updateLink(link.id, { url: event.target.value })} />
              <input value={link.icon_name || "globe"} onChange={(event) => updateLink(link.id, { icon_name: event.target.value })} />
              <div className="inline-upload">
                {link.icon_image_url && <img src={link.icon_image_url} alt="" />}
                <UploadField label="Logo" path="custom-link-icons" accept="image/*" onUploaded={(url) => updateLink(link.id, { icon_image_url: url })} />
              </div>
              <input type="number" value={link.sort_order || 0} onChange={(event) => updateLink(link.id, { sort_order: Number(event.target.value) })} />
              <label className="toggle-label">
                <input type="checkbox" checked={link.active} onChange={(event) => updateLink(link.id, { active: event.target.checked })} />
                Active
              </label>
              <button className="danger-button" onClick={() => deleteLink(link.id)} type="button" aria-label="Delete link">
                <Trash2 size={18} />
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>Location Management</h2>
        <div className="form-grid">
          <Field label="Address Text" value={settings.address_text} onChange={(value) => updateSetting("address_text", value)} />
          <Field label="Google Maps URL" value={settings.google_maps_url} onChange={(value) => updateSetting("google_maps_url", value)} />
          <Field label="Map Embed Iframe Code" textarea value={settings.map_embed_code} onChange={(value) => updateSetting("map_embed_code", value)} />
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h2>Offers & Announcements</h2>
          <button className="primary-button" onClick={addOffer} type="button">
            <Plus size={18} />
            Add Offer
          </button>
        </div>
        <div className="offer-editor">
          <Field label="Title" value={newOffer.title} onChange={(value) => setNewOffer((offer) => ({ ...offer, title: value }))} />
          <Field label="Description" value={newOffer.description} onChange={(value) => setNewOffer((offer) => ({ ...offer, description: value }))} />
          <Field label="Button Text" value={newOffer.button_label} onChange={(value) => setNewOffer((offer) => ({ ...offer, button_label: value }))} />
          <Field label="Button Link" value={newOffer.button_url} onChange={(value) => setNewOffer((offer) => ({ ...offer, button_url: value }))} />
          <UploadField label="Upload Offer Image" path="offers" accept="image/*" onUploaded={(url) => setNewOffer((offer) => ({ ...offer, image_url: url }))} />
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={newOffer.active}
              onChange={(event) => setNewOffer((offer) => ({ ...offer, active: event.target.checked }))}
            />
            Active
          </label>
        </div>

        <div className="offers-list">
          {offers.map((offer) => (
            <article className="offer-row" key={offer.id}>
              <input value={offer.title || ""} onChange={(event) => updateOffer(offer.id, { title: event.target.value })} />
              <textarea value={offer.description || ""} onChange={(event) => updateOffer(offer.id, { description: event.target.value })} rows={2} />
              <input value={offer.button_label || ""} onChange={(event) => updateOffer(offer.id, { button_label: event.target.value })} placeholder="Button text" />
              <input value={offer.button_url || ""} onChange={(event) => updateOffer(offer.id, { button_url: event.target.value })} placeholder="Button link" />
              <label className="toggle-label">
                <input type="checkbox" checked={offer.active} onChange={(event) => updateOffer(offer.id, { active: event.target.checked })} />
                Active
              </label>
              <button className="danger-button" onClick={() => deleteOffer(offer.id)} type="button" aria-label="Delete offer">
                <Trash2 size={18} />
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h2>Custom Text / Image Blocks</h2>
          <button className="primary-button" onClick={addSection} type="button">
            <Plus size={18} />
            Add Block
          </button>
        </div>
        <div className="section-editor">
          <Field label="Title" value={newSection.title} onChange={(value) => setNewSection((section) => ({ ...section, title: value }))} />
          <Field label="Text" value={newSection.body} onChange={(value) => setNewSection((section) => ({ ...section, body: value }))} />
          <UploadField label="Upload Block Image" path="sections" accept="image/*" onUploaded={(url) => setNewSection((section) => ({ ...section, image_url: url }))} />
          <Field label="Button Label" value={newSection.button_label} onChange={(value) => setNewSection((section) => ({ ...section, button_label: value }))} />
          <Field label="Button URL" value={newSection.button_url} onChange={(value) => setNewSection((section) => ({ ...section, button_url: value }))} />
          <label>
            Layout
            <select value={newSection.layout} onChange={(event) => setNewSection((section) => ({ ...section, layout: event.target.value }))}>
              <option value="card">Full Card</option>
              <option value="inline">Small Inline</option>
            </select>
          </label>
          <Field label="Sort" type="number" value={newSection.sort_order} onChange={(value) => setNewSection((section) => ({ ...section, sort_order: Number(value) }))} />
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={newSection.active}
              onChange={(event) => setNewSection((section) => ({ ...section, active: event.target.checked }))}
            />
            Active
          </label>
        </div>

        <div className="section-list">
          {customSections.map((section) => (
            <article className="section-row" key={section.id}>
              <input value={section.title || ""} onChange={(event) => updateSection(section.id, { title: event.target.value })} />
              <textarea value={section.body || ""} onChange={(event) => updateSection(section.id, { body: event.target.value })} rows={2} />
              <input value={section.button_label || ""} onChange={(event) => updateSection(section.id, { button_label: event.target.value })} placeholder="Button label" />
              <input value={section.button_url || ""} onChange={(event) => updateSection(section.id, { button_url: event.target.value })} placeholder="Button URL" />
              <select value={section.layout || "card"} onChange={(event) => updateSection(section.id, { layout: event.target.value })}>
                <option value="card">Full Card</option>
                <option value="inline">Small Inline</option>
              </select>
              <input type="number" value={section.sort_order || 0} onChange={(event) => updateSection(section.id, { sort_order: Number(event.target.value) })} />
              <label className="toggle-label">
                <input type="checkbox" checked={section.active} onChange={(event) => updateSection(section.id, { active: event.target.checked })} />
                Active
              </label>
              <button className="danger-button" onClick={() => deleteSection(section.id)} type="button" aria-label="Delete section">
                <Trash2 size={18} />
              </button>
            </article>
          ))}
        </div>
      </section>

      <div className="sticky-save">
        <span>{status}</span>
        <button className="primary-button" onClick={saveSettings} type="button">
          <Save size={18} />
          Save Settings
        </button>
      </div>
    </main>
  );
}

function App() {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!hasSupabaseConfig) return;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  if (!hasSupabaseConfig) {
    return (
      <main className="login-page">
        <section className="login-card">
          <h1>Missing Supabase keys</h1>
          <p className="form-message">Create `.env` from `.env.example` and add your project URL and anon key.</p>
        </section>
      </main>
    );
  }

  if (!ready) return <main className="loading-screen">Loading...</main>;
  return session ? <Dashboard /> : <Login onLogin={() => supabase.auth.getSession().then(({ data }) => setSession(data.session))} />;
}

createRoot(document.getElementById("root")).render(<App />);
