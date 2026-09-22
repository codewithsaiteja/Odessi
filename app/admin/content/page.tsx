"use client";

import React, { useEffect, useState } from "react";
import {
  getAdminHomepageContent,
  updateHomepageSection,
  HomepageSection,
  UpdateHomepageSectionInput,
} from "@/lib/api/content";
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
    key: "BRAND_STORY",
    name: "Brand Story & Heritage",
    description: "Editorial narrative section highlighting the craftsmanship, ethos, and storytelling of Odessi.",
    icon: BookOpen,
  },
];

export default function AdminContentPage() {
  const [sections, setSections] = useState<Record<string, HomepageSection>>({});
  const [activeSectionKey, setActiveSectionKey] = useState<string>("HERO");
  const [formData, setFormData] = useState<UpdateHomepageSectionInput>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
    if (sections[key]) {
      populateForm(sections[key]);
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
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      const updated = await updateHomepageSection(activeSectionKey, formData);
      setSections((prev) => ({
        ...prev,
        [activeSectionKey]: updated,
      }));
      setSuccess(`Section "${activeSectionKey}" updated successfully.`);
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err?.message || "Failed to save section");
    } finally {
      setSaving(false);
    }
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
            Control the luxury storytelling, promotional banners, hero messaging, and brand narratives without code deploys. Changes reflect instantly on the storefront.
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

          <form onSubmit={handleSave} className="space-y-5">
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
                  placeholder="e.g. SS 2026 EDITORIAL or PROMOTIONS"
                  className="w-full px-3 py-2 border border-stone-300 rounded text-xs focus:ring-1 focus:ring-stone-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-stone-600 mb-1 font-semibold">
                  Section Title / Meta
                </label>
                <input
                  type="text"
                  value={formData.title || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Optional section identifier"
                  className="w-full px-3 py-2 border border-stone-300 rounded text-xs focus:ring-1 focus:ring-stone-900 focus:outline-none"
                />
              </div>
            </div>

            {/* Headline */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-stone-600 mb-1 font-semibold">
                Headline (Supports multiline)
              </label>
              <textarea
                rows={activeSectionKey === "ANNOUNCEMENT" ? 2 : 3}
                value={formData.headline || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, headline: e.target.value }))
                }
                placeholder="e.g. WEAR YOUR\nSTORY."
                className="w-full px-3 py-2 border border-stone-300 rounded text-xs focus:ring-1 focus:ring-stone-900 focus:outline-none font-mono"
              />
              <p className="text-[11px] text-stone-400 mt-1">
                Use newlines to separate lines on large screens.
              </p>
            </div>

            {/* Sub-Headline / Body */}
            {activeSectionKey !== "ANNOUNCEMENT" && (
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
              </>
            )}

            {/* Call to Actions (CTAs) */}
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

                {activeSectionKey !== "ANNOUNCEMENT" && (
                  <>
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
                  </>
                )}
              </div>
            </div>

            {/* Media URL */}
            {activeSectionKey !== "ANNOUNCEMENT" && (
              <div className="border-t border-stone-100 pt-4">
                <h4 className="text-xs font-mono uppercase tracking-wider text-stone-600 mb-3 font-bold">
                  Background Visual Media
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-stone-600 mb-1 font-medium">
                        Desktop Media URL
                      </label>
                      <input
                        type="url"
                        value={formData.mediaUrl || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, mediaUrl: e.target.value }))
                        }
                        placeholder="https://..."
                        className="w-full px-3 py-2 border border-stone-300 rounded text-xs focus:ring-1 focus:ring-stone-900 focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-stone-600 mb-1 font-medium">
                        Mobile Media URL (Optional)
                      </label>
                      <input
                        type="url"
                        value={formData.mobileMediaUrl || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            mobileMediaUrl: e.target.value,
                          }))
                        }
                        placeholder="https://..."
                        className="w-full px-3 py-2 border border-stone-300 rounded text-xs focus:ring-1 focus:ring-stone-900 focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  {/* Visual Preview */}
                  <div>
                    <span className="block text-xs text-stone-600 mb-1 font-medium">
                      Visual Preview
                    </span>
                    <div className="w-full h-32 rounded bg-stone-100 border border-stone-200 overflow-hidden relative flex items-center justify-center">
                      {formData.mediaUrl ? (
                        <img
                          src={formData.mediaUrl}
                          alt="Section background preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="flex flex-col items-center text-stone-400">
                          <ImageIcon className="w-6 h-6 mb-1" />
                          <span className="text-[11px]">No image URL configured</span>
                        </div>
                      )}
                    </div>
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
                className="inline-flex items-center space-x-2 px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded text-xs font-bold uppercase tracking-wider shadow-xs transition disabled:opacity-50"
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
