"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  getAdminHomepageContent,
  updateHomepageSection,
  HomepageSection,
  UpdateHomepageSectionInput,
  FeaturedCollectionCardItem,
  DEFAULT_FEATURED_COLLECTION_CARDS,
  uploadContentImage,
} from "@/lib/api/content";
import { getMediaUrl } from "@/lib/product-utils";
import AdminMediaPicker from "@/components/admin/AdminMediaPicker";
import {
  Sparkles,
  Save,
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  Eye,
  Megaphone,
  BookOpen,
  Image as ImageIcon,
  RefreshCw,
  Sliders,
  LucideIcon,
  Layers,
  Upload,
  Trash2,
  ShieldCheck,
} from "lucide-react";

interface SectionConfig {
  key: string;
  name: string;
  description: string;
  icon: LucideIcon;
}

const KNOWN_SECTIONS: SectionConfig[] = [
  {
    key: "HERO",
    name: "Hero Section",
    description: "Main cinematic showcase above the fold, featuring high-impact headline, imagery, and primary CTA.",
    icon: Sparkles,
  },
  {
    key: "ANNOUNCEMENT",
    name: "Top Announcement Bar",
    description: "Sticky announcement ticker across the top of every page for promotions, drops, and shipping info.",
    icon: Megaphone,
  },
  {
    key: "FEATURED_COLLECTIONS",
    name: "Featured Collections",
    description: "Dark Verse homepage section featuring 3 curated seasonal drop cards with direct links and imagery.",
    icon: Layers,
  },
  {
    key: "BRAND_STORY",
    name: "Brand Story & Heritage",
    description: "Editorial narrative section highlighting the craftsmanship, ethos, and storytelling of Odessi.",
    icon: BookOpen,
  },
  {
    key: "AUTH_PAGE",
    name: "Authentication Editorial Media",
    description: "Managed editorial campaign photography displayed across Sign In, Register, and Account Recovery screens.",
    icon: ShieldCheck,
  },
];

const CARD_POSITION_LABELS = [
  "Card #1: Primary Drop / Main Feature (Large Left)",
  "Card #2: Secondary Drop (Top Right)",
  "Card #3: Tertiary Drop (Bottom Right)",
];

const SUGGESTED_COLLECTIONS = [
  { label: "Dark Verse", url: "/collections/dark-verse" },
  { label: "Monochrome Edit", url: "/collections/monochrome-edit" },
  { label: "Rogue Arc", url: "/collections/rogue-arc" },
  { label: "Gen-Z Archive", url: "/collections/odessi-new-genz-archive" },
];

export default function AdminContentPage() {
  const [sections, setSections] = useState<Record<string, HomepageSection>>({});
  const [activeSectionKey, setActiveSectionKey] = useState<string>("HERO");
  const [formData, setFormData] = useState<UpdateHomepageSectionInput>({});
  const [cards, setCards] = useState<FeaturedCollectionCardItem[]>(DEFAULT_FEATURED_COLLECTION_CARDS);
  const [uploadingCardIndex, setUploadingCardIndex] = useState<number | null>(null);
  const [cardUploadError, setCardUploadError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const populateForm = (section: HomepageSection) => {
    setFormData({
      title: section.title || "",
      eyebrow: section.eyebrow || "",
      headline: section.headline || "",
      subHeadline: section.subHeadline || "",
      body: section.body || "",
      primaryCtaLabel: section.primaryCtaLabel || "",
      primaryCtaUrl: section.primaryCtaUrl || "",
      secondaryCtaLabel: section.secondaryCtaLabel || "",
      secondaryCtaUrl: section.secondaryCtaUrl || "",
      mediaUrl: section.mediaUrl || "",
      mobileMediaUrl: section.mobileMediaUrl || "",
      active: section.active ?? true,
      customPayload: section.customPayload || "",
    });

    if (section.sectionKey === "FEATURED_COLLECTIONS") {
      if (section.customPayload) {
        try {
          const parsed = JSON.parse(section.customPayload);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCards(parsed);
          } else {
            setCards(DEFAULT_FEATURED_COLLECTION_CARDS);
          }
        } catch {
          setCards(DEFAULT_FEATURED_COLLECTION_CARDS);
        }
      } else {
        setCards(DEFAULT_FEATURED_COLLECTION_CARDS);
      }
    }
  };

  const fetchSections = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAdminHomepageContent();
      const map: Record<string, HomepageSection> = {};
      data.forEach((s) => {
        map[s.sectionKey] = s;
      });
      setSections(map);

      // Initialize active section form data
      if (map[activeSectionKey]) {
        populateForm(map[activeSectionKey]);
      } else if (activeSectionKey === "FEATURED_COLLECTIONS") {
        setFormData({
          title: "Dark Verse / Featured Collections",
          eyebrow: "THE LATEST DROP",
          headline: "DARK VERSE",
          subHeadline: "Written in shadows. Worn in light. The Dark Verse collection redefines hero-inspired clothing with heavyweight pieces in deep monochromes.",
          body: "Written in shadows. Worn in light. The Dark Verse collection redefines hero-inspired clothing with heavyweight pieces in deep monochromes.",
          primaryCtaLabel: "VIEW ALL COLLECTIONS",
          primaryCtaUrl: "/collections",
          active: true,
        });
        setCards(DEFAULT_FEATURED_COLLECTION_CARDS);
      } else if (activeSectionKey === "AUTH_PAGE") {
        setFormData({
          title: "Atelier Campaign Visual",
          eyebrow: "ODISSI ATELIER",
          headline: "Silence Speaks in Craft",
          subHeadline: "Quiet Luxury Heritage Campaign",
          body: "",
          primaryCtaLabel: "",
          primaryCtaUrl: "",
          secondaryCtaLabel: "",
          secondaryCtaUrl: "",
          mediaUrl: "",
          mobileMediaUrl: "",
          active: true,
          customPayload: "",
        });
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load homepage sections");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSections();
  }, []);

  const handleSelectSection = (key: string) => {
    setActiveSectionKey(key);
    setSuccess(null);
    setError(null);
    setCardUploadError(null);
    if (sections[key]) {
      populateForm(sections[key]);
    } else {
      if (key === "FEATURED_COLLECTIONS") {
        setFormData({
          title: "Dark Verse / Featured Collections",
          eyebrow: "THE LATEST DROP",
          headline: "DARK VERSE",
          subHeadline: "Written in shadows. Worn in light. The Dark Verse collection redefines hero-inspired clothing with heavyweight pieces in deep monochromes.",
          body: "Written in shadows. Worn in light. The Dark Verse collection redefines hero-inspired clothing with heavyweight pieces in deep monochromes.",
          primaryCtaLabel: "VIEW ALL COLLECTIONS",
          primaryCtaUrl: "/collections",
          secondaryCtaLabel: "",
          secondaryCtaUrl: "",
          mediaUrl: "",
          mobileMediaUrl: "",
          active: true,
          customPayload: JSON.stringify(DEFAULT_FEATURED_COLLECTION_CARDS),
        });
        setCards(DEFAULT_FEATURED_COLLECTION_CARDS);
      } else if (key === "AUTH_PAGE") {
        setFormData({
          title: "Atelier Campaign Visual",
          eyebrow: "ODISSI ATELIER",
          headline: "Silence Speaks in Craft",
          subHeadline: "Quiet Luxury Heritage Campaign",
          body: "",
          primaryCtaLabel: "",
          primaryCtaUrl: "",
          secondaryCtaLabel: "",
          secondaryCtaUrl: "",
          mediaUrl: "",
          mobileMediaUrl: "",
          active: true,
          customPayload: "",
        });
      } else {
        setFormData({
          title: "",
          eyebrow: "",
          headline: "",
          subHeadline: "",
          body: "",
          primaryCtaLabel: "",
          primaryCtaUrl: "",
          secondaryCtaLabel: "",
          secondaryCtaUrl: "",
          mediaUrl: "",
          mobileMediaUrl: "",
          active: true,
          customPayload: "",
        });
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const payloadToSave: UpdateHomepageSectionInput = {
        ...formData,
      };

      if (activeSectionKey === "FEATURED_COLLECTIONS") {
        payloadToSave.customPayload = JSON.stringify(cards);
        if (!payloadToSave.headline) payloadToSave.headline = payloadToSave.title || "DARK VERSE";
        if (!payloadToSave.title) payloadToSave.title = payloadToSave.headline || "Dark Verse / Featured Collections";
        if (!payloadToSave.subHeadline && payloadToSave.body) payloadToSave.subHeadline = payloadToSave.body;
      }

      const updated = await updateHomepageSection(activeSectionKey, payloadToSave);
      setSections((prev) => ({
        ...prev,
        [activeSectionKey]: updated,
      }));
      setSuccess(`Section "${activeMeta.name}" updated successfully.`);
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err?.message || "Failed to save section");
    } finally {
      setSaving(false);
    }
  };

  const handleCardFieldChange = (index: number, field: keyof FeaturedCollectionCardItem, value: any) => {
    setCards((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleCardFileSelected = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingCardIndex(index);
      setCardUploadError(null);
      const res = await uploadContentImage(file);
      if (res && res.url) {
        setCards((prev) => {
          const updated = [...prev];
          updated[index] = { ...updated[index], image: res.url };
          return updated;
        });
        setSuccess(`Image for "${cards[index]?.title || `Card #${index + 1}`}" uploaded successfully.`);
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err: any) {
      setCardUploadError(err?.message || "Failed to upload image. Ensure it is a valid JPG, PNG, or WEBP under 5MB.");
    } finally {
      setUploadingCardIndex(null);
      e.target.value = "";
    }
  };

  const handleRemoveCardImage = (index: number) => {
    setCards((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], image: "" };
      return updated;
    });
  };

  const activeMeta = KNOWN_SECTIONS.find((s) => s.key === activeSectionKey) || {
    key: activeSectionKey,
    name: activeSectionKey,
    description: "Custom homepage section",
    icon: Sliders,
  };

  const ActiveIcon = activeMeta.icon;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-lg border border-stone-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded bg-stone-900 flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-stone-900">
              Homepage Editorial & Content
            </h2>
          </div>
          <p className="text-sm text-stone-500 mt-1.5 max-w-2xl">
            Control the luxury storytelling, promotional banners, featured drop collections, and brand narratives without code deploys. Changes reflect instantly on the storefront.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1.5 px-3 py-1.5 border border-stone-300 text-stone-700 hover:bg-stone-50 text-xs font-semibold rounded transition"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View Live Site</span>
            <ExternalLink className="w-3 h-3 text-stone-400" />
          </a>
          <button
            onClick={fetchSections}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3 py-1.5 border border-stone-300 text-stone-700 hover:bg-stone-50 text-xs font-semibold rounded transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Reload</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded text-emerald-800 text-sm flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700 text-sm flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {cardUploadError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700 text-sm flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{cardUploadError}</span>
        </div>
      )}

      {/* Main Grid: Section Nav + Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Sidebar Nav */}
        <div className="lg:col-span-4 space-y-2">
          <p className="text-xs font-mono uppercase tracking-wider text-stone-400 px-1 mb-2 font-semibold">
            Storefront Sections
          </p>
          {KNOWN_SECTIONS.map((sec) => {
            const Icon = sec.icon;
            const isSelected = activeSectionKey === sec.key;
            const secData = sections[sec.key];
            const isActive = secData ? secData.active : true;

            return (
              <button
                key={sec.key}
                type="button"
                onClick={() => handleSelectSection(sec.key)}
                className={`w-full text-left p-4 rounded-lg border transition-all flex items-start space-x-3.5 ${
                  isSelected
                    ? "bg-white border-stone-900 shadow-xs ring-1 ring-stone-900"
                    : "bg-white border-stone-200 hover:border-stone-300 hover:bg-stone-50/60"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    isSelected
                      ? "bg-stone-900 text-white"
                      : "bg-stone-100 text-stone-600"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-900 truncate">
                      {sec.name}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                        isActive
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-stone-100 text-stone-500 border border-stone-200"
                      }`}
                    >
                      {isActive ? "ACTIVE" : "HIDDEN"}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 mt-1 line-clamp-2 leading-relaxed">
                    {sec.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Section Editor Form */}
        <div className="lg:col-span-8 bg-white border border-stone-200 rounded-lg shadow-2xs p-6">
          <div className="border-b border-stone-100 pb-4 mb-6 flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded bg-stone-100 flex items-center justify-center text-stone-800">
                <ActiveIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900">{activeMeta.name}</h3>
                <p className="text-xs text-stone-500">{activeMeta.description}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <label className="flex items-center space-x-2 text-xs font-semibold text-stone-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.active ?? true}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, active: e.target.checked }))
                  }
                  className="rounded border-stone-300 text-stone-900 focus:ring-stone-900 h-4 w-4"
                />
                <span>Active on Storefront</span>
              </label>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            {/* Eyebrow & Title */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-stone-600 mb-1 font-semibold">
                  Eyebrow Label
                </label>
                <input
                  type="text"
                  value={formData.eyebrow || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, eyebrow: e.target.value }))
                  }
                  placeholder={
                    activeSectionKey === "FEATURED_COLLECTIONS"
                      ? "THE LATEST DROP"
                      : "e.g. SS 2026 EDITORIAL or PROMOTIONS"
                  }
                  className="w-full px-3 py-2 border border-stone-300 rounded text-xs focus:ring-1 focus:ring-stone-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-stone-600 mb-1 font-semibold">
                  Section Headline / Title
                </label>
                <input
                  type="text"
                  value={formData.headline || formData.title || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      headline: e.target.value,
                      title: e.target.value,
                    }))
                  }
                  placeholder={
                    activeSectionKey === "FEATURED_COLLECTIONS"
                      ? "DARK VERSE"
                      : "Section title"
                  }
                  className="w-full px-3 py-2 border border-stone-300 rounded text-xs focus:ring-1 focus:ring-stone-900 focus:outline-none"
                />
              </div>
            </div>

            {/* Description / Subheadline */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-stone-600 mb-1 font-semibold">
                {activeSectionKey === "FEATURED_COLLECTIONS"
                  ? "Section Description / Tagline"
                  : activeSectionKey === "ANNOUNCEMENT"
                  ? "Ticker Announcement Headline"
                  : "Headline (Supports multiline)"}
              </label>
              {activeSectionKey === "FEATURED_COLLECTIONS" ? (
                <textarea
                  rows={2}
                  value={formData.subHeadline || formData.body || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      subHeadline: e.target.value,
                      body: e.target.value,
                    }))
                  }
                  placeholder="Written in shadows. Worn in light. The Dark Verse collection redefines hero-inspired clothing with heavyweight pieces in deep monochromes."
                  className="w-full px-3 py-2 border border-stone-300 rounded text-xs focus:ring-1 focus:ring-stone-900 focus:outline-none"
                />
              ) : (
                <textarea
                  rows={activeSectionKey === "ANNOUNCEMENT" ? 2 : 3}
                  value={formData.headline || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, headline: e.target.value }))
                  }
                  placeholder="e.g. WEAR YOUR\nSTORY."
                  className="w-full px-3 py-2 border border-stone-300 rounded text-xs focus:ring-1 focus:ring-stone-900 focus:outline-none font-mono"
                />
              )}
            </div>

            {/* Standard sections: subHeadline, body, standard CTAs, media */}
            {activeSectionKey !== "ANNOUNCEMENT" && activeSectionKey !== "FEATURED_COLLECTIONS" && (
              <>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-stone-600 mb-1 font-semibold">
                    Sub-Headline / Tagline
                  </label>
                  <input
                    type="text"
                    value={formData.subHeadline || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, subHeadline: e.target.value }))
                    }
                    placeholder="Short complementary narrative"
                    className="w-full px-3 py-2 border border-stone-300 rounded text-xs focus:ring-1 focus:ring-stone-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-stone-600 mb-1 font-semibold">
                    Body Narrative (Supports paragraphs)
                  </label>
                  <textarea
                    rows={4}
                    value={formData.body || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, body: e.target.value }))
                    }
                    placeholder="Editorial body copy. Separate paragraphs with double newlines."
                    className="w-full px-3 py-2 border border-stone-300 rounded text-xs focus:ring-1 focus:ring-stone-900 focus:outline-none"
                  />
                </div>

                {/* Call to Actions */}
                {activeSectionKey !== "AUTH_PAGE" ? (
                  <div className="border-t border-stone-100 pt-4">
                    <h4 className="text-xs font-mono uppercase tracking-wider text-stone-600 mb-3 font-bold">
                      Call to Actions (Buttons)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-stone-600 mb-1 font-medium">
                          Primary CTA Label
                        </label>
                        <input
                          type="text"
                          value={formData.primaryCtaLabel || ""}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, primaryCtaLabel: e.target.value }))
                          }
                          placeholder="e.g. EXPLORE COLLECTION"
                          className="w-full px-3 py-2 border border-stone-300 rounded text-xs focus:ring-1 focus:ring-stone-900 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-stone-600 mb-1 font-medium">
                          Primary CTA URL
                        </label>
                        <input
                          type="text"
                          value={formData.primaryCtaUrl || ""}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, primaryCtaUrl: e.target.value }))
                          }
                          placeholder="e.g. /shop or /collections/cinematic"
                          className="w-full px-3 py-2 border border-stone-300 rounded text-xs focus:ring-1 focus:ring-stone-900 focus:outline-none font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-stone-600 mb-1 font-medium">
                          Secondary CTA Label (Optional)
                        </label>
                        <input
                          type="text"
                          value={formData.secondaryCtaLabel || ""}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              secondaryCtaLabel: e.target.value,
                            }))
                          }
                          placeholder="e.g. OUR STORY"
                          className="w-full px-3 py-2 border border-stone-300 rounded text-xs focus:ring-1 focus:ring-stone-900 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-stone-600 mb-1 font-medium">
                          Secondary CTA URL (Optional)
                        </label>
                        <input
                          type="text"
                          value={formData.secondaryCtaUrl || ""}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              secondaryCtaUrl: e.target.value,
                            }))
                          }
                          placeholder="e.g. /about"
                          className="w-full px-3 py-2 border border-stone-300 rounded text-xs focus:ring-1 focus:ring-stone-900 focus:outline-none font-mono"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border-t border-stone-100 pt-4">
                    <div className="bg-stone-50 border border-stone-200 rounded p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-stone-600">
                      <div>
                        <span className="font-semibold text-stone-800">Storefront Authentication Placement:</span>
                        <p className="mt-0.5 text-stone-500">
                          Changes to these visual assets reflect on <strong>/login</strong>, <strong>/register</strong>, <strong>/forgot-password</strong>, and <strong>/reset-password</strong>.
                        </p>
                      </div>
                      <a
                        href="/login"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 border border-stone-300 text-stone-700 hover:bg-white text-xs font-semibold rounded transition shrink-0"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Live /login</span>
                        <ExternalLink className="w-3 h-3 text-stone-400" />
                      </a>
                    </div>
                  </div>
                )}

                {/* Media Management */}
                <div className="border-t border-stone-100 pt-5 space-y-6">
                  <div>
                    <h4 className="text-xs font-mono uppercase tracking-wider text-stone-900 font-bold">
                      Storefront Visual Media
                    </h4>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Upload high-resolution photography or paste authenticated storage media URLs.
                    </p>
                  </div>

                  {activeSectionKey === "HERO" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                      <AdminMediaPicker
                        label="Hero Desktop Media (16:9)"
                        value={formData.mediaUrl || ""}
                        onChange={(url) => setFormData((prev) => ({ ...prev, mediaUrl: url }))}
                        onUploadFile={async (file) => {
                          const res = await uploadContentImage(file);
                          return res.url;
                        }}
                        onDeleteImage={() => setFormData((prev) => ({ ...prev, mediaUrl: "" }))}
                        recommendedWidth={1920}
                        recommendedHeight={1080}
                        aspectRatio="16:9"
                        maxSizeMb={10}
                        allowedFormats={["JPG", "PNG", "WEBP"]}
                        helperText="Cinematic 100vw desktop visual"
                      />

                      <AdminMediaPicker
                        label="Hero Mobile Media (9:16 Optional)"
                        value={formData.mobileMediaUrl || ""}
                        onChange={(url) => setFormData((prev) => ({ ...prev, mobileMediaUrl: url }))}
                        onUploadFile={async (file) => {
                          const res = await uploadContentImage(file);
                          return res.url;
                        }}
                        onDeleteImage={() => setFormData((prev) => ({ ...prev, mobileMediaUrl: "" }))}
                        recommendedWidth={1080}
                        recommendedHeight={1920}
                        aspectRatio="9:16"
                        maxSizeMb={10}
                        allowedFormats={["JPG", "PNG", "WEBP"]}
                        helperText="Vertical visual for mobile viewports"
                      />
                    </div>
                  ) : activeSectionKey === "AUTH_PAGE" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                      <AdminMediaPicker
                        label="Login Desktop Editorial Media (4:5)"
                        value={formData.mediaUrl || ""}
                        onChange={(url) => setFormData((prev) => ({ ...prev, mediaUrl: url }))}
                        onUploadFile={async (file) => {
                          const res = await uploadContentImage(file);
                          return res.url;
                        }}
                        onDeleteImage={() => setFormData((prev) => ({ ...prev, mediaUrl: "" }))}
                        recommendedWidth={1440}
                        recommendedHeight={1800}
                        aspectRatio="4:5"
                        maxSizeMb={10}
                        allowedFormats={["JPG", "PNG", "WEBP"]}
                        helperText="High-res portrait visual for desktop split-screen auth (50vw)"
                      />

                      <AdminMediaPicker
                        label="Login Mobile Editorial Media (16:9)"
                        value={formData.mobileMediaUrl || ""}
                        onChange={(url) => setFormData((prev) => ({ ...prev, mobileMediaUrl: url }))}
                        onUploadFile={async (file) => {
                          const res = await uploadContentImage(file);
                          return res.url;
                        }}
                        onDeleteImage={() => setFormData((prev) => ({ ...prev, mobileMediaUrl: "" }))}
                        recommendedWidth={1200}
                        recommendedHeight={675}
                        aspectRatio="16:9"
                        maxSizeMb={10}
                        allowedFormats={["JPG", "PNG", "WEBP"]}
                        helperText="Horizontal banner visual for mobile auth screens"
                      />
                    </div>
                  ) : (
                    <AdminMediaPicker
                      label="Brand Story Background Media (16:9)"
                      value={formData.mediaUrl || ""}
                      onChange={(url) => setFormData((prev) => ({ ...prev, mediaUrl: url }))}
                      onUploadFile={async (file) => {
                        const res = await uploadContentImage(file);
                        return res.url;
                      }}
                      onDeleteImage={() => setFormData((prev) => ({ ...prev, mediaUrl: "" }))}
                      recommendedWidth={1920}
                      recommendedHeight={1080}
                      aspectRatio="16:9"
                      maxSizeMb={10}
                      allowedFormats={["JPG", "PNG", "WEBP"]}
                      helperText="Atmospheric editorial background layer"
                    />
                  )}
                </div>
              </>
            )}

            {/* FEATURED_COLLECTIONS SPECIALIZED EDITOR */}
            {activeSectionKey === "FEATURED_COLLECTIONS" && (
              <div className="border-t border-stone-100 pt-5 space-y-6">
                {/* Section CTA configuration */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-stone-50/60 p-4 rounded-lg border border-stone-200">
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-stone-600 mb-1 font-semibold">
                      Section Footer CTA Label
                    </label>
                    <input
                      type="text"
                      value={formData.primaryCtaLabel || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, primaryCtaLabel: e.target.value }))
                      }
                      placeholder="VIEW ALL COLLECTIONS"
                      className="w-full px-3 py-2 border border-stone-300 rounded text-xs bg-white focus:ring-1 focus:ring-stone-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-stone-600 mb-1 font-semibold">
                      Section Footer CTA URL
                    </label>
                    <input
                      type="text"
                      value={formData.primaryCtaUrl || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, primaryCtaUrl: e.target.value }))
                      }
                      placeholder="/collections"
                      className="w-full px-3 py-2 border border-stone-300 rounded text-xs bg-white font-mono focus:ring-1 focus:ring-stone-900 focus:outline-none"
                    />
                  </div>
                </div>

                {/* 3 Drop Cards Editor */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-sm font-bold text-stone-900 uppercase tracking-wide">
                        Curated Drop Cards (3 Featured Items)
                      </h4>
                      <p className="text-xs text-stone-500 mt-0.5">
                        Manage titles, taglines, direct links, and upload high-res imagery directly from your computer.
                      </p>
                    </div>
                    <span className="text-[11px] font-mono bg-stone-100 text-stone-600 px-2 py-1 rounded font-semibold border border-stone-200">
                      3 Cards Total
                    </span>
                  </div>

                  <div className="space-y-5">
                    {cards.map((card, idx) => {
                      const isUploading = uploadingCardIndex === idx;
                      const hasImage = Boolean(card.image && card.image.trim());

                      return (
                        <div
                          key={card.id || `card-${idx}`}
                          className="bg-white border border-stone-200 rounded-lg p-5 shadow-2xs space-y-4 hover:border-stone-300 transition"
                        >
                          {/* Card Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-100 gap-2">
                            <div className="flex items-center space-x-2.5">
                              <span className="w-6 h-6 rounded-full bg-stone-900 text-white text-xs font-bold flex items-center justify-center font-mono">
                                {idx + 1}
                              </span>
                              <div>
                                <h5 className="text-xs font-bold text-stone-900">
                                  {CARD_POSITION_LABELS[idx] || `Card #${idx + 1}`}
                                </h5>
                                <span className="text-[10px] text-stone-400 font-mono">
                                  ID: {card.id || `card-${idx + 1}`}
                                </span>
                              </div>
                            </div>

                            <label className="flex items-center space-x-2 text-xs font-semibold text-stone-700 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={card.active !== false}
                                onChange={(e) =>
                                  handleCardFieldChange(idx, "active", e.target.checked)
                                }
                                className="rounded border-stone-300 text-stone-900 focus:ring-stone-900 h-4 w-4"
                              />
                              <span>Active Card</span>
                            </label>
                          </div>

                          {/* Card Fields Grid */}
                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                            {/* Left: Card Copy & Links (7 cols) */}
                            <div className="lg:col-span-7 space-y-3.5">
                              <div>
                                <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-600 mb-1 font-semibold">
                                  Card Title
                                </label>
                                <input
                                  type="text"
                                  value={card.title || ""}
                                  onChange={(e) =>
                                    handleCardFieldChange(idx, "title", e.target.value)
                                  }
                                  placeholder="e.g. DARK VERSE"
                                  className="w-full px-3 py-2 border border-stone-300 rounded text-xs focus:ring-1 focus:ring-stone-900 focus:outline-none font-bold"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-600 mb-1 font-semibold">
                                  Description / Tagline
                                </label>
                                <textarea
                                  rows={2}
                                  value={card.description || ""}
                                  onChange={(e) =>
                                    handleCardFieldChange(idx, "description", e.target.value)
                                  }
                                  placeholder="Short cinematic description for this drop card"
                                  className="w-full px-3 py-2 border border-stone-300 rounded text-xs focus:ring-1 focus:ring-stone-900 focus:outline-none"
                                />
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-600 mb-1 font-semibold">
                                    Target Collection URL
                                  </label>
                                  <input
                                    type="text"
                                    value={card.collectionUrl || ""}
                                    onChange={(e) =>
                                      handleCardFieldChange(idx, "collectionUrl", e.target.value)
                                    }
                                    placeholder="/collections/..."
                                    className="w-full px-3 py-2 border border-stone-300 rounded text-xs font-mono focus:ring-1 focus:ring-stone-900 focus:outline-none"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-600 mb-1 font-semibold">
                                    Button CTA Label
                                  </label>
                                  <input
                                    type="text"
                                    value={card.ctaLabel || "EXPLORE"}
                                    onChange={(e) =>
                                      handleCardFieldChange(idx, "ctaLabel", e.target.value)
                                    }
                                    placeholder="EXPLORE"
                                    className="w-full px-3 py-2 border border-stone-300 rounded text-xs focus:ring-1 focus:ring-stone-900 focus:outline-none font-semibold"
                                  />
                                </div>
                              </div>

                              {/* Quick Collection Links Suggestion */}
                              <div>
                                <span className="block text-[10px] text-stone-400 font-mono mb-1">
                                  QUICK SUGGESTIONS:
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                  {SUGGESTED_COLLECTIONS.map((sug) => (
                                    <button
                                      key={sug.url}
                                      type="button"
                                      onClick={() => handleCardFieldChange(idx, "collectionUrl", sug.url)}
                                      className="text-[10px] px-2 py-0.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded font-mono transition"
                                    >
                                      {sug.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Right: Card Image & Local Upload (5 cols) */}
                            <div className="lg:col-span-5">
                              <AdminMediaPicker
                                label="Drop Card Visual Media"
                                value={card.image || ""}
                                onChange={(url) => handleCardFieldChange(idx, "image", url)}
                                onUploadFile={async (file) => {
                                  const res = await uploadContentImage(file);
                                  return res.url;
                                }}
                                onDeleteImage={() => handleRemoveCardImage(idx)}
                                recommendedWidth={1200}
                                recommendedHeight={1500}
                                aspectRatio="4:5"
                                maxSizeMb={10}
                                allowedFormats={["JPG", "PNG", "WEBP"]}
                                helperText={`Card #${idx + 1} drop visual (4:5 editorial)`}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Announcement simple fields */}
            {activeSectionKey === "ANNOUNCEMENT" && (
              <div className="border-t border-stone-100 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-stone-600 mb-1 font-medium">
                      Announcement CTA Label
                    </label>
                    <input
                      type="text"
                      value={formData.primaryCtaLabel || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, primaryCtaLabel: e.target.value }))
                      }
                      placeholder="e.g. SHOP NOW"
                      className="w-full px-3 py-2 border border-stone-300 rounded text-xs focus:ring-1 focus:ring-stone-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-stone-600 mb-1 font-medium">
                      Announcement CTA URL
                    </label>
                    <input
                      type="text"
                      value={formData.primaryCtaUrl || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, primaryCtaUrl: e.target.value }))
                      }
                      placeholder="e.g. /shop"
                      className="w-full px-3 py-2 border border-stone-300 rounded text-xs focus:ring-1 focus:ring-stone-900 focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Submit Action */}
            <div className="border-t border-stone-100 pt-5 flex items-center justify-between">
              <span className="text-xs text-stone-400">
                {sections[activeSectionKey]?.updatedAt
                  ? `Last updated: ${new Date(
                      sections[activeSectionKey].updatedAt
                    ).toLocaleString("en-IN")}`
                  : "Unsaved changes"}
              </span>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center space-x-2 px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded text-xs font-bold uppercase tracking-wider shadow-xs transition disabled:opacity-50 cursor-pointer"
              >
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>{saving ? "Saving..." : "Save Section"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
