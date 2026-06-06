const header = document.querySelector("[data-header]");
const toggle = document.querySelector("[data-menu-toggle]");
const drawer = document.querySelector("[data-drawer]");
const newsletter = document.querySelector("[data-newsletter]");
const newsletterNote = document.querySelector("[data-newsletter-note]");
const reviewCards = [...document.querySelectorAll(".review-card")];
const revealNodes = [...document.querySelectorAll("[data-reveal]")];
const drawerLinks = [...document.querySelectorAll(".drawer-links a")];
const detailStage = document.querySelector("[data-detail-stage]");
const detailPhotos = [...document.querySelectorAll(".details-photo")];
const hoursGallery = document.querySelector("[data-hours-gallery]");
const marquee = document.querySelector("[data-marquee]");
const marqueeTrack = marquee?.querySelector("[data-marquee-track]");
const marqueeSet = marquee?.querySelector("[data-marquee-set]");
const isAboutPage = document.body.classList.contains("about-page");
const canAnimatePhotos = () => window.matchMedia("(min-width: 701px)").matches;
const ctaNodes = [...document.querySelectorAll(".button, .text-link, .header-cta, .footer-cta")];
const scheduleAnimationFrame = window.requestAnimationFrame
  ? (callback) => window.requestAnimationFrame(callback)
  : (callback) => window.setTimeout(() => callback(window.performance?.now?.() || Date.now()), 16);
const defaultRevealStagger = 42;
const fastRevealStagger = 24;
const defaultRevealDuration = 650;
const fastRevealDuration = 430;
let headerUpdateQueued = false;

function requestHeaderUpdate() {
  if (headerUpdateQueued) {
    return;
  }

  headerUpdateQueued = true;
  scheduleAnimationFrame(() => {
    headerUpdateQueued = false;
    updateHeader();
  });
}

function updateToggleLabel() {
  if (document.body.classList.contains("menu-open")) {
    toggle.setAttribute("aria-label", "Chiudi menu");
    return;
  }

  toggle.setAttribute("aria-label", "Apri menu");
}

function setCtaText(node, text) {
  const currentLine = node?.querySelector(".cta-line-current");
  const hoverLine = node?.querySelector(".cta-line-hover");

  if (currentLine && hoverLine) {
    currentLine.textContent = text;
    hoverLine.textContent = text;
    return;
  }

  if (node) {
    node.textContent = text;
  }
}

function openDrawer() {
  document.body.classList.add("menu-open");
  header.classList.add("is-open");
  drawer.setAttribute("aria-hidden", "false");
  toggle.setAttribute("aria-expanded", "true");
  updateToggleLabel();
}

function closeDrawer() {
  header.classList.remove("is-open");
  document.body.classList.remove("menu-open");
  drawer.setAttribute("aria-hidden", "true");
  toggle.setAttribute("aria-expanded", "false");
  updateToggleLabel();
}

function updateHeader() {
  const rootStyle = document.documentElement.style;
  const heroProgress = Math.min(window.scrollY / Math.max(window.innerHeight, 1), 1);
  header.classList.toggle("is-scrolled", window.scrollY > 24);
  rootStyle.setProperty("--hero-image-shift", `${heroProgress * 96}px`);
  rootStyle.setProperty("--hero-image-scale", `${1.08 + heroProgress * 0.08}`);
  rootStyle.setProperty("--hero-copy-shift", `${heroProgress * -72}px`);

  if (detailStage && canAnimatePhotos()) {
    const rect = detailStage.getBoundingClientRect();
    const travel = window.innerHeight + rect.height;
    const progress = Math.min(Math.max((window.innerHeight - rect.top) / travel, 0), 1);
    detailStage.style.setProperty("--detail-shift", `${(progress - 0.5) * 170}px`);
  } else if (detailStage) {
    detailStage.style.setProperty("--detail-shift", "0px");
  }

  if (hoursGallery && canAnimatePhotos()) {
    const rect = hoursGallery.getBoundingClientRect();
    const start = window.innerHeight * 0.72;
    const progress = Math.min(Math.max((start - rect.top) / (rect.height * 0.85), 0), 1);
    const eased = progress * progress * (3 - 2 * progress);
    hoursGallery.style.setProperty("--hours-side-shift", `${eased * 92}px`);
    hoursGallery.style.setProperty("--hours-center-shift", `${eased * -118}px`);
  } else if (hoursGallery) {
    hoursGallery.style.setProperty("--hours-side-shift", "0px");
    hoursGallery.style.setProperty("--hours-center-shift", "0px");
  }

}

function waitForImages(images) {
  const imagePromises = images.map((image) => {
    if (image.complete && image.naturalWidth > 0) {
      return image.decode ? image.decode().catch(() => undefined) : Promise.resolve();
    }

    return new Promise((resolve) => {
      image.addEventListener("load", resolve, { once: true });
      image.addEventListener("error", resolve, { once: true });
    }).then(() => (image.decode ? image.decode().catch(() => undefined) : undefined));
  });

  return Promise.allSettled(imagePromises);
}

function startGsapMarquee() {
  if (!marquee || !marqueeTrack || !marqueeSet || !window.gsap || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const pixelsPerSecond = 45;
  let offset = 0;
  let lastTime = null;
  let ticker;
  let resizeTimer;

  const getCycleWidth = () => {
    const firstSet = marqueeTrack.firstElementChild;
    const secondSet = firstSet?.nextElementSibling;

    if (!firstSet || !secondSet) {
      return 0;
    }

    return secondSet.getBoundingClientRect().left - firstSet.getBoundingClientRect().left;
  };

  const buildLoop = () => {
    if (ticker) {
      window.gsap.ticker.remove(ticker);
      ticker = undefined;
    }

    offset = 0;
    lastTime = null;
    window.gsap.set(marqueeTrack, { force3D: true, x: 0 });
    marqueeTrack.querySelectorAll("[data-marquee-clone]").forEach((clone) => clone.remove());

    const sourceWidth = marqueeSet.getBoundingClientRect().width;

    if (sourceWidth <= 0) {
      return;
    }

    const addClone = () => {
      const clone = marqueeSet.cloneNode(true);
      clone.setAttribute("data-marquee-clone", "true");
      clone.setAttribute("aria-hidden", "true");
      marqueeTrack.append(clone);
    };

    addClone();

    let cycleWidth = getCycleWidth();

    if (cycleWidth <= 0) {
      return;
    }

    while (marqueeTrack.children.length < 3 || marqueeTrack.getBoundingClientRect().width < marquee.clientWidth + cycleWidth * 2) {
      addClone();
      cycleWidth = getCycleWidth();
    }

    ticker = (time) => {
      if (lastTime === null) {
        lastTime = time;
      }

      const delta = Math.min(time - lastTime, 0.064);

      lastTime = time;
      offset = (offset + delta * pixelsPerSecond) % cycleWidth;
      window.gsap.set(marqueeTrack, { force3D: true, x: -Math.round(offset) });
    };

    window.gsap.ticker.add(ticker);
  };

  const scheduleBuild = () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(buildLoop, 150);
  };

  waitForImages([...marqueeSet.querySelectorAll("img")]).then(buildLoop);
  document.fonts?.ready?.then(buildLoop).catch(() => undefined);
  window.addEventListener("resize", scheduleBuild, { passive: true });
  window.addEventListener("orientationchange", scheduleBuild, { passive: true });
  window.addEventListener("load", buildLoop, { once: true });
}

drawerLinks.forEach((link, index) => link.style.setProperty("--drawer-i", index));

ctaNodes.forEach((node) => {
  const text = node.textContent;
  const label = document.createElement("span");
  const currentLine = document.createElement("span");
  const hoverLine = document.createElement("span");
  const icon = document.createElement("span");

  label.className = "cta-label";
  currentLine.className = "cta-line cta-line-current";
  hoverLine.className = "cta-line cta-line-hover";
  icon.className = "cta-icon";
  icon.setAttribute("aria-hidden", "true");
  currentLine.textContent = text;
  hoverLine.textContent = text;

  node.textContent = "";
  node.classList.add("cta-control");
  label.append(currentLine, hoverLine);

  node.append(label, icon);
});

toggle.addEventListener("click", () => {
  if (document.body.classList.contains("menu-open")) {
    closeDrawer();
    return;
  }

  openDrawer();
});

drawerLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    if (link.target === "_blank" || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    window.location.href = link.href;
  });
});

document.addEventListener("click", (event) => {
  if (event.target.closest("a") && !event.target.closest(".drawer-links a")) {
    closeDrawer();
  }
});

if (newsletter) {
  newsletter.addEventListener("submit", (event) => {
    event.preventDefault();
    newsletter.reset();
    newsletterNote.textContent = "Grazie. Ti invieremo presto le novità de Il Cornicello.";
  });
}

updateHeader();
startGsapMarquee();
window.addEventListener("scroll", requestHeaderUpdate, { passive: true });
window.addEventListener("resize", requestHeaderUpdate, { passive: true });

if (detailStage && detailPhotos.length) {
  detailStage.addEventListener("pointermove", (event) => {
    detailPhotos.forEach((photo, index) => {
      const rect = photo.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const distanceX = event.clientX - centerX;
      const distanceY = event.clientY - centerY;
      const strength = 0.028 + index * 0.004;
      photo.style.setProperty("--magnet-x", `${distanceX * strength}px`);
      photo.style.setProperty("--magnet-y", `${distanceY * strength}px`);
    });
  });

  detailStage.addEventListener("pointerleave", () => {
    detailPhotos.forEach((photo) => {
      photo.style.setProperty("--magnet-x", "0px");
      photo.style.setProperty("--magnet-y", "0px");
    });
  });
}

revealNodes.forEach((node) => {
  const words = node.textContent.trim().split(/\s+/);
  const isFastReveal = node.closest(".about-intro-copy");

  if (isFastReveal) {
    node.classList.add("reveal-fast");
  }

  node.textContent = "";
  words.forEach((word, index) => {
    const span = document.createElement("span");
    span.className = "word";
    span.style.setProperty("--i", index);
    span.textContent = word;
    node.append(span, " ");
  });
});

function revealNode(node) {
  node.classList.add("is-revealed");
}

function getRevealDuration(node) {
  const wordCount = node.querySelectorAll(".word").length;
  const stagger = node.classList.contains("reveal-fast") ? fastRevealStagger : defaultRevealStagger;
  const duration = node.classList.contains("reveal-fast") ? fastRevealDuration : defaultRevealDuration;

  return Math.max((wordCount - 1) * stagger + duration, 620);
}

if (isAboutPage) {
  const groupMap = new Map();
  const revealGroups = [];
  const revealQueue = [];
  let isRevealingGroup = false;

  revealNodes.forEach((node) => {
    const root = node.closest("main > section") || node;

    if (!groupMap.has(root)) {
      const group = { nodes: [], queued: false, revealed: false, root };
      groupMap.set(root, group);
      revealGroups.push(group);
    }

    groupMap.get(root).nodes.push(node);
  });

  function revealNextGroup() {
    if (isRevealingGroup || !revealQueue.length) {
      return;
    }

    isRevealingGroup = true;
    const group = revealQueue.shift();
    group.revealed = true;
    revealObserver.unobserve(group.root);

    if (group.root.classList.contains("about-intro")) {
      const introCopy = group.root.querySelector(".about-intro-copy");
      const introNodes = group.nodes.filter((node) => introCopy?.contains(node));
      const secondParagraph = introCopy?.querySelector("p:nth-of-type(2)");
      const primaryNodes = introNodes.filter((node) => node !== secondParagraph);
      const trailingNodes = group.nodes.filter((node) => !primaryNodes.includes(node) && node !== secondParagraph);
      const primaryDuration = Math.max(...primaryNodes.map(getRevealDuration), 900);

      primaryNodes.forEach(revealNode);
      trailingNodes.forEach(revealNode);

      if (secondParagraph) {
        window.setTimeout(() => revealNode(secondParagraph), primaryDuration);
      }
    } else {
      group.nodes.forEach(revealNode);
    }

    window.setTimeout(() => {
      isRevealingGroup = false;
      revealNextGroup();
    }, 900);
  }

  function queueRevealGroup(group) {
    if (group.queued || group.revealed) {
      return;
    }

    group.queued = true;
    revealQueue.push(group);
    revealQueue.sort((first, second) => {
      if (first.root.compareDocumentPosition(second.root) & Node.DOCUMENT_POSITION_PRECEDING) {
        return 1;
      }

      return -1;
    });
    revealNextGroup();
  }

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          queueRevealGroup(groupMap.get(entry.target));
        }
      });
    },
    { threshold: 0.25, rootMargin: "0px 0px -8% 0px" }
  );

  revealGroups.forEach((group) => revealObserver.observe(group.root));
} else {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          revealNode(entry.target);
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.25, rootMargin: "0px 0px -8% 0px" }
  );

  revealNodes.forEach((node) => revealObserver.observe(node));
}

reviewCards.forEach((card) => {
  const quote = card.querySelector("blockquote");
  const words = quote.textContent.trim().split(/\s+/);
  quote.textContent = "";
  words.forEach((word, index) => {
    const span = document.createElement("span");
    span.className = "review-word";
    span.style.setProperty("--review-i", index);
    span.textContent = word;
    quote.append(span, " ");
  });
});

if (reviewCards.length > 1) {
  let activeReview = 0;
  setInterval(() => {
    reviewCards[activeReview].classList.remove("is-active");
    activeReview = (activeReview + 1) % reviewCards.length;
    reviewCards[activeReview].classList.add("is-active");
  }, 5200);
}
