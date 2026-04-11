"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DEFAULT_THEMES } from '../constants/themes';
import { useFontLoader } from '../hooks/useFontLoad';

interface ThemeSelectorProps {
  currentThemeId: string;
  onThemeUpdate: (theme: any) => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ currentThemeId, onThemeUpdate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const clearTheme = (element: HTMLElement) => {
    const propsToRemove = [
      '--primary-color',
      '--background-color',
      '--card-color',
      '--stroke',
      '--primary-text',
      '--background-text',
      'font-family',
      '--heading-font-family',
      '--body-font-family',
      '--graph-0',
      '--graph-1',
      '--graph-2',
    ];
    propsToRemove.forEach((prop) => element.style.removeProperty(prop));
  };

  const applyTheme = (theme: any) => {
    const element = document.documentElement;
    if (!element || !theme?.data) return;

    clearTheme(element);

    const colors = theme.data.colors || {};
    const cssVariables: Record<string, string> = {
      '--primary-color': colors.primary,
      '--background-color': colors.background,
      '--card-color': colors.card,
      '--stroke': colors.stroke,
      '--primary-text': colors.primary_text,
      '--background-text': colors.background_text,
      '--graph-0': colors.graph_0,
      '--graph-1': colors.graph_1,
      '--graph-2': colors.graph_2,
    };

    Object.entries(cssVariables).forEach(([key, value]) => {
      if (value) element.style.setProperty(key, value);
    });

    if (theme.data.fonts?.textFont) {
      useFontLoader({ [theme.data.fonts.textFont.name]: theme.data.fonts.textFont.url });
      element.style.setProperty('font-family', `"${theme.data.fonts.textFont.name}"`);
      element.style.setProperty('--heading-font-family', `"${theme.data.fonts.textFont.name}"`);
      element.style.setProperty('--body-font-family', `"${theme.data.fonts.textFont.name}"`);
    }

    onThemeUpdate(theme);
  };

  const resetTheme = () => {
    const element = document.documentElement;
    if (element) clearTheme(element);

    onThemeUpdate(null);
    setIsOpen(false);
  };

  const handleCustomize = () => {
    router.push('/theme?tab=new-theme');
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left font-sans">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-1.5 border border-gray-300 rounded-full bg-white hover:bg-gray-50 flex items-center gap-2 text-sm text-gray-800 font-medium shadow-sm transition-all"
      >
        <span>🎨 Theme</span>
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-3 w-[340px] rounded-2xl border border-gray-100 bg-white shadow-xl p-4 z-50">
          <div className="flex justify-between items-center mb-4 px-1">
            <button
              type="button"
              className="text-xs text-blue-600 font-medium hover:underline"
              onClick={handleCustomize}
            >
              +Customize Theme
            </button>
            <button
              type="button"
              className="text-xs text-gray-500 hover:text-red-500 hover:underline transition-colors"
              onClick={resetTheme}
            >
              Reset Theme
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {DEFAULT_THEMES.map((theme) => (
              <div
                key={theme.id}
                onClick={() => applyTheme(theme)}
                className="group cursor-pointer flex flex-col items-center gap-2"
              >
                <div
                  className={`w-full rounded-xl p-1 border transition-all ${
                    currentThemeId === theme.id
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100'
                      : 'border-gray-200 group-hover:border-gray-400 group-hover:shadow-md'
                  }`}
                >
                  <div
                    className="rounded-lg p-2 aspect-[4/3] flex flex-col"
                    style={{ backgroundColor: theme.data.colors.background }}
                  >
                    <div
                      className="rounded-md shadow-sm p-2 flex-grow flex flex-col justify-between"
                      style={{ backgroundColor: theme.data.colors.card }}
                    >
                      <div>
                        <div
                          className="h-1.5 w-full rounded-full mb-1"
                          style={{ backgroundColor: theme.data.colors.background_text }}
                        />
                        <div
                          className="h-1.5 w-3/4 rounded-full"
                          style={{ backgroundColor: theme.data.colors.background_text }}
                        />
                      </div>
                      <div
                        className="h-2 w-1/2 rounded-full"
                        style={{ backgroundColor: theme.data.colors.primary }}
                      />
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-center font-medium text-gray-700 w-full truncate px-1">
                  {theme.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
