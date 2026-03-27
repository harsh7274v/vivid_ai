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
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Template not found</h2>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 bg-white border px-4 py-2 rounded-md hover:bg-gray-100"
       >
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm bg-white border px-4 py-2 rounded-md hover:bg-gray-50 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> Back to All Templates
          </button>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 capitalize mb-2">
              {staticGroup.name}
            </h1>
            <p className="text-gray-600">
              {staticTemplates.length} layouts 
              {" "+"•"+" "}
              {staticGroup.description}
            </p>
          </div>
        </div>
      </header>

      {/* Full Size Layouts List */}
      <main className="max-w-7xl mx-auto px-6 py-12 space-y-12">
        {staticTemplates.map((template: any, index: number) => {
          const LayoutComponent = template.component;

          return (
            <div
              key={`${templateId}-${template.layoutId}-${index}`}
              id={template.layoutId}
              className="bg-white border text-card-foreground rounded-lg overflow-hidden shadow-md"
            >
              {/* Layout Header / Title */}
              <div className="bg-white px-6 py-4 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 capitalize">
                      {template.layoutName}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {template.layoutDescription}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded text-sm font-mono">
                      {template.layoutId}
                    </span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      Layout #{index + 1}
                    </span>
                  </div>
                </div>
              </div>

              {/* The Full Sized Preview rendered at 1280x720 */}
              <div className="bg-gray-100 p-6 flex justify-center overflow-x-auto">
                <div
                  className="flex-shrink-0 bg-white shadow-sm border"
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
