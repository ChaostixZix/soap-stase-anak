

export const index = 5;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/hospitals/_page.svelte.js')).default;
export const imports = ["_app/immutable/nodes/5.BISpn6HB.js","_app/immutable/chunks/TMsUfOpP.js","_app/immutable/chunks/B4gsjGnh.js","_app/immutable/chunks/BY-ePNvO.js","_app/immutable/chunks/IHki7fMi.js","_app/immutable/chunks/CBE7IYhh.js"];
export const stylesheets = ["_app/immutable/assets/LoadingSpinner.fGCk6msK.css"];
export const fonts = [];
