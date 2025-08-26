<script lang="ts">
	import { page } from '$app/stores';

	$: currentPath = $page.url.pathname;
	
	const navItems = [
		{ href: '/', label: 'Dashboard', exact: true },
		{ href: '/hospitals', label: 'Hospitals', exact: false },
		{ href: '/bangsal', label: 'Bangsal', exact: false }
	];

	function isActive(href: string, exact: boolean): boolean {
		if (exact) {
			return currentPath === href;
		}
		return currentPath.startsWith(href);
	}
</script>

<nav class="bg-white shadow-sm border-b">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="flex justify-between h-16">
			<div class="flex items-center space-x-8">
				<a href="/" class="text-xl font-semibold text-gray-900 hover:text-indigo-600">
					SOAP Manager
				</a>
				<div class="flex space-x-4">
					{#each navItems as item}
						<a
							href={item.href}
							class="px-3 py-2 rounded-md text-sm font-medium transition-colors {isActive(
								item.href,
								item.exact
							)
								? 'text-indigo-600 bg-indigo-50'
								: 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50'}"
						>
							{item.label}
						</a>
					{/each}
				</div>
			</div>
			<div class="flex items-center space-x-4">
				<span class="text-sm text-amber-700 bg-amber-100 px-2 py-1 rounded">
					🚧 Development Mode - Auth Disabled
				</span>
			</div>
		</div>
	</div>
</nav>