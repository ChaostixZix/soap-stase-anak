import { c as create_ssr_component, b as add_attribute, d as escape } from "./ssr.js";
const css = {
  code: ".modal.svelte-jsco2i{border:none;box-shadow:0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)}.modal.svelte-jsco2i::backdrop{background:rgba(0, 0, 0, 0.5)}",
  map: '{"version":3,"file":"Modal.svelte","sources":["Modal.svelte"],"sourcesContent":["<script lang=\\"ts\\">export let isOpen = false;\\nexport let title = \\"\\";\\nexport let onClose = () => {\\n};\\nlet dialog;\\n$: if (dialog && isOpen) {\\n  dialog.showModal();\\n}\\n$: if (dialog && !isOpen) {\\n  dialog.close();\\n}\\nfunction handleKeydown(event) {\\n  if (event.key === \\"Escape\\") {\\n    onClose();\\n  }\\n}\\nfunction handleDialogClick(event) {\\n  if (event.target === dialog) {\\n    onClose();\\n  }\\n}\\n<\/script>\\n\\n<dialog\\n\\tbind:this={dialog}\\n\\ton:close={onClose}\\n\\ton:click={handleDialogClick}\\n\\ton:keydown={handleKeydown}\\n\\tclass=\\"modal p-6 bg-white rounded-lg shadow-xl max-w-md w-full backdrop:bg-black backdrop:bg-opacity-50\\"\\n\\taria-modal=\\"true\\"\\n\\taria-labelledby=\\"modal-title\\"\\n>\\n\\t<div class=\\"flex justify-between items-center mb-4\\">\\n\\t\\t<h3 id=\\"modal-title\\" class=\\"text-lg font-medium text-gray-900\\">{title}</h3>\\n\\t\\t<button\\n\\t\\t\\ttype=\\"button\\"\\n\\t\\t\\ton:click={onClose}\\n\\t\\t\\tclass=\\"text-gray-400 hover:text-gray-600 focus:outline-none\\"\\n\\t\\t>\\n\\t\\t\\t<svg class=\\"w-6 h-6\\" fill=\\"none\\" stroke=\\"currentColor\\" viewBox=\\"0 0 24 24\\">\\n\\t\\t\\t\\t<path stroke-linecap=\\"round\\" stroke-linejoin=\\"round\\" stroke-width=\\"2\\" d=\\"M6 18L18 6M6 6l12 12\\" />\\n\\t\\t\\t</svg>\\n\\t\\t</button>\\n\\t</div>\\n\\n\\t<slot />\\n</dialog>\\n\\n<style>\\n\\t.modal {\\n\\t\\tborder: none;\\n\\t\\tbox-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);\\n\\t}\\n\\n\\t.modal::backdrop {\\n\\t\\tbackground: rgba(0, 0, 0, 0.5);\\n\\t}\\n</style>"],"names":[],"mappings":"AAiDC,oBAAO,CACN,MAAM,CAAE,IAAI,CACZ,UAAU,CAAE,CAAC,CAAC,IAAI,CAAC,IAAI,CAAC,IAAI,CAAC,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,CAAC,CAAC,CAAC,CAAC,IAAI,CAAC,IAAI,CAAC,IAAI,CAAC,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,IAAI,CACrF,CAEA,oBAAM,UAAW,CAChB,UAAU,CAAE,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,GAAG,CAC9B"}'
};
const Modal = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { isOpen = false } = $$props;
  let { title = "" } = $$props;
  let { onClose = () => {
  } } = $$props;
  let dialog;
  if ($$props.isOpen === void 0 && $$bindings.isOpen && isOpen !== void 0) $$bindings.isOpen(isOpen);
  if ($$props.title === void 0 && $$bindings.title && title !== void 0) $$bindings.title(title);
  if ($$props.onClose === void 0 && $$bindings.onClose && onClose !== void 0) $$bindings.onClose(onClose);
  $$result.css.add(css);
  return `<dialog class="modal p-6 bg-white rounded-lg shadow-xl max-w-md w-full backdrop:bg-black backdrop:bg-opacity-50 svelte-jsco2i" aria-modal="true" aria-labelledby="modal-title"${add_attribute("this", dialog, 0)}><div class="flex justify-between items-center mb-4"><h3 id="modal-title" class="text-lg font-medium text-gray-900">${escape(title)}</h3> <button type="button" class="text-gray-400 hover:text-gray-600 focus:outline-none" data-svelte-h="svelte-4cl57t"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button></div> ${slots.default ? slots.default({}) : ``} </dialog>`;
});
const LoadingSpinner = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { size = "md" } = $$props;
  let { color = "primary" } = $$props;
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8"
  };
  const colorClasses = {
    primary: "text-indigo-600",
    white: "text-white"
  };
  if ($$props.size === void 0 && $$bindings.size && size !== void 0) $$bindings.size(size);
  if ($$props.color === void 0 && $$bindings.color && color !== void 0) $$bindings.color(color);
  return `<div class="${"animate-spin " + escape(sizeClasses[size], true) + " " + escape(colorClasses[color], true)}" role="status" aria-label="Loading"><svg fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" class="opacity-25"></circle><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" class="opacity-75"></path></svg></div>`;
});
export {
  LoadingSpinner as L,
  Modal as M
};
