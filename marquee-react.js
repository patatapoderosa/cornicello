(() => {
  const root = document.getElementById("marquee-root");

  if (!root || !window.React || !window.ReactDOM) {
    return;
  }

  const { createElement: h } = window.React;

  const images = [
    "assets/gallery-pizzaiolo-pizza.jpeg",
    "assets/gallery-forno-pizza.jpeg",
    "assets/gallery-crostini.jpeg",
    "assets/gallery-fritti-birra.jpeg",
    "assets/slideshow-baba.jpeg",
    "assets/gallery-pizza-gialla.jpeg",
  ];

  function Marquee({ children, repeat = 4 }) {
    return h(
      "div",
      { className: "marquee", "aria-hidden": "true", "data-marquee": "" },
      Array.from({ length: repeat }).map((_, index) => h(
        "div",
        {
          className: "marquee-set",
          "aria-hidden": index > 0 ? "true" : undefined,
          key: index,
        },
        children
      ))
    );
  }

  function ImageStrip() {
    return images.map((src, index) => h(
      "figure",
      { key: src },
      h("img", {
        src,
        alt: "",
        loading: "eager",
        decoding: "async",
        "data-marquee-image": index,
      })
    ));
  }

  window.ReactDOM.createRoot(root).render(h(Marquee, { repeat: 4 }, h(ImageStrip)));
})();
