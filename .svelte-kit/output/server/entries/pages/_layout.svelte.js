import { c as create_ssr_component, a as subscribe, e as each, b as add_attribute, d as escape, f as createEventDispatcher, v as validate_component } from "../../chunks/ssr.js";
import { p as page } from "../../chunks/stores.js";
import { t as toasts } from "../../chunks/toast.js";
const Navbar = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let currentPath;
  let $page, $$unsubscribe_page;
  $$unsubscribe_page = subscribe(page, (value) => $page = value);
  const navItems = [
    {
      href: "/",
      label: "Dashboard",
      exact: true
    },
    {
      href: "/hospitals",
      label: "Hospitals",
      exact: false
    },
    {
      href: "/bangsal",
      label: "Bangsal",
      exact: false
    }
  ];
  function isActive(href, exact) {
    if (exact) {
      return currentPath === href;
    }
    return currentPath.startsWith(href);
  }
  currentPath = $page.url.pathname;
  $$unsubscribe_page();
  return `<nav class="bg-white shadow-sm border-b"><div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><div class="flex justify-between h-16"><div class="flex items-center space-x-8"><a href="/" class="text-xl font-semibold text-gray-900 hover:text-indigo-600" data-svelte-h="svelte-cggzki">SOAP Manager</a> <div class="flex space-x-4">${each(navItems, (item) => {
    return `<a${add_attribute("href", item.href, 0)} class="${"px-3 py-2 rounded-md text-sm font-medium transition-colors " + escape(
      isActive(item.href, item.exact) ? "text-indigo-600 bg-indigo-50" : "text-gray-700 hover:text-indigo-600 hover:bg-gray-50",
      true
    )}">${escape(item.label)} </a>`;
  })}</div></div> <div class="flex items-center space-x-4" data-svelte-h="svelte-2hjew4"><span class="text-sm text-amber-700 bg-amber-100 px-2 py-1 rounded">🚧 Development Mode - Auth Disabled</span></div></div></div></nav>`;
});
const Toast = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { type = "info" } = $$props;
  let { message } = $$props;
  let { duration = 4e3 } = $$props;
  createEventDispatcher();
  const typeStyles = {
    success: "bg-green-50 text-green-800 border-green-200",
    error: "bg-red-50 text-red-800 border-red-200",
    info: "bg-blue-50 text-blue-800 border-blue-200"
  };
  const iconPaths = {
    success: "M5 13l4 4L19 7",
    error: "M6 18L18 6M6 6l12 12",
    info: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
  };
  if ($$props.type === void 0 && $$bindings.type && type !== void 0) $$bindings.type(type);
  if ($$props.message === void 0 && $$bindings.message && message !== void 0) $$bindings.message(message);
  if ($$props.duration === void 0 && $$bindings.duration && duration !== void 0) $$bindings.duration(duration);
  return `<div class="fixed top-4 right-4 z-50 max-w-sm w-full"><div class="${"border rounded-lg p-4 shadow-lg " + escape(typeStyles[type], true)}"><div class="flex items-start"><div class="flex-shrink-0"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"${add_attribute("d", iconPaths[type], 0)}></path></svg></div> <div class="ml-3 flex-1"><p class="text-sm font-medium">${escape(message)}</p></div> <div class="ml-4 flex-shrink-0 flex"><button type="button" class="inline-flex text-current hover:opacity-75 focus:outline-none" data-svelte-h="svelte-9yflwx"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button></div></div></div></div>`;
});
const ToastContainer = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $toasts, $$unsubscribe_toasts;
  $$unsubscribe_toasts = subscribe(toasts, (value) => $toasts = value);
  $$unsubscribe_toasts();
  return `${each($toasts, (toast) => {
    return `${validate_component(Toast, "Toast").$$render(
      $$result,
      {
        type: toast.type,
        message: toast.message,
        duration: toast.duration
      },
      {},
      {}
    )}`;
  })}`;
});
const Layout = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return ` ${validate_component(Navbar, "Navbar").$$render($$result, {}, {}, {})} <main class="min-h-screen bg-gray-50">${slots.default ? slots.default({}) : ``}</main> ${validate_component(ToastContainer, "ToastContainer").$$render($$result, {}, {}, {})}`;
});
export {
  Layout as default
};
