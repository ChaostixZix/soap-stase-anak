<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';

	export let type: 'success' | 'error' | 'info' = 'info';
	export let message: string;
	export let duration = 4000;

	const dispatch = createEventDispatcher();

	onMount(() => {
		const timer = setTimeout(() => {
			dispatch('close');
		}, duration);

		return () => clearTimeout(timer);
	});

	const typeStyles = {
		success: 'bg-green-50 text-green-800 border-green-200',
		error: 'bg-red-50 text-red-800 border-red-200',
		info: 'bg-blue-50 text-blue-800 border-blue-200'
	};

	const iconPaths = {
		success: 'M5 13l4 4L19 7',
		error: 'M6 18L18 6M6 6l12 12',
		info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
	};
</script>

<div class="fixed top-4 right-4 z-50 max-w-sm w-full">
	<div class="border rounded-lg p-4 shadow-lg {typeStyles[type]}">
		<div class="flex items-start">
			<div class="flex-shrink-0">
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d={iconPaths[type]}
					/>
				</svg>
			</div>
			<div class="ml-3 flex-1">
				<p class="text-sm font-medium">{message}</p>
			</div>
			<div class="ml-4 flex-shrink-0 flex">
				<button
					type="button"
					on:click={() => dispatch('close')}
					class="inline-flex text-current hover:opacity-75 focus:outline-none"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>
		</div>
	</div>
</div>