import { writable } from 'svelte/store';

export interface ToastMessage {
	id: string;
	type: 'success' | 'error' | 'info';
	message: string;
	duration?: number;
}

function createToastStore() {
	const { subscribe, update } = writable<ToastMessage[]>([]);

	return {
		subscribe,
		add: (toast: Omit<ToastMessage, 'id'>) => {
			const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
			update(toasts => [...toasts, { ...toast, id }]);
		},
		remove: (id: string) => {
			update(toasts => toasts.filter(toast => toast.id !== id));
		},
		clear: () => {
			update(() => []);
		}
	};
}

export const toasts = createToastStore();