import { c as create_ssr_component } from "../../../../chunks/ssr.js";
import "@sveltejs/kit/internal";
import "../../../../chunks/exports.js";
import "../../../../chunks/utils.js";
import "../../../../chunks/state.svelte.js";
import "../../../../chunks/supabaseClient.js";
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `<div class="min-h-screen flex items-center justify-center" data-svelte-h="svelte-1hcbft9"><div class="text-center"><div class="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div> <p class="mt-4 text-gray-600">Signing you in...</p></div></div>`;
});
export {
  Page as default
};
