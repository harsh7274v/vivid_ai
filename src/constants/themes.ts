export const DEFAULT_THEMES = [
  {
    id: "mint-blue",
    name: "Mint Blue",
    data: {
      colors: {
        primary: "#3b3172",
        background: "#ffffff",
        card: "#80e7cf",
        stroke: "#d1d1d1",
        primary_text: "#ffffff",
        background_text: "#3b3172",
        graph_0: "#003d2d",
        graph_1: "#005341",
        graph_2: "#006a57",
        graph_3: "#00826d",
        graph_4: "#2b9a85",
        graph_5: "#4ab39d",
        graph_6: "#65cdb6",
        graph_7: "#80e7cf",
        graph_8: "#98ffe6",
        graph_9: "#a5fff4",
      },
      fonts: {
        textFont: {
          name: "Prompt",
          url: "https://fonts.googleapis.com/css2?family=Prompt:wght@100..900&display=swap",
        },
      },
    },
  },
  {
    id: "edge-yellow",
    name: "Edge Yellow",
    data: {
      colors: {
        primary: "#f5f547",
        background: "#1f1f1f",
        card: "#424242",
        stroke: "#585858",
        primary_text: "#161616",
        background_text: "#f5f547",
        graph_0: "#ffff54",
        graph_1: "#f1f142",
        graph_2: "#dada15",
      },
      fonts: {
        textFont: {
          name: "Playfair Display",
          url: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400..900&display=swap",
        },
      },
    },
  },
  {
    id: "light-rose",
    name: "Light Rose",
    data: {
      colors: {
        primary: "#030204",
        background: "#f69c9c",
        card: "#ffaeb4",
        stroke: "#bf6a6b",
        primary_text: "#bebebe",
        background_text: "#030202",
        graph_0: "#2f2c32",
        graph_1: "#444147",
        graph_2: "#5a565d",
      },
      fonts: {
        textFont: {
          name: "Overpass",
          url: "https://fonts.googleapis.com/css2?family=Overpass:wght@100..900&display=swap",
        },
      },
    },
  },
  {
    id: "professional-blue",
    name: "Professional Blue",
    data: {
      colors: {
        primary: "#161616",
        background: "#ffffff",
        card: "#dae6ff",
        stroke: "#d1d1d1",
        primary_text: "#eeeaea",
        background_text: "#000000",
        graph_0: "#2e2e2e",
        graph_1: "#424242",
        graph_2: "#585858",
      },
      fonts: {
        textFont: {
          name: "Inter",
          url: "https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap",
        },
      },
    },
  },
  {
    id: "professional-dark",
    name: "Professional Dark",
    data: {
      colors: {
        primary: "#eff5f1",
        background: "#050505",
        card: "#424242",
        stroke: "#585858",
        primary_text: "#050505",
        background_text: "#eff5f1",
        graph_0: "#ebf6ff",
        graph_1: "#dee8fa",
        graph_2: "#c7d2e3",
      },
      fonts: {
        textFont: {
          name: "Instrument Sans",
          url: "https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wght@0,400..700;1,400..700&display=swap",
        },
      },
    },
  },
] as const;
