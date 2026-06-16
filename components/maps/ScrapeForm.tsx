"use client";

import { useState } from "react";
import { Plus, X, ChevronDown, Search, Loader2, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/cn";
import type { ScrapeInput } from "@/lib/validations/maps";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "ms", label: "Malay" },
  { code: "zh", label: "Chinese" },
  { code: "id", label: "Indonesian" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "ja", label: "Japanese" },
];

const inputCls =
  "flex h-9 w-full rounded-md border border-surface-200 bg-white px-3 py-1 text-sm text-surface-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-600";

interface ScrapeFormProps {
  onSubmit: (input: ScrapeInput) => Promise<void>;
  busy?: boolean;
}

const num = (s: string): number | undefined => (s.trim() === "" ? undefined : Number(s));

export function ScrapeForm({ onSubmit, busy }: ScrapeFormProps) {
  const [queries, setQueries] = useState<string[]>([""]);
  const [location, setLocation] = useState("");
  const [maxResults, setMaxResults] = useState(50);
  const [language, setLanguage] = useState("en");

  const [coords, setCoords] = useState({ north: "", south: "", east: "", west: "" });
  const [proxy, setProxy] = useState({ enabled: false, server: "", username: "", password: "" });

  // Use case
  const [preOpening, setPreOpening] = useState({ detect: false, onlyNew: false });

  // Add-ons
  const [addOns, setAddOns] = useState({
    placeDetails: false,
    contacts: false,
    leads: false,
    reviews: false,
    maxReviews: 20,
    images: false,
    maxImages: 10,
  });
  const [filters, setFilters] = useState({
    categories: "",
    minStars: "",
    minReviews: "",
    maxReviews: "",
    skipClosedPlaces: false,
    titleMustMatch: false,
  });
  const [geo, setGeo] = useState({
    country: "", state: "", city: "", postalCode: "", lat: "", lng: "", zoom: "", radiusKm: "",
  });
  const [startUrlsText, setStartUrlsText] = useState("");
  const [withoutTerms, setWithoutTerms] = useState(false);

  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const section = (key: string) => ({
    open: !!open[key],
    onToggle: () => setOpen((o) => ({ ...o, [key]: !o[key] })),
  });

  function updateQuery(i: number, value: string) {
    setQueries((q) => q.map((v, idx) => (idx === i ? value : v)));
  }

  async function handleSubmit() {
    setError(null);
    const cleaned = queries.map((q) => q.trim()).filter(Boolean);
    const startUrls = startUrlsText.split(/[\n,]/).map((s) => s.trim()).filter(Boolean);
    const categories = filters.categories.split(",").map((s) => s.trim()).filter(Boolean);

    const hasSource = cleaned.length || startUrls.length || (withoutTerms && categories.length);
    if (!hasSource) {
      setError("Add a search term, a Google Maps URL/place ID, or enable area-only scraping with a category.");
      return;
    }

    const hasCoords = coords.north && coords.south && coords.east && coords.west;
    const geoObj = {
      country: geo.country.trim() || undefined,
      state: geo.state.trim() || undefined,
      city: geo.city.trim() || undefined,
      postalCode: geo.postalCode.trim() || undefined,
      lat: num(geo.lat), lng: num(geo.lng), zoom: num(geo.zoom), radiusKm: num(geo.radiusKm),
    };
    const anyGeo = Object.values(geoObj).some((v) => v !== undefined);

    const filtersObj = {
      categories: categories.length ? categories : undefined,
      minStars: num(filters.minStars),
      minReviews: num(filters.minReviews),
      maxReviews: num(filters.maxReviews),
      skipClosedPlaces: filters.skipClosedPlaces || undefined,
      titleMustMatch: filters.titleMustMatch || undefined,
    };
    const anyFilter = Object.values(filtersObj).some((v) => v !== undefined);

    const addOnsObj = {
      placeDetails: addOns.placeDetails || undefined,
      contacts: addOns.contacts || undefined,
      leads: addOns.leads || undefined,
      reviews: addOns.reviews || undefined,
      maxReviews: addOns.reviews ? addOns.maxReviews : undefined,
      images: addOns.images || undefined,
      maxImages: addOns.images ? addOns.maxImages : undefined,
    };
    const anyAddOn = addOns.placeDetails || addOns.contacts || addOns.leads || addOns.reviews || addOns.images;

    const payload: ScrapeInput = {
      searchQueries: cleaned,
      location: location.trim() || undefined,
      coordinates: hasCoords
        ? { north: Number(coords.north), south: Number(coords.south), east: Number(coords.east), west: Number(coords.west) }
        : null,
      language,
      maxResults: Math.max(1, Math.min(500, maxResults || 50)),
      proxy: proxy.enabled
        ? { enabled: true, server: proxy.server.trim() || undefined, username: proxy.username.trim() || undefined, password: proxy.password || undefined }
        : undefined,
      startUrls: startUrls.length ? startUrls : undefined,
      searchWithoutTerms: withoutTerms || undefined,
      geolocation: anyGeo ? geoObj : undefined,
      filters: anyFilter ? filtersObj : undefined,
      addOns: anyAddOn ? addOnsObj : undefined,
      preOpening: preOpening.detect ? { detect: true, onlyNew: preOpening.onlyNew || undefined } : undefined,
    };

    try {
      await onSubmit(payload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start the run.");
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Search className="w-4 h-4 text-brand-600" />
          New extraction run
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Search terms */}
        <div className="space-y-2">
          <Label>Search term(s)</Label>
          <div className="space-y-2">
            {queries.map((q, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input value={q} placeholder="e.g. restaurant" onChange={(e) => updateQuery(i, e.target.value)} className="flex-1" />
                <button
                  type="button"
                  onClick={() => setQueries((qs) => (qs.length === 1 ? qs : qs.filter((_, idx) => idx !== i)))}
                  disabled={queries.length === 1}
                  className="p-2 rounded-md text-surface-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30 transition-colors"
                  aria-label="Remove term"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setQueries((q) => [...q, ""])}>
            <Plus className="w-3.5 h-3.5" />
            Add
          </Button>
        </div>

        {/* Pre-opening detection (the use case) */}
        <div className="rounded-lg border border-brand-200 bg-brand-50/50 p-3">
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={preOpening.detect}
              onChange={(e) => setPreOpening((p) => ({ ...p, detect: e.target.checked }))}
              className="mt-0.5 rounded border-surface-300"
            />
            <span>
              <span className="flex items-center gap-1.5 text-sm font-semibold text-brand-800">
                <Sparkles className="w-4 h-4" /> Find pre-opening / newly-opened businesses
              </span>
              <span className="block text-xs text-surface-600 mt-0.5">
                Flags places with 0 reviews that are unclaimed or use temporary wording (&quot;opening soon&quot;,
                &quot;coming soon&quot;…). Opens each place for detail, so runs are slower.
              </span>
            </span>
          </label>
          {preOpening.detect && (
            <label className="flex items-center gap-2 mt-2 ml-6 text-xs text-surface-700 select-none">
              <input
                type="checkbox"
                checked={preOpening.onlyNew}
                onChange={(e) => setPreOpening((p) => ({ ...p, onlyNew: e.target.checked }))}
                className="rounded border-surface-300"
              />
              Only keep flagged (pre-opening) results
            </label>
          )}
        </div>

        {/* Location + count + language */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label>Location</Label>
            <Input value={location} placeholder="New York, USA" onChange={(e) => setLocation(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Number of places (per term)</Label>
            <Input type="number" min={1} max={500} value={maxResults} onChange={(e) => setMaxResults(parseInt(e.target.value, 10) || 0)} />
          </div>
          <div className="space-y-1.5">
            <Label>Language</Label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} className={inputCls}>
              {LANGUAGES.map((l) => (<option key={l.code} value={l.code}>{l.label}</option>))}
            </select>
          </div>
        </div>

        {/* ── Add-on accordions (mirror Apify) ────────────────────────────── */}

        <Collapsible {...section("filters")} title="🔍 Search filters & categories">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Categories (comma-separated)">
              <Input value={filters.categories} placeholder="cafe, bakery" onChange={(e) => setFilters((f) => ({ ...f, categories: e.target.value }))} />
            </Field>
            <Field label="Min stars">
              <input type="number" step="0.1" min={0} max={5} className={inputCls} value={filters.minStars} onChange={(e) => setFilters((f) => ({ ...f, minStars: e.target.value }))} />
            </Field>
            <Field label="Min reviews"><input type="number" min={0} className={inputCls} value={filters.minReviews} onChange={(e) => setFilters((f) => ({ ...f, minReviews: e.target.value }))} /></Field>
            <Field label="Max reviews"><input type="number" min={0} className={inputCls} value={filters.maxReviews} onChange={(e) => setFilters((f) => ({ ...f, maxReviews: e.target.value }))} /></Field>
          </div>
          <CheckRow checked={filters.skipClosedPlaces} onChange={(v) => setFilters((f) => ({ ...f, skipClosedPlaces: v }))} label="Skip permanently/temporarily closed places" />
          <CheckRow checked={filters.titleMustMatch} onChange={(v) => setFilters((f) => ({ ...f, titleMustMatch: v }))} label="Title must contain the search term" />
        </Collapsible>

        <Collapsible {...section("details")} title="📌 Additional place details scraping">
          <CheckRow checked={addOns.placeDetails} onChange={(v) => setAddOns((a) => ({ ...a, placeDetails: v }))} label="Open each place for full details (claimed status, description, plus-code, accurate reviews)" />
        </Collapsible>

        <Collapsible {...section("contacts")} title="🏢 Company contacts enrichment">
          <CheckRow checked={addOns.contacts} onChange={(v) => setAddOns((a) => ({ ...a, contacts: v }))} label="Scrape emails & social profiles from each business website" />
        </Collapsible>

        <Collapsible {...section("leads")} title="👥 Business leads enrichment">
          <CheckRow checked={addOns.leads} onChange={(v) => setAddOns((a) => ({ ...a, leads: v }))} label="Enrich leads from the business website" />
          <p className="text-xs text-surface-500 mt-1">
            Note: derived from each business&apos;s own website (emails/socials). True third-party B2B
            decision-maker data isn&apos;t available without a paid provider.
          </p>
        </Collapsible>

        <Collapsible {...section("reviews")} title="⭐ Reviews">
          <CheckRow checked={addOns.reviews} onChange={(v) => setAddOns((a) => ({ ...a, reviews: v }))} label="Scrape individual reviews" />
          {addOns.reviews && (
            <Field label="Max reviews per place" className="mt-2 max-w-[12rem]">
              <input type="number" min={1} max={100} className={inputCls} value={addOns.maxReviews} onChange={(e) => setAddOns((a) => ({ ...a, maxReviews: parseInt(e.target.value, 10) || 1 }))} />
            </Field>
          )}
        </Collapsible>

        <Collapsible {...section("images")} title="🖼️ Images">
          <CheckRow checked={addOns.images} onChange={(v) => setAddOns((a) => ({ ...a, images: v }))} label="Scrape place photo URLs" />
          {addOns.images && (
            <Field label="Max images per place" className="mt-2 max-w-[12rem]">
              <input type="number" min={1} max={50} className={inputCls} value={addOns.maxImages} onChange={(e) => setAddOns((a) => ({ ...a, maxImages: parseInt(e.target.value, 10) || 1 }))} />
            </Field>
          )}
        </Collapsible>

        <Collapsible {...section("geo")} title="🛰️ Define the search area by geolocation parameters">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(["country", "state", "city", "postalCode"] as const).map((k) => (
              <Field key={k} label={k === "postalCode" ? "Postal code" : k[0].toUpperCase() + k.slice(1)}>
                <Input value={geo[k]} onChange={(e) => setGeo((g) => ({ ...g, [k]: e.target.value }))} />
              </Field>
            ))}
            {(["lat", "lng", "zoom", "radiusKm"] as const).map((k) => (
              <Field key={k} label={k === "radiusKm" ? "Radius (km)" : k.toUpperCase()}>
                <input type="number" step="any" className={inputCls} value={geo[k]} onChange={(e) => setGeo((g) => ({ ...g, [k]: e.target.value }))} />
              </Field>
            ))}
          </div>
        </Collapsible>

        <Collapsible {...section("urls")} title="🔗 Scrape with Google Maps URLs or place IDs">
          <Label>One URL or place ID per line</Label>
          <textarea
            value={startUrlsText}
            onChange={(e) => setStartUrlsText(e.target.value)}
            rows={3}
            placeholder={"https://www.google.com/maps/place/...\nChIJ...\n0x...:0x..."}
            className={cn(inputCls, "h-auto py-2 font-mono text-xs mt-1")}
          />
        </Collapsible>

        <Collapsible {...section("noterms")} title="🧭 Scrape places without search terms">
          <CheckRow checked={withoutTerms} onChange={setWithoutTerms} label="Scrape an area by category only (uses the categories from Search filters above)" />
        </Collapsible>

        {/* Coordinates bbox */}
        <Collapsible {...section("coords")} title="Coordinates bounding box (optional)">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(["north", "south", "east", "west"] as const).map((dir) => (
              <Field key={dir} label={dir[0].toUpperCase() + dir.slice(1)}>
                <input type="number" step="any" value={coords[dir]} onChange={(e) => setCoords((c) => ({ ...c, [dir]: e.target.value }))} className={inputCls} placeholder={dir === "north" || dir === "south" ? "lat" : "lng"} />
              </Field>
            ))}
          </div>
        </Collapsible>

        {/* Proxy */}
        <Collapsible {...section("proxy")} title="Proxy configuration (optional)">
          <CheckRow checked={proxy.enabled} onChange={(v) => setProxy((p) => ({ ...p, enabled: v }))} label="Route requests through a rotating residential proxy" />
          <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-3 mt-2", !proxy.enabled && "opacity-50")}>
            <div className="space-y-1.5 md:col-span-3">
              <Label>Proxy server</Label>
              <Input value={proxy.server} disabled={!proxy.enabled} placeholder="http://gate.provider.com:7000" onChange={(e) => setProxy((p) => ({ ...p, server: e.target.value }))} />
            </div>
            <div className="space-y-1.5"><Label>Username</Label><Input value={proxy.username} disabled={!proxy.enabled} onChange={(e) => setProxy((p) => ({ ...p, username: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Password</Label><Input type="password" value={proxy.password} disabled={!proxy.enabled} onChange={(e) => setProxy((p) => ({ ...p, password: e.target.value }))} /></div>
          </div>
          <p className="mt-2 text-xs text-surface-500">The password is used for this run only and is never stored.</p>
        </Collapsible>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end">
          <Button onClick={handleSubmit} disabled={busy}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {busy ? "Starting…" : "Start extraction"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function CheckRow({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-start gap-2 text-sm text-surface-700 select-none cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 rounded border-surface-300" />
      {label}
    </label>
  );
}

function Collapsible({ open, onToggle, title, children }: { open: boolean; onToggle: () => void; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-surface-200">
      <button type="button" onClick={onToggle} className="flex items-center justify-between w-full px-4 py-2.5 text-sm font-medium text-surface-700">
        {title}
        <ChevronDown className={cn("w-4 h-4 text-surface-400 transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="px-4 pb-4 space-y-2">{children}</div>}
    </div>
  );
}
