<script lang="ts">
	import NLCommandBox from './NLCommandBox.svelte';
	
	let showMobileMenu = false;
	let showNLCommand = false;

	function toggleMobileMenu() {
		showMobileMenu = !showMobileMenu;
	}

	function toggleNLCommand() {
		showNLCommand = !showNLCommand;
	}
</script>

<nav class="bg-white shadow-sm border-b">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="flex justify-between h-16">
			<!-- Left side -->
			<div class="flex items-center space-x-6">
				<a href="/" class="text-xl font-semibold text-gray-900 hover:text-indigo-600">
					SOAP Manager
				</a>
				
				<!-- Desktop Navigation -->
				<div class="hidden md:flex items-center space-x-4">
					<a href="/hospitals" class="text-sm text-gray-600 hover:text-gray-900">Hospitals</a>
					<a href="/patients" class="text-sm text-gray-600 hover:text-gray-900">Patients</a>
				</div>
			</div>

			<!-- Right side -->
			<div class="flex items-center space-x-3">
				<!-- NL Command Toggle (Desktop) -->
				<button
					type="button"
					class="hidden md:inline-flex items-center px-3 py-2 border border-indigo-300 text-sm font-medium rounded-md text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
					on:click={toggleNLCommand}
				>
					🤖 NL Commands
				</button>

				<!-- Development Mode Badge -->
				<span class="hidden sm:inline text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded">
					🚧 Dev Mode
				</span>

				<!-- Mobile menu button -->
				<button
					type="button"
					class="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
					on:click={toggleMobileMenu}
				>
					<span class="sr-only">Open main menu</span>
					{#if showMobileMenu}
						<!-- X icon -->
						<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					{:else}
						<!-- Menu icon -->
						<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
						</svg>
					{/if}
				</button>
			</div>
		</div>

		<!-- Mobile menu -->
		{#if showMobileMenu}
			<div class="md:hidden border-t border-gray-200 py-3">
				<div class="space-y-1">
					<a href="/hospitals" class="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50">
						Hospitals
					</a>
					<a href="/patients" class="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50">
						Patients
					</a>
					<button
						type="button"
						class="block w-full text-left px-3 py-2 text-base font-medium text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50"
						on:click={toggleNLCommand}
					>
						🤖 NL Commands
					</button>
				</div>
			</div>
		{/if}

		<!-- Global NL Command Box (when activated) -->
		{#if showNLCommand}
			<div class="border-t border-gray-200 py-4">
				<NLCommandBox 
					placeholder="Global command (e.g., 'Apa diagnosis Bintang?' or 'Cari pasien Nisa')"
					on:result={() => showNLCommand = false}
				/>
			</div>
		{/if}
	</div>
</nav>