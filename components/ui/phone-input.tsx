"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { PHONE_CODES } from "@/lib/utils/phone-codes";
import { cn } from "@/lib/utils/cn";

function FlagImg({ iso }: { iso: string }) {
  return (
    <img
      src={`https://flagcdn.com/w20/${iso.toLowerCase()}.png`}
      width={20}
      height={15}
      alt={iso}
      className="inline-block object-cover rounded-sm shrink-0"
    />
  );
}

interface PhoneInputProps {
  name?: string;
  defaultValue?: string;
  required?: boolean;
  className?: string;
}

export function PhoneInput({ name = "phone", defaultValue = "", required, className }: PhoneInputProps) {
  const [selectedIso, setSelectedIso] = useState("US");
  const [dialCode, setDialCode] = useState("+1");
  const [number, setNumber] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const combined = number ? `${dialCode}${number.replace(/\s/g, "")}` : "";

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function selectCountry(iso: string, code: string) {
    setSelectedIso(iso);
    setDialCode(code);
    setOpen(false);
  }

  return (
    <div className={cn("flex", className)}>
      <div ref={containerRef} className="relative shrink-0">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Country dial code"
          aria-expanded={open}
          className="flex items-center gap-1.5 h-full rounded-l-md rounded-r-none border border-r-0 border-surface-200 bg-white px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-600"
        >
          <FlagImg iso={selectedIso} />
          <span className="text-surface-700 min-w-[2.5rem] text-left">{dialCode}</span>
          <ChevronDown className={cn("w-3 h-3 text-surface-400 transition-transform", open && "rotate-180")} />
        </button>

        {open && (
          <div className="absolute left-0 top-full z-50 mt-1 max-h-60 w-60 overflow-y-auto rounded-md border border-surface-200 bg-white shadow-lg">
            {PHONE_CODES.map((c) => (
              <button
                key={`${c.iso}-${c.dialCode}`}
                type="button"
                onClick={() => selectCountry(c.iso, c.dialCode)}
                className={cn(
                  "flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-surface-50",
                  selectedIso === c.iso && "bg-brand-50"
                )}
              >
                <FlagImg iso={c.iso} />
                <span className="font-medium text-surface-800 shrink-0">{c.dialCode}</span>
                <span className="text-surface-500 truncate">{c.name}</span>
                {selectedIso === c.iso && (
                  <Check className="ml-auto w-3.5 h-3.5 text-brand-600 shrink-0" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <input
        type="tel"
        value={number}
        onChange={(e) => setNumber(e.target.value)}
        placeholder="000 000 0000"
        required={required}
        className="flex-1 min-w-0 rounded-r-md rounded-l-none border border-surface-200 bg-white px-3 py-2 text-sm text-surface-800 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
      />

      <input type="hidden" name={name} value={combined} />
    </div>
  );
}
