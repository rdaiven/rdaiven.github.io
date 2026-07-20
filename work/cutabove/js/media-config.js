/* ============================================================
   CUT ABOVE MEDIA — media-config.js
   THE SINGLE PLACE TO SWAP IN REAL WORK.
   Edit the PORTFOLIO array below. Each item:

   {
     title:    "Ad name shown on the card",
     category: one of CATEGORIES (used by the gallery filters),
     type:     "placeholder" | "mp4" | "youtube" | "vimeo",
     src:      "" for placeholder | "path/to/file.mp4" | "<youtube id>" | "<vimeo id>",
     poster:   optional image path/URL shown before play (mp4 only),
     ratio:    "9-16" (default, vertical) | "16-9" (landscape),
     featured: true  -> also appears in the homepage + Work carousels
   }

   Examples:
     type:"mp4",     src:"assets/reels/gym-launch.mp4", poster:"assets/posters/gym.jpg"
     type:"youtube", src:"dQw4w9WgXcQ"
     type:"vimeo",   src:"76979871"

   Nothing else needs to change — the carousel and gallery build
   themselves from this list.
   ============================================================ */

const CATEGORIES = [
  "Meta Ads",
  "Commercials",
  "AI Commercials",
  "Real Estate",
  "UGC Ads",
  "Short Form",
  "Corporate",
  "Motion Graphics",
];

/* PROTOTYPE/TEMPLATE DEMO CONTENT.
   These `src` values are Creative-Commons Blender open-movie YouTube IDs used
   only so the carousel + gallery play real video in the demo. Swap each `src`
   (and `title`/`category`) for real client work when it's available — nothing
   else needs to change. */
const PORTFOLIO = [
  { title: "Scroll-Stopper — Skincare Launch", category: "Meta Ads",       type: "youtube", src: "aqz-KE-bpKQ", ratio: "9-16", featured: true },
  { title: "Cinematic Café Commercial",         category: "Commercials",     type: "youtube", src: "eRsGyueVLvQ", ratio: "16-9", featured: true },
  { title: "AI Automotive Reveal",              category: "AI Commercials",  type: "youtube", src: "R6MlUcmOul8", ratio: "16-9", featured: true },
  { title: "Luxury Listing Walkthrough",        category: "Real Estate",     type: "youtube", src: "TLkA0RELQ1g", ratio: "9-16", featured: true },
  { title: "Founder UGC — Supplement Brand",    category: "UGC Ads",         type: "youtube", src: "Y-rmzh0PI3c", ratio: "9-16", featured: true },
  { title: "60-Second Fitness Reel",            category: "Short Form",      type: "youtube", src: "WhWc3b3KhnY", ratio: "9-16", featured: true },
  { title: "Clinic Brand Film",                 category: "Corporate",       type: "youtube", src: "mN0zPOpADL4", ratio: "16-9", featured: false },
  { title: "Kinetic Sale Promo",                category: "Motion Graphics", type: "youtube", src: "aqz-KE-bpKQ", ratio: "9-16", featured: true },
  { title: "Lead-Gen Carousel Ad",             category: "Meta Ads",        type: "youtube", src: "eRsGyueVLvQ", ratio: "9-16", featured: false },
  { title: "Restaurant Netflix-Style Trailer",  category: "Commercials",     type: "youtube", src: "R6MlUcmOul8", ratio: "16-9", featured: false },
  { title: "AI Product Hero — Tech",            category: "AI Commercials",  type: "youtube", src: "TLkA0RELQ1g", ratio: "9-16", featured: false },
  { title: "Agent Intro Reel",                  category: "Real Estate",     type: "youtube", src: "Y-rmzh0PI3c", ratio: "9-16", featured: false },
  { title: "Unboxing UGC — E-com",              category: "UGC Ads",         type: "youtube", src: "WhWc3b3KhnY", ratio: "9-16", featured: false },
  { title: "TikTok Hook Series",                category: "Short Form",      type: "youtube", src: "mN0zPOpADL4", ratio: "9-16", featured: false },
  { title: "Corporate Explainer",               category: "Corporate",       type: "youtube", src: "aqz-KE-bpKQ", ratio: "16-9", featured: false },
  { title: "Logo Sting & Lower-Thirds",         category: "Motion Graphics", type: "youtube", src: "eRsGyueVLvQ", ratio: "16-9", featured: false },
];

/* Gradient palettes used to render on-brand placeholder posters.
   Deterministic per index so layout is stable. */
const POSTER_GRADS = [
  "linear-gradient(150deg,#3a1400,#0d0d0d 55%,#1a0a00)",
  "linear-gradient(150deg,#2a1a3a,#0d0d0d 60%)",
  "linear-gradient(150deg,#062032,#0d0d0d 60%)",
  "linear-gradient(150deg,#3a2400,#0d0d0d 58%)",
  "linear-gradient(150deg,#301010,#0d0d0d 60%)",
  "linear-gradient(150deg,#0c2a24,#0d0d0d 60%)",
  "linear-gradient(150deg,#241a05,#0d0d0d 58%)",
  "linear-gradient(150deg,#2b1030,#0d0d0d 60%)",
];

window.CUTABOVE_MEDIA = { CATEGORIES, PORTFOLIO, POSTER_GRADS };
