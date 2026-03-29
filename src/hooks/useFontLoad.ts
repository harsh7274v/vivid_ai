export const useFontLoader = (fonts: Record<string, string>) => {
  if (typeof document === 'undefined') return;

  Object.entries(fonts).forEach(([name, url]) => {
    const id = `font-loader-${name}`;
    if (document.getElementById(id)) return;

    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = url;
    document.head.appendChild(link);
  });
};
