"use client";

import React, { useRef, useEffect, useState, ReactNode } from "react";
import ReactDOM from "react-dom/client";
import TiptapText from "./TiptapText";

interface TiptapTextReplacerProps {
  children: ReactNode;
  slideData?: any;
  slideIndex?: number;
  onContentChange?: (content: string, path: string, slideIndex?: number) => void;
}

const TiptapTextReplacer: React.FC<TiptapTextReplacerProps> = ({
  children,
  slideData,
  slideIndex,
  onContentChange = () => {},
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [processedElements, setProcessedElements] = useState<Set<HTMLElement>>(new Set());

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const replaceTextElements = () => {
      const allElements = container.querySelectorAll("*");

      allElements.forEach((element) => {
        const htmlElement = element as HTMLElement;

        if (
          processedElements.has(htmlElement) ||
          htmlElement.classList.contains("tiptap-text-editor") ||
          htmlElement.closest(".tiptap-text-editor")
        ) {
          return;
        }

        const textContent = Array.from(htmlElement.childNodes)
          .filter((node) => node.nodeType === Node.TEXT_NODE)
          .map((node) => node.textContent || "")
          .join("")
          .trim();

        if (
          textContent.length <= 2 ||
          Array.from(htmlElement.children).some(
            (child) => child.textContent && child.textContent.trim().length > 1,
          )
        ) {
          return;
        }

        if (["INPUT", "TEXTAREA", "BUTTON", "SVG", "IMG"].includes(htmlElement.tagName)) return;

        const dataPath = findDataPath(slideData, textContent);
        if (!dataPath.path) return;

        const tiptapContainer = document.createElement("div");
        tiptapContainer.style.cssText = htmlElement.getAttribute("style") || "";
        tiptapContainer.className = Array.from(htmlElement.classList).join(" ");

        if (htmlElement.parentNode) {
          htmlElement.parentNode.replaceChild(tiptapContainer, htmlElement);
          setProcessedElements((prev) => {
            const next = new Set(prev);
            next.add(htmlElement);
            return next;
          });

          const root = ReactDOM.createRoot(tiptapContainer);
          root.render(
            <TiptapText
              content={textContent}
              onContentChange={(newContent) => {
                onContentChange(newContent, dataPath.path, slideIndex);
              }}
            />,
          );
        }
      });
    };

    const timer = setTimeout(replaceTextElements, 500);
    return () => clearTimeout(timer);
  }, [slideData, slideIndex, onContentChange, processedElements]);

  const findDataPath = (data: any, targetText: string, path = ""): { path: string } => {
    if (!data || typeof data !== "object") return { path: "" };

    for (const [key, value] of Object.entries(data)) {
      const currentPath = path ? `${path}.${key}` : key;

      if (typeof value === "string" && value.trim() === targetText.trim()) return { path: currentPath };

      if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) {
          const result = findDataPath(value[i], targetText, `${currentPath}[${i}]`);
          if (result.path) return result;
        }
      } else if (typeof value === "object" && value !== null) {
        const result = findDataPath(value, targetText, currentPath);
        if (result.path) return result;
      }
    }

    return { path: "" };
  };

  return (
    <div ref={containerRef} className="tiptap-text-replacer h-full w-full">
      {children}
    </div>
  );
};

export default TiptapTextReplacer;
