/** The overlay nav turns solid once the hero's bottom edge is this close to the top of the viewport. */
export const PAST_HERO_PX = 96;

/**
 * Runs from the root layout before the page hydrates. A reload partway down the homepage restores
 * the scroll position long before React is ready (most of a second on a mid-range phone), so the
 * nav would sit clear over the photos until then. This marks <html data-hero="past"> for the nav's
 * CSS to read. The restored position can paint a frame before its scroll event fires, so while the
 * page loads it also checks once per frame. It stops once the nav's own hook takes over by setting
 * data-hero="live", or once the page has parsed without a hero.
 */
export const pastHeroScript = `(function(){var d=document.documentElement;function u(){var h=document.querySelector(".hero-section");if(d.dataset.hero==="live"||(!h&&document.readyState!=="loading")){removeEventListener("scroll",u);return false}if(h)d.dataset.hero=h.getBoundingClientRect().bottom<${PAST_HERO_PX}?"past":"over";return true}function f(){if(u()&&document.readyState!=="complete")requestAnimationFrame(f)}requestAnimationFrame(f);addEventListener("scroll",u,{passive:true})})()`;
