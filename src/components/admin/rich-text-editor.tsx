"use client";

import * as React from "react";
import {
  Bold,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Undo2,
} from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Dependency-free rich-text editor over a `contentEditable` surface.
 *
 * Why not a third-party editor: the article model is a constrained subset of
 * HTML that the server re-sanitises on write *and* on render. A small toolbar
 * over `document.execCommand` produces exactly that subset, ships almost no
 * JavaScript, and cannot inject markup the allow-list would strip anyway.
 *
 * The hidden `<textarea>` mirrors the HTML so the value submits with a plain
 * form and React Hook Form can treat the body as an ordinary string field.
 */

type Command =
  | "bold"
  | "italic"
  | "formatBlock"
  | "insertUnorderedList"
  | "insertOrderedList"
  | "createLink"
  | "undo"
  | "redo";

export function RichTextEditor({
  value,
  onChange,
  onImageRequest,
  label,
  id,
  invalid,
  describedBy,
}: {
  value: string;
  onChange: (html: string) => void;
  /** Opens the image picker; the editor inserts the returned URL. */
  onImageRequest: () => void;
  label: string;
  id: string;
  invalid?: boolean;
  describedBy?: string;
}) {
  const editorRef = React.useRef<HTMLDivElement>(null);
  const savedRange = React.useRef<Range | null>(null);

  // Keep the DOM in sync when the value changes from outside (e.g. a preview
  // refresh or loading an existing post), without clobbering the caret while
  // the operator is typing.
  React.useEffect(() => {
    const node = editorRef.current;
    if (!node) return;
    if (node.innerHTML !== value) node.innerHTML = value;
  }, [value]);

  const rememberSelection = () => {
    const selection = window.getSelection();
    if (selection?.rangeCount) {
      savedRange.current = selection.getRangeAt(0).cloneRange();
    }
  };

  const restoreSelection = () => {
    const node = editorRef.current;
    const range = savedRange.current;
    if (!node || !range) return;
    const selection = window.getSelection();
    if (!selection) return;

    node.focus();
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const emit = () => {
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  function run(command: Command, argument?: string) {
    restoreSelection();
    document.execCommand(command, false, argument);
    rememberSelection();
    emit();
  }

  function onLink() {
    restoreSelection();
    const url = window.prompt("Adresse du lien (https://…)");
    if (!url) return;
    // Reject anything that is not a plain web/mailto/tel link before the
    // server-side sanitiser ever sees it.
    if (!/^(https?:\/\/|mailto:|tel:)/i.test(url.trim())) {
      window.alert("Le lien doit commencer par https://, http://, mailto: ou tel:");
      return;
    }
    document.execCommand("createLink", false, url.trim());
    rememberSelection();
    emit();
  }

  const tools: { command: Command; icon: typeof Bold; label: string; arg?: string }[] = [
    { command: "bold", icon: Bold, label: "Gras" },
    { command: "italic", icon: Italic, label: "Italique" },
    { command: "formatBlock", icon: Heading2, label: "Titre 2", arg: "h2" },
    { command: "formatBlock", icon: Heading3, label: "Titre 3", arg: "h3" },
    { command: "formatBlock", icon: Quote, label: "Citation", arg: "blockquote" },
    {
      command: "insertUnorderedList",
      icon: List,
      label: "Liste à puces",
    },
    { command: "insertOrderedList", icon: ListOrdered, label: "Liste numérotée" },
    { command: "createLink", icon: Link2, label: "Lien" },
    { command: "undo", icon: Undo2, label: "Annuler" },
    { command: "redo", icon: Redo2, label: "Rétablir" },
  ];

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border bg-surface-2/60",
        invalid ? "border-danger" : "border-line-strong",
      )}
    >
      <div className="flex flex-wrap items-center gap-1 border-b border-line bg-surface px-2 py-2">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.label}
              type="button"
              title={tool.label}
              aria-label={tool.label}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                if (tool.command === "createLink") onLink();
                else run(tool.command, tool.arg);
              }}
              className="inline-flex size-8 items-center justify-center rounded-lg text-content-muted transition-colors hover:bg-gold-400/10 hover:text-gold-200"
            >
              <Icon aria-hidden="true" className="size-4" />
            </button>
          );
        })}

        <button
          type="button"
          title="Insérer une image"
          aria-label="Insérer une image"
          onMouseDown={(event) => event.preventDefault()}
          onClick={onImageRequest}
          className="inline-flex size-8 items-center justify-center rounded-lg text-content-muted transition-colors hover:bg-gold-400/10 hover:text-gold-200"
        >
          <ImagePlus aria-hidden="true" className="size-4" />
        </button>
      </div>

      <div
        ref={editorRef}
        id={id}
        role="textbox"
        aria-multiline="true"
        aria-label={label}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        contentEditable
        suppressContentEditableWarning
        onInput={emit}
        onBlur={() => {
          rememberSelection();
          emit();
        }}
        onKeyUp={rememberSelection}
        onMouseUp={rememberSelection}
        className="article-prose min-h-80 px-5 py-4 focus:outline-none"
      />

      {/* Mirrors the HTML so the value submits as a normal form field. */}
      <textarea
        name="content"
        value={value}
        readOnly
        aria-hidden="true"
        tabIndex={-1}
        className="sr-only"
      />
    </div>
  );
}