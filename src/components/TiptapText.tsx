"use client";

import React, { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "tiptap-markdown";
import Underline from "@tiptap/extension-underline";
import { Bold, Italic, Underline as UnderlinedIcon, Strikethrough, Code } from "lucide-react";

interface TiptapTextProps {
  content: string;
  onContentChange?: (content: string) => void;
  className?: string;
  placeholder?: string;
}

const TiptapText: React.FC<TiptapTextProps> = ({
  content,
  onContentChange,
  className = "",
  placeholder = "Enter text...",
}) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const editor = useEditor({
    extensions: [StarterKit, Markdown, Underline],
    content: content || placeholder,
    editorProps: {
      attributes: {
        class: `outline-none focus:outline-none transition-all duration-200 ${className}`,
        "data-placeholder": placeholder,
      },
    },
    onBlur: ({ editor }) => {
      const markdown = (editor as any)?.storage?.markdown?.getMarkdown?.();
      if (onContentChange && typeof markdown === "string") {
        onContentChange(markdown);
      }
      setMenuVisible(false);
    },
    editable: true,
    immediatelyRender: false,
  });

  useEffect(() => {
    if (!editor) return;
    const currentText = (editor as any)?.storage?.markdown?.getMarkdown?.();
    if ((content || "") !== currentText) {
      editor.commands.setContent(content || "");
    }
  }, [content, editor]);

  useEffect(() => {
    if (!editor) return;

    const updateMenu = () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        setMenuVisible(false);
        return;
      }

      const range = selection.getRangeAt(0);
      if (range.collapsed) {
        setMenuVisible(false);
        return;
      }

      const rect = range.getBoundingClientRect();
      if (!rect || (rect.top === 0 && rect.left === 0 && rect.width === 0)) {
        setMenuVisible(false);
        return;
      }

      setMenuVisible(true);
      setMenuPosition({
        top: rect.top + window.scrollY - 40,
        left: rect.left + window.scrollX + rect.width / 2,
      });
    };

    const handleSelectionUpdate = () => {
      updateMenu();
    };

    editor.on("selectionUpdate", handleSelectionUpdate);

    document.addEventListener("mouseup", updateMenu);
    document.addEventListener("keyup", updateMenu);
    window.addEventListener("scroll", updateMenu);
    window.addEventListener("resize", updateMenu);

    return () => {
      editor.off("selectionUpdate", handleSelectionUpdate);
      document.removeEventListener("mouseup", updateMenu);
      document.removeEventListener("keyup", updateMenu);
      window.removeEventListener("scroll", updateMenu);
      window.removeEventListener("resize", updateMenu);
    };
  }, [editor]);

  if (!editor) {
    return <div className={className}>{content || placeholder}</div>;
  }

  return (
    <>
      {menuVisible && (
        <div
          className="fixed z-[9999] -translate-x-1/2 rounded-lg bg-white shadow-lg border border-gray-200 p-1 flex gap-1"
          style={{ top: menuPosition.top, left: menuPosition.left }}
        >
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1 rounded hover:bg-gray-100 ${editor.isActive("bold") ? "text-blue-600" : ""}`}
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1 rounded hover:bg-gray-100 ${editor.isActive("italic") ? "text-blue-600" : ""}`}
          >
            <Italic className="h-4 w-4" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-1 rounded hover:bg-gray-100 ${editor.isActive("underline") ? "text-blue-600" : ""}`}
          >
            <UnderlinedIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-1 rounded hover:bg-gray-100 ${editor.isActive("strike") ? "text-blue-600" : ""}`}
          >
            <Strikethrough className="h-4 w-4" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={`p-1 rounded hover:bg-gray-100 ${editor.isActive("code") ? "text-blue-600" : ""}`}
          >
            <Code className="h-4 w-4" />
          </button>
        </div>
      )}

      <EditorContent
        editor={editor}
        className={`tiptap-text-editor w-full inline-block cursor-text rounded-sm hover:outline hover:outline-1 hover:outline-indigo-400 ${className}`}
        style={{
          lineHeight: "inherit",
          fontSize: "inherit",
          fontWeight: "inherit",
          fontFamily: "inherit",
          color: "inherit",
          textAlign: "inherit",
        }}
      />
    </>
  );
};

export default TiptapText;
