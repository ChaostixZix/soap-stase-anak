<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { session } from '$lib/auth';

	let loading = true;

	onMount(() => {
		const unsubscribe = session.subscribe((currentSession) => {
			loading = false;
			if (!currentSession && $page.url.pathname !== '/login') {
				goto('/login');
			}
		});

		return unsubscribe;
	});
</script>

{#if loading}
	<div class="min-h-screen flex items-center justify-center">
		<div class="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
	</div>
{:else if $session}
	<slot />
{:else}
	<div class="min-h-screen flex items-center justify-center">
		<p class="text-gray-500">Redirecting to login...</p>
	</div>
{/if}