<script lang="ts">
	import '../app.css';
	import Navbar from '$lib/components/Navbar.svelte';

	// Authentication temporarily disabled for development
	// const DISABLE_AUTH = true;
</script>

<!-- Auth temporarily disabled for development -->
<Navbar />
<main class="min-h-screen bg-gray-50">
	<slot />
</main>