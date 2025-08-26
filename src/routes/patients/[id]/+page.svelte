<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import type { Patient } from '$lib/db.js';

  export let data: { patient: Patient | null };

  const patientId = $page.params.id;
  let patient: Patient | null = data?.patient || null;
  let loading = !patient;
  let error = '';

  async function loadPatient() {
    if (patient) return; // Already loaded
    
    loading = true;
    error = '';
    
    try {
      const response = await fetch(`/api/patients/${patientId}`);
      const result = await response.json();
      
      if (response.ok && result.success) {
        patient = result.data;
      } else {
        error = result.error || 'Failed to load patient';
      }
    } catch (e) {
      error = 'Failed to load patient';
      console.error('Error loading patient:', e);
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    if (!patient) {
      loadPatient();
    }
  });
</script>

<svelte:head>
  <title>{patient ? `${patient.full_name} - Profile` : 'Loading Patient'} | SOAP Manager</title>
</svelte:head>

<div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
  {#if loading}
    <div class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      <span class="ml-3 text-gray-600">Loading patient...</span>
    </div>
  {:else if error}
    <div class="bg-red-50 border border-red-200 rounded-lg p-4">
      <div class="flex">
        <div class="flex-shrink-0">
          <span class="text-red-400 text-xl">❌</span>
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">Error Loading Patient</h3>
          <p class="mt-1 text-sm text-red-700">{error}</p>
          <button 
            class="mt-2 text-sm text-red-800 underline hover:text-red-900"
            on:click={loadPatient}
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  {:else if patient}
    <!-- Patient Header -->
    <div class="bg-white shadow-sm rounded-lg">
      <div class="px-6 py-4 border-b border-gray-200">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">{patient.full_name}</h1>
            <p class="text-sm text-gray-600">Patient Profile</p>
          </div>
          <div class="flex space-x-2">
            <a 
              href="/patients/{patient.id}/soap" 
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              View SOAP
            </a>
          </div>
        </div>
      </div>

      <!-- Patient Details -->
      <div class="px-6 py-4">
        <dl class="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
          <div>
            <dt class="text-sm font-medium text-gray-500">Full Name</dt>
            <dd class="mt-1 text-sm text-gray-900">{patient.full_name}</dd>
          </div>

          {#if patient.mrn}
            <div>
              <dt class="text-sm font-medium text-gray-500">MRN</dt>
              <dd class="mt-1 text-sm text-gray-900">{patient.mrn}</dd>
            </div>
          {/if}

          <div>
            <dt class="text-sm font-medium text-gray-500">Hospital</dt>
            <dd class="mt-1 text-sm text-gray-900">{patient.hospital?.name || 'Unknown'}</dd>
          </div>

          <div>
            <dt class="text-sm font-medium text-gray-500">Bangsal</dt>
            <dd class="mt-1 text-sm text-gray-900">{patient.bangsal?.name || 'Unknown'}</dd>
          </div>

          {#if patient.room_number}
            <div>
              <dt class="text-sm font-medium text-gray-500">Room Number</dt>
              <dd class="mt-1 text-sm text-gray-900">{patient.room_number}</dd>
            </div>
          {/if}

          <div>
            <dt class="text-sm font-medium text-gray-500">Created</dt>
            <dd class="mt-1 text-sm text-gray-900">
              {new Date(patient.created_at).toLocaleDateString('en-GB', {
                timeZone: 'Asia/Jakarta',
                day: '2-digit',
                month: 'short', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </dd>
          </div>
        </dl>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <a
        href="/patients/{patient.id}/soap"
        class="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      >
        <div class="flex items-center space-x-3">
          <div class="flex-shrink-0">
            <span class="text-2xl">📋</span>
          </div>
          <div class="min-w-0 flex-1">
            <span class="absolute inset-0" aria-hidden="true"></span>
            <p class="text-sm font-medium text-gray-900">Latest SOAP</p>
            <p class="truncate text-sm text-gray-500">View and edit medical records</p>
          </div>
        </div>
      </a>

      <button
        type="button"
        class="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        disabled
      >
        <div class="flex items-center space-x-3">
          <div class="flex-shrink-0">
            <span class="text-2xl">📊</span>
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium text-gray-400">Reports</p>
            <p class="truncate text-sm text-gray-400">Coming soon</p>
          </div>
        </div>
      </button>

      <button
        type="button"
        class="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        disabled
      >
        <div class="flex items-center space-x-3">
          <div class="flex-shrink-0">
            <span class="text-2xl">📞</span>
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium text-gray-400">Contact Info</p>
            <p class="truncate text-sm text-gray-400">Coming soon</p>
          </div>
        </div>
      </button>
    </div>
  {:else}
    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div class="flex">
        <div class="flex-shrink-0">
          <span class="text-yellow-400 text-xl">⚠️</span>
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-yellow-800">Patient Not Found</h3>
          <p class="mt-1 text-sm text-yellow-700">The requested patient could not be found.</p>
        </div>
      </div>
    </div>
  {/if}
</div>