<script lang="ts">
	import { supabase } from '$lib/supabaseClient';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let email = '';
	let loading = false;
	let message = '';
	let error = '';

	onMount(() => {
		// Check if user is already authenticated
		supabase.auth.getSession().then(({ data: { session } }) => {
			if (session) {
				goto('/');
			}
		});
	});

	async function handleLogin() {
		try {
			loading = true;
			error = '';
			message = '';

			const { error: signInError } = await supabase.auth.signInWithOtp({
				email,
				options: {
					emailRedirectTo: `${window.location.origin}/auth/callback`
				}
			});

			if (signInError) throw signInError;

			message = 'Check your email for the magic link!';
		} catch (err) {
			error = err?.message || 'An error occurred';
		} finally {
			loading = false;
		}
	}
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
	<div class="max-w-md w-full space-y-8">
		<div>
			<h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
				Sign in to SOAP Manager
			</h2>
			<p class="mt-2 text-center text-sm text-gray-600">
				We'll send you a magic link to sign in
			</p>
		</div>
		<form on:submit|preventDefault={handleLogin} class="mt-8 space-y-6">
			<div>
				<label for="email" class="sr-only">Email address</label>
				<input
					id="email"
					type="email"
					bind:value={email}
					required
					class="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
					placeholder="Email address"
				/>
			</div>

			{#if error}
				<div class="text-red-600 text-sm text-center">{error}</div>
			{/if}

			{#if message}
				<div class="text-green-600 text-sm text-center">{message}</div>
			{/if}

			<div>
				<button
					type="submit"
					disabled={loading}
					class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{loading ? 'Sending...' : 'Send Magic Link'}
				</button>
			</div>
		</form>
	</div>
</div>