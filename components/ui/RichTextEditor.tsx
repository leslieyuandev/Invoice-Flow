"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Extension } from "@tiptap/core";
import { cn } from "@/lib/utils/cn";

// Lightweight font-size extension that piggybacks on TextStyle
const FontSize = Extension.create({
  name: "fontSize",
  addGlobalAttributes() {
    return [{
      types: ["textStyle"],
      attributes: {
        fontSize: {
          default: null,
          parseHTML: (el: HTMLElement) => el.style.fontSize || null,
          renderHTML: (attrs: { fontSize?: string | null }) => {
            if (!attrs.fontSize) return {};
            return { style: `font-size: ${attrs.fontSize}` };
          },
        },
      },
    }];
  },
});

const FONT_SIZES = ["8px", "9px", "10px", "11px", "12px", "14px", "16px", "20px"];

const TOOLBAR_COLORS = [
  { label: "White", value: "#FFFFFF" },
  { label: "Gold", value: "#D4A843" },
  { label: "Light gray", value: "rgba(255,255,255,0.65)" },
  { label: "Red", value: "#C8151B" },
  { label: "Sky blue", value: "#7EC8E3" },
  { label: "Black", value: "#1A1A1A" },
];

interface ToolbarButtonProps {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}

function ToolbarButton({ active, onClick, title, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      className={cn(
        "px-2 py-1 rounded text-xs font-medium transition-colors",
        active
          ? "bg-brand-600 text-white"
          : "text-surface-600 hover:bg-surface-100"
      )}
    >
      {children}
    </button>
  );
}

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Start typing…",
  minHeight = "160px",
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit, TextStyle, Color, FontSize],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html === "<p></p>" ? "" : html);
    },
    editorProps: {
      attributes: {
        class: "focus:outline-none text-sm text-surface-800 leading-relaxed",
        "data-placeholder": placeholder,
      },
    },
  });

  if (!editor) return null;

  return (
    <div className="rounded-md border border-surface-200 bg-white overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-surface-100 bg-surface-50">
        {/* Headings */}
        <ToolbarButton
          active={editor.isActive("heading", { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          title="Heading 1"
        >
          H1
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Heading 2"
        >
          H2
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          title="Heading 3"
        >
          H3
        </ToolbarButton>

        <div className="w-px h-4 bg-surface-200 mx-1" />

        {/* Formatting */}
        <ToolbarButton
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold"
        >
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic"
        >
          <em>I</em>
        </ToolbarButton>

        <div className="w-px h-4 bg-surface-200 mx-1" />

        {/* Lists */}
        <ToolbarButton
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet list"
        >
          • List
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Numbered list"
        >
          1. List
        </ToolbarButton>

        <div className="w-px h-4 bg-surface-200 mx-1" />

        {/* Color swatches */}
        <span className="text-xs text-surface-400 mr-1">Color:</span>
        {TOOLBAR_COLORS.map((c) => (
          <button
            key={c.value}
            type="button"
            title={c.label}
            onMouseDown={(e) => {
              e.preventDefault();
              editor.chain().focus().setColor(c.value).run();
            }}
            className="w-5 h-5 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform"
            style={{ backgroundColor: c.value === "rgba(255,255,255,0.65)" ? "#ccc" : c.value }}
          />
        ))}
        <button
          type="button"
          title="Remove color"
          onMouseDown={(e) => {
            e.preventDefault();
            editor.chain().focus().unsetColor().run();
          }}
          className="text-xs text-surface-400 hover:text-surface-700 px-1"
        >
          ✕
        </button>

        <div className="w-px h-4 bg-surface-200 mx-1" />

        {/* Font size */}
        <span className="text-xs text-surface-400 mr-0.5">Size:</span>
        <select
          value={editor.getAttributes("textStyle").fontSize ?? ""}
          onChange={(e) => {
            const size = e.target.value;
            editor.chain().focus().setMark("textStyle", { fontSize: size || null }).run();
          }}
          className="text-xs border border-surface-200 rounded px-1 py-0.5 text-surface-700 bg-white focus:outline-none"
        >
          <option value="">Default</option>
          {FONT_SIZES.map((s) => (
            <option key={s} value={s}>{s.replace("px", "pt")}</option>
          ))}
        </select>
      </div>

      {/* Editor content */}
      <div
        className="px-3 py-2 relative"
        style={{ minHeight }}
      >
        {editor.isEmpty && (
          <p
            className="absolute top-2 left-3 text-sm text-surface-300 pointer-events-none select-none"
            aria-hidden
          >
            {placeholder}
          </p>
        )}
        <EditorContent
          editor={editor}
          className="[&_.ProseMirror]:outline-none [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-2 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mb-1.5 [&_h3]:text-base [&_h3]:font-bold [&_h3]:mb-1 [&_p]:mb-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-1.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-1.5 [&_li]:mb-0.5"
        />
      </div>
    </div>
  );
}
