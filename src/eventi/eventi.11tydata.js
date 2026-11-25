export default {
  layout: "evento.njk",
  tags: ["eventi"],
  eleventyComputed: {
    permalink: (d) => (d.nascosto === true ? false : `/eventi/${d.page.fileSlug}.html`),
    eleventyExcludeFromCollections: (d) => d.nascosto === true,
  },
};
