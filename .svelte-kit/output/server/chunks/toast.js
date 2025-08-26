import { w as writable } from "./index.js";
function createToastStore() {
  const { subscribe, update } = writable([]);
  return {
    subscribe,
    add: (toast) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      update((toasts2) => [...toasts2, { ...toast, id }]);
    },
    remove: (id) => {
      update((toasts2) => toasts2.filter((toast) => toast.id !== id));
    },
    clear: () => {
      update(() => []);
    }
  };
}
const toasts = createToastStore();
export {
  toasts as t
};
