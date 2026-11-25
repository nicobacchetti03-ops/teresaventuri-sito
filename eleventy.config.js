import Image from "@11ty/eleventy-img";
import fs from "node:fs";
import path from "node:path";

const MEDIA_DIR = "src/media";
const WIDTHS = [600, 900, 1200, 1800, 2400];
const IMG = new Map(); // "/media/x.jpg" -> [{width,height,url}] ascending

async function processMedia() {
  if (!fs.existsSync(MEDIA_DIR)) return;
  const files = fs.readdirSync(MEDIA_DIR, { recursive: true })
    .filter((f) => /\.(jpe?g|png|webp|avif|tiff?)$/i.test(f));
  await Promise.all(files.map(async (f) => {
    const src = path.join(MEDIA_DIR, f);
    const meta = await Image(src, {
      widths: WIDTHS, formats: ["webp"], outputDir: "_site/img/", urlPath: "/img/",
      sharpWebpOptions: { quality: 80 },
    });
    IMG.set("/media/" + f.split(path.sep).join("/"), meta.webp);
  }));
}

// date "2026-12-10T20:30" (or a YAML Date) read as wall-clock time in Rome
const wall = (v) => {
  if (v instanceof Date) return { y: v.getUTCFullYear(), m: v.getUTCMonth() + 1, d: v.getUTCDate(), h: v.getUTCHours(), mi: v.getUTCMinutes() };
  const m = String(v || "").match(/(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{1,2}):(\d{2}))?/);
  if (!m) return null;
  return { y: +m[1], m: +m[2], d: +m[3], h: +(m[4] || 0), mi: +(m[5] || 0) };
};
const pad = (n) => String(n).padStart(2, "0");
const romeOffset = (w) => {
  const probe = new Date(Date.UTC(w.y, w.m - 1, w.d, w.h, w.mi));
  const s = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Rome", timeZoneName: "longOffset" }).format(probe);
  const o = s.match(/GMT([+-]\d{2}:\d{2})/);
  return o ? o[1] : "+01:00";
};
const iso = (v) => { const w = wall(v); return w ? `${w.y}-${pad(w.m)}-${pad(w.d)}T${pad(w.h)}:${pad(w.mi)}:00${romeOffset(w)}` : ""; };
const ts = (v) => +new Date(iso(v));
const fmt = (v, opts) => { const w = wall(v); return w ? new Intl.DateTimeFormat("it-IT", { timeZone: "UTC", ...opts }).format(new Date(Date.UTC(w.y, w.m - 1, w.d, w.h, w.mi))) : ""; };
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export default function (eleventyConfig) {
  eleventyConfig.on("eleventy.before", processMedia);

  eleventyConfig.addPassthroughCopy({ "src/assets": "assets", "src/logo.svg": "logo.svg", "src/share.jpg": "share.jpg", "src/_headers": "_headers" });
  eleventyConfig.addWatchTarget("src/assets/");
  eleventyConfig.addWatchTarget("src/media/");

  const pick = (p, w = 900) => {
    let key = String(p || "");
    try { key = decodeURI(key); } catch {}
    const list = IMG.get(key);
    if (!list || !list.length) return null;
    return list.find((x) => x.width >= w) || list[list.length - 1];
  };
  eleventyConfig.addFilter("img", (p, w) => (pick(p, w) || { url: p }).url);
  eleventyConfig.addFilter("imgw", (p) => (pick(p, 99999) || {}).width || "");
  eleventyConfig.addFilter("imgh", (p) => (pick(p, 99999) || {}).height || "");

  eleventyConfig.addFilter("evIso", iso);
  eleventyConfig.addFilter("evDay", (v) => cap(fmt(v, { weekday: "long", day: "numeric", month: "long", year: "numeric" })));
  eleventyConfig.addFilter("evDayShort", (v) => fmt(v, { day: "numeric", month: "long" }));
  eleventyConfig.addFilter("evNum", (v) => fmt(v, { day: "numeric" }));
  eleventyConfig.addFilter("evMon", (v) => fmt(v, { month: "short" }).replace(".", ""));
  eleventyConfig.addFilter("evTime", (v) => { const w = wall(v); return w ? `${pad(w.h)}:${pad(w.mi)}` : ""; });
  eleventyConfig.addFilter("ics", (v, addH = 0) => { const w = wall(v); if (!w) return ""; const d = new Date(Date.UTC(w.y, w.m - 1, w.d, w.h, w.mi) + addH * 3600e3);
    return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00`; });
  eleventyConfig.addFilter("uri", (s) => encodeURIComponent(s || ""));
  eleventyConfig.addFilter("json", (v) => JSON.stringify(v).replace(/</g, "\\u003c"));
  eleventyConfig.addFilter("byCat", (list, c) => (list || []).filter((s) => s.categoria === c));
  eleventyConfig.addFilter("key", (s) => s.chiave || String(s.nome).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
  eleventyConfig.addFilter("placeLabel", (s) => (s.online ? "Online, solo consulenze" : s.citta));
  eleventyConfig.addFilter("others", (list, url, n = 2) => (list || []).filter((e) => e.url !== url).slice(0, n));

  // upcoming events first (nearest first), then past ones (most recent first)
  eleventyConfig.addCollection("eventiOrdinati", (api) => {
    const now = Date.now();
    const all = api.getFilteredByTag("eventi").filter((e) => e.data.nascosto !== true);
    const up = all.filter((e) => ts(e.data.data_ora) >= now).sort((a, b) => ts(a.data.data_ora) - ts(b.data.data_ora));
    const past = all.filter((e) => ts(e.data.data_ora) < now).sort((a, b) => ts(b.data.data_ora) - ts(a.data.data_ora));
    return [...up, ...past];
  });

  eleventyConfig.addGlobalData("build", () => ({
    index: process.env.SITE_INDEX === "1",
    year: new Date().getFullYear(),
  }));

  return {
    dir: { input: "src", includes: "_includes", data: "_data", output: "_site" },
    templateFormats: ["njk", "md", "html"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
}
