import { c as create_ssr_component, b as add_attribute, d as escape } from "../../../chunks/ssr.js";
import "../../../chunks/supabaseClient.js";
import "@sveltejs/kit/internal";
import "../../../chunks/exports.js";
import "../../../chunks/utils.js";
import "../../../chunks/state.svelte.js";
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let email = "";
  return `<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8"><div class="max-w-md w-full space-y-8"><div data-svelte-h="svelte-8v0dbb"><h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">Sign in to SOAP Manager</h2> <p class="mt-2 text-center text-sm text-gray-600">We&#39;ll send you a magic link to sign in</p></div> <form class="mt-8 space-y-6"><div><label for="email" class="sr-only" data-svelte-h="svelte-o70mpp">Email address</label> <input id="email" type="email" required class="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm" placeholder="Email address"${add_attribute("value", email, 0)}></div> ${``} ${``} <div><button type="submit" ${""} class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed">${escape("Send Magic Link")}</button></div></form></div></div>`;
});
export {
  Page as default
};
