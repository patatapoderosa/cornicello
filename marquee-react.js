(() => {
  const root = document.getElementById("marquee-root");

  if (!root || !window.React || !window.ReactDOM) {
    return;
  }

  const { createElement: h, useEffect, useMemo, useRef } = window.React;

  const images = [
    "assets/gallery-pizzaiolo-pizza.jpeg",
    "assets/gallery-forno-pizza.jpeg",
    "assets/gallery-crostini.jpeg",
    "assets/gallery-fritti-birra.jpeg",
    "assets/slideshow-baba.jpeg",
    "assets/gallery-pizza-gialla.jpeg",
  ];

  function MarqueeSet({ setIndex }) {
    return h(
      "div",
      { className: "marquee-set", "aria-hidden": setIndex > 0 ? "true" : undefined },
      images.map((src, imageIndex) => h(
        "figure",
        { key: `${setIndex}-${src}` },
        h("img", {
          src,
          alt: "",
          loading: "eager",
          decoding: "async",
          "data-marquee-image": imageIndex,
        })
      ))
    );
  }

  function ReactMarquee() {
    const marqueeRef = useRef(null);
    const trackRef = useRef(null);
    const offsetRef = useRef(0);
    const cycleWidthRef = useRef(0);
    const lastTimeRef = useRef(0);
    const frameRef = useRef(0);
    const resizeTimerRef = useRef(0);
    const setIndexes = useMemo(() => [0, 1, 2], []);

    useEffect(() => {
      const marquee = marqueeRef.current;
      const track = trackRef.current;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

      if (!marquee || !track || reduceMotion.matches) {
        return undefined;
      }

      const pixelsPerSecond = 45;

      const waitForImages = () => Promise.allSettled([...track.querySelectorAll("img")].map((image) => {
        if (image.complete && image.naturalWidth > 0) {
          return image.decode ? image.decode().catch(() => undefined) : Promise.resolve();
        }

        return new Promise((resolve) => {
          image.addEventListener("load", resolve, { once: true });
          image.addEventListener("error", resolve, { once: true });
        }).then(() => (image.decode ? image.decode().catch(() => undefined) : undefined));
      }));

      const measureCycle = () => {
        const firstSet = track.children[0];
        const secondSet = track.children[1];

        if (!firstSet || !secondSet) {
          return 0;
        }

        return secondSet.getBoundingClientRect().left - firstSet.getBoundingClientRect().left;
      };

      const tick = (time) => {
        if (!lastTimeRef.current) {
          lastTimeRef.current = time;
        }

        const delta = Math.min((time - lastTimeRef.current) / 1000, 0.064);
        lastTimeRef.current = time;
        offsetRef.current = (offsetRef.current + delta * pixelsPerSecond) % cycleWidthRef.current;
        track.style.transform = `translate3d(${-offsetRef.current}px, 0, 0)`;
        frameRef.current = window.requestAnimationFrame(tick);
      };

      const build = () => {
        window.cancelAnimationFrame(frameRef.current);
        track.style.transform = "translate3d(0, 0, 0)";
        cycleWidthRef.current = measureCycle();

        if (cycleWidthRef.current <= 0) {
          return;
        }

        offsetRef.current %= cycleWidthRef.current;
        lastTimeRef.current = 0;
        frameRef.current = window.requestAnimationFrame(tick);
      };

      const scheduleBuild = () => {
        window.clearTimeout(resizeTimerRef.current);
        resizeTimerRef.current = window.setTimeout(build, 150);
      };

      waitForImages().then(build);
      window.addEventListener("load", build, { once: true });
      window.addEventListener("resize", scheduleBuild, { passive: true });
      window.addEventListener("orientationchange", scheduleBuild, { passive: true });

      return () => {
        window.cancelAnimationFrame(frameRef.current);
        window.clearTimeout(resizeTimerRef.current);
        window.removeEventListener("resize", scheduleBuild);
        window.removeEventListener("orientationchange", scheduleBuild);
      };
    }, []);

    return h(
      "div",
      { className: "marquee", "aria-hidden": "true", ref: marqueeRef },
      h("div", { className: "marquee-track", ref: trackRef }, setIndexes.map((setIndex) => h(MarqueeSet, { key: setIndex, setIndex })))
    );
  }

  window.ReactDOM.createRoot(root).render(h(ReactMarquee));
})();
