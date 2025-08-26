<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { toasts } from '$lib/stores/toast';
	import Modal from '$lib/components/Modal.svelte';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import type { Hospital, Bangsal } from '$lib/db';

	let hospitals: Hospital[] = [];
	let bangsal: Bangsal[] = [];
	let selectedHospitalId: string = '';
	let loading = true;
	let bangsalLoading = false;
	let submitting = false;

	// Modal state
	let showModal = false;
	let editingBangsal: Bangsal | null = null;
	let bangsalName = '';

	// Delete confirmation
	let showDeleteModal = false;
	let bangsalToDelete: Bangsal | null = null;

	$: selectedHospital = hospitals.find((h) => h.id === selectedHospitalId);

	onMount(() => {
		const hospitalId = $page.url.searchParams.get('hospital');
		if (hospitalId) {
			selectedHospitalId = hospitalId;
		}
		loadHospitals();
	});

	$: if (selectedHospitalId) {
		loadBangsal();
		// Update URL when hospital selection changes
		const url = new URL($page.url);
		url.searchParams.set('hospital', selectedHospitalId);
		goto(url.toString(), { replaceState: true });
	}

	async function loadHospitals() {
		try {
			loading = true;
			const response = await fetch('/api/hospitals');
			const data = await response.json();

			if (!data.ok) {
				if (response.status === 403) {
					toasts.add({
						type: 'error',
						message: 'Anda tidak punya akses untuk melihat rumah sakit'
					});
				} else {
					toasts.add({
						type: 'error',
						message: data.error || 'Gagal memuat data rumah sakit'
					});
				}
				return;
			}

			hospitals = data.data || [];

			// Auto-select first hospital if none selected and hospitals available
			if (!selectedHospitalId && hospitals.length > 0) {
				selectedHospitalId = hospitals[0].id;
			}
		} catch (error) {
			console.error('Error loading hospitals:', error);
			toasts.add({
				type: 'error',
				message: 'Terjadi kesalahan saat memuat data'
			});
		} finally {
			loading = false;
		}
	}

	async function loadBangsal() {
		if (!selectedHospitalId) return;

		try {
			bangsalLoading = true;
			const response = await fetch(`/api/bangsal?hospital_id=${selectedHospitalId}`);
			const data = await response.json();

			if (!data.ok) {
				if (response.status === 403) {
					toasts.add({
						type: 'error',
						message: 'Anda tidak punya akses untuk melihat bangsal'
					});
				} else {
					toasts.add({
						type: 'error',
						message: data.error || 'Gagal memuat data bangsal'
					});
				}
				return;
			}

			bangsal = data.data || [];
		} catch (error) {
			console.error('Error loading bangsal:', error);
			toasts.add({
				type: 'error',
				message: 'Terjadi kesalahan saat memuat data'
			});
		} finally {
			bangsalLoading = false;
		}
	}

	function openCreateModal() {
		if (!selectedHospitalId) {
			toasts.add({
				type: 'error',
				message: 'Pilih rumah sakit terlebih dahulu'
			});
			return;
		}
		editingBangsal = null;
		bangsalName = '';
		showModal = true;
	}

	function openEditModal(item: Bangsal) {
		editingBangsal = item;
		bangsalName = item.name;
		showModal = true;
	}

	function closeModal() {
		showModal = false;
		editingBangsal = null;
		bangsalName = '';
	}

	async function handleSubmit() {
		if (!bangsalName.trim()) {
			toasts.add({
				type: 'error',
				message: 'Nama bangsal harus diisi'
			});
			return;
		}

		if (!selectedHospitalId) {
			toasts.add({
				type: 'error',
				message: 'Pilih rumah sakit terlebih dahulu'
			});
			return;
		}

		try {
			submitting = true;

			const url = editingBangsal ? `/api/bangsal/${editingBangsal.id}` : '/api/bangsal';
			const method = editingBangsal ? 'PUT' : 'POST';

			const body = editingBangsal
				? { name: bangsalName.trim() }
				: { hospital_id: selectedHospitalId, name: bangsalName.trim() };

			const response = await fetch(url, {
				method,
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(body)
			});

			const data = await response.json();

			if (!data.ok) {
				if (response.status === 403) {
					toasts.add({
						type: 'error',
						message: 'Anda tidak punya akses'
					});
				} else if (data.error?.includes('already exists')) {
					toasts.add({
						type: 'error',
						message: 'Bangsal dengan nama tersebut sudah ada di rumah sakit ini'
					});
				} else {
					toasts.add({
						type: 'error',
						message: data.error || 'Gagal menyimpan data'
					});
				}
				return;
			}

			// Optimistic update
			if (editingBangsal) {
				bangsal = bangsal.map((b) =>
					b.id === editingBangsal!.id ? { ...b, name: bangsalName.trim() } : b
				);
				toasts.add({
					type: 'success',
					message: 'Bangsal berhasil diperbarui'
				});
			} else {
				// For new bangsal, we need the full object with ID from the server
				bangsal = [...bangsal, data.data];
				toasts.add({
					type: 'success',
					message: 'Bangsal berhasil ditambahkan'
				});
			}

			closeModal();
		} catch (error) {
			console.error('Error saving bangsal:', error);
			toasts.add({
				type: 'error',
				message: 'Terjadi kesalahan saat menyimpan data'
			});
		} finally {
			submitting = false;
		}
	}

	function openDeleteModal(item: Bangsal) {
		bangsalToDelete = item;
		showDeleteModal = true;
	}

	function closeDeleteModal() {
		showDeleteModal = false;
		bangsalToDelete = null;
	}

	async function confirmDelete() {
		if (!bangsalToDelete) return;

		try {
			submitting = true;

			const response = await fetch(`/api/bangsal/${bangsalToDelete.id}`, {
				method: 'DELETE'
			});

			const data = await response.json();

			if (!data.ok) {
				if (response.status === 403) {
					toasts.add({
						type: 'error',
						message: 'Anda tidak punya akses'
					});
				} else {
					toasts.add({
						type: 'error',
						message: data.error || 'Gagal menghapus bangsal'
					});
				}
				return;
			}

			// Optimistic update
			bangsal = bangsal.filter((b) => b.id !== bangsalToDelete!.id);
			toasts.add({
				type: 'success',
				message: 'Bangsal berhasil dihapus'
			});

			closeDeleteModal();
		} catch (error) {
			console.error('Error deleting bangsal:', error);
			toasts.add({
				type: 'error',
				message: 'Terjadi kesalahan saat menghapus data'
			});
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>Bangsal - SOAP Manager</title>
</svelte:head>

<div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
	<div class="md:flex md:items-center md:justify-between mb-6">
		<div class="flex-1 min-w-0">
			<h2 class="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">Bangsal</h2>
			<p class="mt-1 text-sm text-gray-500">Kelola bangsal di rumah sakit Anda</p>
		</div>
		<div class="mt-4 flex md:mt-0 md:ml-4">
			<button
				type="button"
				on:click={openCreateModal}
				disabled={!selectedHospitalId}
				class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
			>
				<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
				</svg>
				Tambah Bangsal
			</button>
		</div>
	</div>

	{#if loading}
		<div class="flex justify-center items-center py-12">
			<LoadingSpinner size="lg" />
			<span class="ml-2 text-gray-600">Memuat data...</span>
		</div>
	{:else if hospitals.length === 0}
		<div class="text-center py-12">
			<svg
				class="mx-auto h-12 w-12 text-gray-400"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
				/>
			</svg>
			<h3 class="mt-2 text-sm font-medium text-gray-900">Belum ada rumah sakit</h3>
			<p class="mt-1 text-sm text-gray-500">
				Anda perlu menambahkan rumah sakit terlebih dahulu sebelum membuat bangsal.
			</p>
			<div class="mt-6">
				<a
					href="/hospitals"
					class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
				>
					<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
					</svg>
					Tambah Rumah Sakit
				</a>
			</div>
		</div>
	{:else}
		<!-- Hospital Selection -->
		<div class="mb-6">
			<label for="hospital-select" class="block text-sm font-medium text-gray-700 mb-2">
				Pilih Rumah Sakit
			</label>
			<select
				id="hospital-select"
				bind:value={selectedHospitalId}
				class="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
			>
				<option value="">Pilih rumah sakit...</option>
				{#each hospitals as hospital}
					<option value={hospital.id}>{hospital.name}</option>
				{/each}
			</select>
		</div>

		{#if selectedHospitalId}
			{#if bangsalLoading}
				<div class="flex justify-center items-center py-12">
					<LoadingSpinner size="lg" />
					<span class="ml-2 text-gray-600">Memuat bangsal...</span>
				</div>
			{:else if bangsal.length === 0}
				<div class="text-center py-12">
					<svg
						class="mx-auto h-12 w-12 text-gray-400"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2v10"
						/>
					</svg>
					<h3 class="mt-2 text-sm font-medium text-gray-900">Belum ada bangsal</h3>
					<p class="mt-1 text-sm text-gray-500">
						Mulai dengan menambahkan bangsal pertama di {selectedHospital?.name}.
					</p>
					<div class="mt-6">
						<button
							type="button"
							on:click={openCreateModal}
							class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
						>
							<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
							</svg>
							Tambah Bangsal
						</button>
					</div>
				</div>
			{:else}
				<div class="mb-4">
					<h3 class="text-lg font-medium text-gray-900">
						Bangsal di {selectedHospital?.name}
					</h3>
				</div>

				<div class="bg-white shadow overflow-hidden sm:rounded-md">
					<ul class="divide-y divide-gray-200">
						{#each bangsal as item (item.id)}
							<li>
								<div class="px-4 py-4 flex items-center justify-between">
									<div class="flex items-center">
										<div class="flex-shrink-0">
											<div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
												<svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2"
													/>
												</svg>
											</div>
										</div>
										<div class="ml-4">
											<div class="text-sm font-medium text-gray-900">{item.name}</div>
										</div>
									</div>
									<div class="flex items-center space-x-2">
										<button
											type="button"
											on:click={() => openEditModal(item)}
											class="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
										>
											Edit
										</button>
										<button
											type="button"
											on:click={() => openDeleteModal(item)}
											class="text-red-600 hover:text-red-900 text-sm font-medium"
										>
											Hapus
										</button>
									</div>
								</div>
							</li>
						{/each}
					</ul>
				</div>
			{/if}
		{:else}
			<div class="text-center py-12">
				<svg
					class="mx-auto h-12 w-12 text-gray-400"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
					/>
				</svg>
				<h3 class="mt-2 text-sm font-medium text-gray-900">Pilih Rumah Sakit</h3>
				<p class="mt-1 text-sm text-gray-500">Pilih rumah sakit untuk melihat bangsal yang tersedia.</p>
			</div>
		{/if}
	{/if}
</div>

<!-- Create/Edit Modal -->
<Modal
	isOpen={showModal}
	title={editingBangsal ? 'Edit Bangsal' : 'Tambah Bangsal'}
	onClose={closeModal}
>
	<form on:submit|preventDefault={handleSubmit}>
		<div class="mb-4">
			<label for="bangsal-name" class="block text-sm font-medium text-gray-700 mb-2">
				Nama Bangsal
			</label>
			<input
				id="bangsal-name"
				type="text"
				bind:value={bangsalName}
				placeholder="Masukkan nama bangsal"
				class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
				disabled={submitting}
				required
			/>
			{#if selectedHospital}
				<p class="mt-1 text-xs text-gray-500">
					Bangsal akan ditambahkan ke {selectedHospital.name}
				</p>
			{/if}
		</div>
		<div class="flex justify-end space-x-3">
			<button
				type="button"
				on:click={closeModal}
				disabled={submitting}
				class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
			>
				Batal
			</button>
			<button
				type="submit"
				disabled={submitting}
				class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
			>
				{#if submitting}
					<LoadingSpinner size="sm" color="white" />
					<span class="ml-2">Menyimpan...</span>
				{:else}
					{editingBangsal ? 'Perbarui' : 'Simpan'}
				{/if}
			</button>
		</div>
	</form>
</Modal>

<!-- Delete Confirmation Modal -->
<Modal
	isOpen={showDeleteModal}
	title="Hapus Bangsal"
	onClose={closeDeleteModal}
>
	{#if bangsalToDelete}
		<p class="text-sm text-gray-500 mb-4">
			Apakah Anda yakin ingin menghapus bangsal <strong>{bangsalToDelete.name}</strong>?
			Tindakan ini akan menghapus semua pasien yang terkait dengan bangsal ini.
		</p>
		<div class="flex justify-end space-x-3">
			<button
				type="button"
				on:click={closeDeleteModal}
				disabled={submitting}
				class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
			>
				Batal
			</button>
			<button
				type="button"
				on:click={confirmDelete}
				disabled={submitting}
				class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
			>
				{#if submitting}
					<LoadingSpinner size="sm" color="white" />
					<span class="ml-2">Menghapus...</span>
				{:else}
					Hapus
				{/if}
			</button>
		</div>
	{/if}
</Modal>