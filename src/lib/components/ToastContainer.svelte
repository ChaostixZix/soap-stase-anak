<script lang="ts">
	import { toasts } from '$lib/stores/toast';
	import Toast from './Toast.svelte';
</script>

{#each $toasts as toast (toast.id)}
	<Toast
		type={toast.type}
		message={toast.message}
		duration={toast.duration}
		on:close={() => toasts.remove(toast.id)}
	/>
{/each}