<script lang="ts">
	import { user, signOut } from '$lib/auth';
	import { goto } from '$app/navigation';

	async function handleSignOut() {
		await signOut();
		goto('/login');
	}
</script>

<nav class="bg-white shadow-sm border-b">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="flex justify-between h-16">
			<div class="flex items-center">
				<h1 class="text-xl font-semibold text-gray-900">SOAP Manager</h1>
			</div>
			{#if $user}
				<div class="flex items-center space-x-4">
					<span class="text-sm text-gray-700">{$user.email}</span>
					<button
						on:click={handleSignOut}
						class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
					>
						Sign Out
					</button>
				</div>
			{/if}
		</div>
	</div>
</nav>