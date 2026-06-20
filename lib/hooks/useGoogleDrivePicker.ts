"use client";
import { useRef, useCallback } from "react";

declare global {
  interface Window {
    gapi: {
      load: (libs: string, cb: () => void) => void;
      client: {
        init: (opts: { apiKey: string; discoveryDocs: string[] }) => Promise<void>;
      };
    };
    google: {
      accounts: {
        oauth2: {
          initTokenClient: (opts: {
            client_id: string;
            scope: string;
            callback: (resp: { access_token?: string; error?: string }) => void;
          }) => { requestAccessToken: () => void };
        };
      };
      picker: {
        PickerBuilder: new () => PickerBuilder;
        DocsView: new (viewId?: string) => DocsView;
        ViewId: { DOCS_IMAGES: string };
        Feature: { MULTISELECT_ENABLED: string };
        Action: { PICKED: string; CANCEL: string };
      };
    };
  }

  interface PickerBuilder {
    addView: (v: DocsView) => PickerBuilder;
    setOAuthToken: (token: string) => PickerBuilder;
    setDeveloperKey: (key: string) => PickerBuilder;
    setTitle: (title: string) => PickerBuilder;
    enableFeature: (f: string) => PickerBuilder;
    setCallback: (cb: (data: PickerData) => void) => PickerBuilder;
    build: () => { setVisible: (v: boolean) => void };
  }

  interface DocsView {
    setIncludeFolders: (v: boolean) => DocsView;
    setMimeTypes: (types: string) => DocsView;
  }

  interface PickerData {
    action: string;
    docs: Array<{ id: string; name: string; mimeType: string }>;
  }
}

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY ?? "";
const SCOPE = "https://www.googleapis.com/auth/drive.readonly";

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

/**
 * Hook that opens the Google Drive Picker and returns selected images
 * after uploading them to /api/canva/assets.
 *
 * Requires NEXT_PUBLIC_GOOGLE_CLIENT_ID and NEXT_PUBLIC_GOOGLE_API_KEY in .env.
 */
export function useGoogleDrivePicker() {
  const tokenRef = useRef<string | null>(null);
  const gapiLoadedRef = useRef(false);

  const openPicker = useCallback(
    async (
      onImported: (assets: Array<{ id: string; url: string; name: string; type: string }>) => void,
      onProgress: (msg: string | null) => void
    ): Promise<void> => {
      if (!CLIENT_ID || !API_KEY) {
        throw new Error(
          "Google Drive is not configured. " +
            "Add NEXT_PUBLIC_GOOGLE_CLIENT_ID and NEXT_PUBLIC_GOOGLE_API_KEY to your .env file."
        );
      }

      // Load gapi and GIS scripts in parallel
      await Promise.all([
        loadScript("https://apis.google.com/js/api.js"),
        loadScript("https://accounts.google.com/gsi/client"),
      ]);

      // Initialise gapi (once)
      if (!gapiLoadedRef.current) {
        await new Promise<void>((resolve) => window.gapi.load("client:picker", resolve));
        await window.gapi.client.init({
          apiKey: API_KEY,
          discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
        });
        gapiLoadedRef.current = true;
      }

      // Get / reuse OAuth2 access token
      const token = await new Promise<string>((resolve, reject) => {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPE,
          callback: (resp) => {
            if (resp.error || !resp.access_token) {
              reject(new Error(resp.error ?? "Google auth failed"));
            } else {
              tokenRef.current = resp.access_token;
              resolve(resp.access_token);
            }
          },
        });
        client.requestAccessToken();
      });

      // Open picker and wait for user selection
      await new Promise<void>((resolve) => {
        const picker = new window.google.picker.PickerBuilder()
          .addView(
            new window.google.picker.DocsView()
              .setIncludeFolders(true)
              .setMimeTypes("image/png,image/jpeg,image/webp,image/svg+xml,image/gif")
          )
          .addView(new window.google.picker.DocsView(window.google.picker.ViewId.DOCS_IMAGES))
          .setOAuthToken(token)
          .setDeveloperKey(API_KEY)
          .setTitle("Select images from Google Drive")
          .enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED)
          .setCallback(async (data: PickerData) => {
            if (data.action === window.google.picker.Action.CANCEL) {
              resolve();
              return;
            }
            if (data.action !== window.google.picker.Action.PICKED) return;

            const docs = data.docs;
            const imported: Array<{ id: string; url: string; name: string; type: string }> = [];

            for (let i = 0; i < docs.length; i++) {
              const doc = docs[i];
              onProgress(`${i + 1} / ${docs.length} — ${doc.name}`);
              try {
                // Download file content from Drive
                const dlRes = await fetch(
                  `https://www.googleapis.com/drive/v3/files/${doc.id}?alt=media`,
                  { headers: { Authorization: `Bearer ${token}` } }
                );
                if (!dlRes.ok) throw new Error(`Drive download failed (${dlRes.status})`);
                const blob = await dlRes.blob();
                const file = new File([blob], doc.name, { type: doc.mimeType });

                // Upload to our asset store
                const fd = new FormData();
                fd.append("file", file);
                fd.append("type", "image");
                const upRes = await fetch("/api/canva/assets", { method: "POST", body: fd });
                let j: { error?: string; asset?: { id: string; url: string; name: string; type: string } };
                try { j = await upRes.json(); } catch { throw new Error(`Upload failed (HTTP ${upRes.status})`); }
                if (!upRes.ok) throw new Error(j.error ?? "Upload failed");
                if (j.asset) imported.push(j.asset);
              } catch (err) {
                console.error(`Google Drive import — ${doc.name}:`, err);
                // continue with remaining files
              }
            }

            onProgress(null);
            onImported(imported);
            resolve();
          })
          .build();

        picker.setVisible(true);
      });
    },
    []
  );

  return openPicker;
}
