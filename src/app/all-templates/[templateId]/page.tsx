"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { templates as templateGroups, getTemplatesByTemplateName } from "@/app/presentation-templates";
import { useTheme } from "@/providers/ThemeProvider";

export default function TemplateDetailPreview() {
  const params = useParams();
  const router = useRouter();
  const { theme } = useTheme();

  const templateId = params.templateId as string;

  const staticTemplates = getTemplatesByTemplateName(templateId);
  const staticGroup = templateGroups.find((g) => g.id === templateId);

  if (!staticGroup || staticTemplates.length === 0) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center transition-colors duration-300 ${
        theme === 'light' ? 'bg-slate-50' : 'bg-gradient-to-b from-black via-neutral-900 to-neutral-800'
      }`}>
        <h2 className={`text-2xl font-semibold mb-4 ${theme === 'light' ? 'text-slate-900' : 'text-slate-50'}`}>
          Template not found
        </h2>
        <button
          onClick={() => router.back()}
          className={`flex items-center gap-2 border px-4 py-2 rounded-full text-sm transition-colors ${
            theme === 'light'
              ? 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
              : 'bg-neutral-800 border-neutral-700 hover:bg-neutral-700 text-slate-300'
          }`}
        >
          <ArrowLeft className="w-4 h-4" /> Go back
        </button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'light' ? 'bg-slate-50' : 'bg-black'
    }`}>
      {/* Top Navigation Bar */}
      <header className={`backdrop-blur border-b sticky top-0 z-30 transition-colors ${
        theme === 'light' ? 'bg-white/80 border-slate-200' : 'bg-slate-950/80 border-slate-800'
      }`}>
        <div className="max-w-5xl mx-auto px-4 py-5">
          <button
            onClick={() => router.back()}
            className={`flex items-center gap-2 text-xs md:text-sm border px-4 py-1.5 rounded-full transition-colors mb-4 ${
              theme === 'light'
                ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                : 'bg-gradient-to-b from-black via-neutral-900 to-neutral-800 border-neutral-700 text-slate-200 hover:border-neutral-500'
            }`}
          >
            <ArrowLeft className="w-4 h-4" /> Back to All Templates
          </button>
          <div className="text-center">
            <h1 className={`text-2xl md:text-3xl font-semibold capitalize mb-2 ${
              theme === 'light' ? 'text-slate-900' : 'text-slate-50'
            }`}>
              {staticGroup.name}
            </h1>
            <p className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
              {staticTemplates.length} layouts 
              {" "+"•"+" "}
              {staticGroup.description}
            </p>
          </div>
        </div>
      </header>
  {/* Full Size Layouts List */}
  <main className="max-w-5xl mx-auto px-4 py-10 space-y-10">
        {staticTemplates.map((template: any, index: number) => {
          const LayoutComponent = template.component;

          return (
            <div
              key={`${templateId}-${template.layoutId}-${index}`}
              id={template.layoutId}
              className={`border rounded-2xl overflow-hidden ${
                theme === 'light'
                  ? 'bg-white border-slate-200 shadow-sm'
                  : 'bg-gradient-to-b from-black via-neutral-900 to-neutral-800 border-neutral-700 shadow-[0_18px_60px_rgba(0,0,0,1)]'
              }`}
            >
              {/* Layout Header / Title */}
              <div className={`px-5 py-4 border-b ${
                theme === 'light' ? 'bg-white border-slate-200' : 'bg-transparent border-neutral-800'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className={`text-lg md:text-xl font-semibold capitalize ${
                      theme === 'light' ? 'text-slate-900' : 'text-slate-50'
                    }`}>
                      {template.layoutName}
                    </h3>
                    <p className={`text-xs md:text-sm mt-1 ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                      {template.layoutDescription}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded text-xs md:text-sm font-mono ${
                      theme === 'light' ? 'bg-slate-100 text-slate-600' : 'bg-neutral-800 text-slate-300'
                    }`}>
                      {template.layoutId}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs md:text-sm font-medium ${
                      theme === 'light' ? 'bg-slate-900 text-slate-50' : 'bg-slate-100 text-slate-900'
                    }`}>
                      Layout #{index + 1}
                    </span>
                  </div>
                </div>
              </div>

              {/* The Full Sized Preview rendered at 1280x720 */}
              <div className={`p-4 md:p-6 flex justify-center overflow-x-auto ${
                theme === 'light' ? 'bg-slate-100' : 'bg-black/40'
              }`}>
                <div
                  className={`flex-shrink-0 border ${
                    theme === 'light' ? 'bg-white border-slate-200 shadow-sm' : 'bg-neutral-900 border-neutral-800 shadow-[0_0_20px_rgba(0,0,0,0.8)]'
                  }`}
                  style={{ width: "1280px", height: "720px", position: "relative" }}
                >
                  <LayoutComponent data={template.sampleData} />
                </div>
              </div>
            </div>
          );
        })}
      </main>
    </div>
  );
}
