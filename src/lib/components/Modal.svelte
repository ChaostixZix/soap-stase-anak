<script lang="ts">
	export let isOpen = false;
	export let title = '';
	export let onClose: () => void = () => {};

	let dialog: HTMLDialogElement;

	$: if (dialog && isOpen) {
		dialog.showModal();
	}

	$: if (dialog && !isOpen) {
		dialog.close();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			onClose();
		}
	}

	function handleDialogClick(event: MouseEvent) {
		if (event.target === dialog) {
			onClose();
		}
	}
</script>

<dialog
	bind:this={dialog}
	on:close={onClose}
	on:click={handleDialogClick}
	on:keydown={handleKeydown}
	class="modal p-6 bg-white rounded-lg shadow-xl max-w-md w-full backdrop:bg-black backdrop:bg-opacity-50"
	aria-modal="true"
	aria-labelledby="modal-title"
>
	<div class="flex justify-between items-center mb-4">
		<h3 id="modal-title" class="text-lg font-medium text-gray-900">{title}</h3>
		<button
			type="button"
			on:click={onClose}
			class="text-gray-400 hover:text-gray-600 focus:outline-none"
		>
			<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
			</svg>
		</button>
	</div>

	<slot />
</dialog>

<style>
	.modal {
		border: none;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
	}

	.modal::backdrop {
		background: rgba(0, 0, 0, 0.5);
	}
</style>