"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { templates as templateGroups, getTemplatesByTemplateName } from "@/app/presentation-templates";

export default function TemplateDetailPreview() {
  const params = useParams();
  const router = useRouter();

  const templateId = params.templateId as string;

  const staticTemplates = getTemplatesByTemplateName(templateId);
  const staticGroup = templateGroups.find((g) => g.id === templateId);

  if (!staticGroup || staticTemplates.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <h2 className="text-2xl font-semibold text-slate-900 mb-4">Template not found</h2>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-full hover:bg-slate-100 text-sm text-slate-700"
        >
          <ArrowLeft className="w-4 h-4" /> Go back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation Bar */}
      <header className="bg-white/80 backdrop-blur border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-5">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-xs md:text-sm bg-white border border-slate-200 px-4 py-1.5 rounded-full hover:bg-slate-50 transition-colors mb-4 text-slate-700"
          >
            <ArrowLeft className="w-4 h-4" /> Back to All Templates
          </button>
          <div className="text-center">
            <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 capitalize mb-2">
              {staticGroup.name}
            </h1>
            <p className="text-slate-500 text-sm">
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
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm"
            >
              {/* Layout Header / Title */}
              <div className="bg-white px-5 py-4 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg md:text-xl font-semibold text-slate-900 capitalize">
                      {template.layoutName}
                    </h3>
                    <p className="text-xs md:text-sm text-slate-500 mt-1">
                      {template.layoutDescription}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded text-xs md:text-sm font-mono">
                      {template.layoutId}
                    </span>
                    <span className="px-3 py-1 bg-slate-900 text-slate-50 rounded-full text-xs md:text-sm font-medium">
                      Layout #{index + 1}
                    </span>
                  </div>
                </div>
              </div>

              {/* The Full Sized Preview rendered at 1280x720 */}
              <div className="bg-slate-100 p-4 md:p-6 flex justify-center overflow-x-auto">
                <div
                  className="flex-shrink-0 bg-white shadow-sm border border-slate-200"
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
