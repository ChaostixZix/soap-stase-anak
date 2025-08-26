<script lang="ts">
	export let size: 'sm' | 'md' | 'lg' = 'md';
	export let color: 'primary' | 'white' = 'primary';

	const sizeClasses = {
		sm: 'w-4 h-4',
		md: 'w-6 h-6',
		lg: 'w-8 h-8'
	};

	const colorClasses = {
		primary: 'text-indigo-600',
		white: 'text-white'
	};
</script>

<div
	class="animate-spin {sizeClasses[size]} {colorClasses[color]}"
	role="status"
	aria-label="Loading"
>
	<svg fill="none" viewBox="0 0 24 24">
		<circle
			cx="12"
			cy="12"
			r="10"
			stroke="currentColor"
			stroke-width="4"
			class="opacity-25"
		></circle>
		<path
			fill="currentColor"
			d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
			class="opacity-75"
		></path>
	</svg>
</div>