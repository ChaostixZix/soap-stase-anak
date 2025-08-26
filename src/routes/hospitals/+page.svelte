<script lang="ts">
	import { onMount } from 'svelte';
	import { toasts } from '$lib/stores/toast';
	import Modal from '$lib/components/Modal.svelte';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import type { Hospital } from '$lib/db';

	let hospitals: Hospital[] = [];
	let loading = true;
	let submitting = false;

	// Modal state
	let showModal = false;
	let editingHospital: Hospital | null = null;
	let hospitalName = '';

	// Delete confirmation
	let showDeleteModal = false;
	let hospitalToDelete: Hospital | null = null;

	onMount(() => {
		loadHospitals();
	});

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

	function openCreateModal() {
		editingHospital = null;
		hospitalName = '';
		showModal = true;
	}

	function openEditModal(hospital: Hospital) {
		editingHospital = hospital;
		hospitalName = hospital.name;
		showModal = true;
	}

	function closeModal() {
		showModal = false;
		editingHospital = null;
		hospitalName = '';
	}

	async function handleSubmit() {
		if (!hospitalName.trim()) {
			toasts.add({
				type: 'error',
				message: 'Nama rumah sakit harus diisi'
			});
			return;
		}

		try {
			submitting = true;

			const url = editingHospital ? `/api/hospitals/${editingHospital.id}` : '/api/hospitals';
			const method = editingHospital ? 'PUT' : 'POST';

			const response = await fetch(url, {
				method,
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ name: hospitalName.trim() })
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
						message: 'Rumah sakit dengan nama tersebut sudah ada'
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
			if (editingHospital) {
				hospitals = hospitals.map((h) =>
					h.id === editingHospital!.id ? { ...h, name: hospitalName.trim() } : h
				);
				toasts.add({
					type: 'success',
					message: 'Rumah sakit berhasil diperbarui'
				});
			} else {
				// For new hospitals, we need the full object with ID from the server
				hospitals = [...hospitals, data.data];
				toasts.add({
					type: 'success',
					message: 'Rumah sakit berhasil ditambahkan'
				});
			}

			closeModal();
		} catch (error) {
			console.error('Error saving hospital:', error);
			toasts.add({
				type: 'error',
				message: 'Terjadi kesalahan saat menyimpan data'
			});
		} finally {
			submitting = false;
		}
	}

	function openDeleteModal(hospital: Hospital) {
		hospitalToDelete = hospital;
		showDeleteModal = true;
	}

	function closeDeleteModal() {
		showDeleteModal = false;
		hospitalToDelete = null;
	}

	async function confirmDelete() {
		if (!hospitalToDelete) return;

		try {
			submitting = true;

			const response = await fetch(`/api/hospitals/${hospitalToDelete.id}`, {
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
						message: data.error || 'Gagal menghapus rumah sakit'
					});
				}
				return;
			}

			// Optimistic update
			hospitals = hospitals.filter((h) => h.id !== hospitalToDelete!.id);
			toasts.add({
				type: 'success',
				message: 'Rumah sakit berhasil dihapus'
			});

			closeDeleteModal();
		} catch (error) {
			console.error('Error deleting hospital:', error);
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
	<title>Rumah Sakit - SOAP Manager</title>
</svelte:head>

<div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
	<div class="md:flex md:items-center md:justify-between mb-6">
		<div class="flex-1 min-w-0">
			<h2 class="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">Rumah Sakit</h2>
			<p class="mt-1 text-sm text-gray-500">Kelola rumah sakit tempat Anda bertugas</p>
		</div>
		<div class="mt-4 flex md:mt-0 md:ml-4">
			<button
				type="button"
				on:click={openCreateModal}
				class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
			>
				<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
				</svg>
				Tambah Rumah Sakit
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
			<p class="mt-1 text-sm text-gray-500">Mulai dengan menambahkan rumah sakit pertama Anda.</p>
			<div class="mt-6">
				<button
					type="button"
					on:click={openCreateModal}
					class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
				>
					<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
					</svg>
					Tambah Rumah Sakit
				</button>
			</div>
		</div>
	{:else}
		<div class="bg-white shadow overflow-hidden sm:rounded-md">
			<ul class="divide-y divide-gray-200">
				{#each hospitals as hospital (hospital.id)}
					<li>
						<div class="px-4 py-4 flex items-center justify-between">
							<div class="flex items-center">
								<div class="flex-shrink-0">
									<div class="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
										<svg class="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
											/>
										</svg>
									</div>
								</div>
								<div class="ml-4">
									<div class="text-sm font-medium text-gray-900">{hospital.name}</div>
								</div>
							</div>
							<div class="flex items-center space-x-2">
								<button
									type="button"
									on:click={() => openEditModal(hospital)}
									class="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
								>
									Edit
								</button>
								<button
									type="button"
									on:click={() => openDeleteModal(hospital)}
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
</div>

<!-- Create/Edit Modal -->
<Modal
	isOpen={showModal}
	title={editingHospital ? 'Edit Rumah Sakit' : 'Tambah Rumah Sakit'}
	onClose={closeModal}
>
	<form on:submit|preventDefault={handleSubmit}>
		<div class="mb-4">
			<label for="hospital-name" class="block text-sm font-medium text-gray-700 mb-2">
				Nama Rumah Sakit
			</label>
			<input
				id="hospital-name"
				type="text"
				bind:value={hospitalName}
				placeholder="Masukkan nama rumah sakit"
				class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
				disabled={submitting}
				required
			/>
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
					{editingHospital ? 'Perbarui' : 'Simpan'}
				{/if}
			</button>
		</div>
	</form>
</Modal>

<!-- Delete Confirmation Modal -->
<Modal
	isOpen={showDeleteModal}
	title="Hapus Rumah Sakit"
	onClose={closeDeleteModal}
>
	{#if hospitalToDelete}
		<p class="text-sm text-gray-500 mb-4">
			Apakah Anda yakin ingin menghapus rumah sakit <strong>{hospitalToDelete.name}</strong>?
			Tindakan ini akan menghapus semua bangsal dan pasien yang terkait.
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