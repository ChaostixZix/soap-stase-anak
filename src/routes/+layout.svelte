<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import Navbar from '$lib/components/Navbar.svelte';
	import ProtectedRoute from '$lib/components/ProtectedRoute.svelte';

	$: isLoginPage = $page.url.pathname === '/login' || $page.url.pathname.startsWith('/auth/');
</script>

{#if isLoginPage}
	<slot />
{:else}
	<ProtectedRoute>
		<Navbar />
		<main class="min-h-screen bg-gray-50">
			<slot />
		</main>
	</ProtectedRoute>
{/if}