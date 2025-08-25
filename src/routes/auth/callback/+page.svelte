<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabaseClient';

	onMount(async () => {
		const {
			data: { session },
			error
		} = await supabase.auth.getSession();

		if (error) {
			console.error('Error getting session:', error);
			goto('/login?error=auth-callback');
			return;
		}

		if (session) {
			goto('/');
		} else {
			goto('/login');
		}
	});
</script>

<div class="min-h-screen flex items-center justify-center">
	<div class="text-center">
		<div class="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
		<p class="mt-4 text-gray-600">Signing you in...</p>
	</div>
</div>