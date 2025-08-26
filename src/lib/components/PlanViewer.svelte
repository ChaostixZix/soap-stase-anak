<script lang="ts">
  import { splitPlanItems, formatPlanItemForDisplay } from '$lib/plan.js';
  import type { PlanItem } from '$lib/db.js';

  export let planItems: PlanItem[] = [];
  export let showHeader = true;
  export let className = '';

  $: ({ active: activePlan, done: donePlan } = splitPlanItems(planItems));
  $: hasAnyPlan = activePlan.length > 0 || donePlan.length > 0;
</script>

<div class={`bg-white shadow-sm rounded-lg ${className}`}>
  {#if showHeader}
    <div class="px-6 py-4 border-b border-gray-200">
      <h2 class="text-lg font-medium text-gray-900">Plan (P)</h2>
      <p class="mt-1 text-sm text-gray-500">
        Treatment plan split by status • {activePlan.length} active • {donePlan.length} completed
      </p>
    </div>
  {/if}
  
  <div class="px-6 py-4">
    {#if hasAnyPlan}
      <!-- Active Plan -->
      {#if activePlan.length > 0}
        <div class="mb-6">
          <div class="flex items-center mb-3">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Plan Aktif ({activePlan.length})
            </span>
          </div>
          <div class="space-y-2">
            {#each activePlan as item, index}
              <div class="flex items-start space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <div class="flex-shrink-0 mt-0.5">
                  <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm text-gray-900 font-medium">
                    {formatPlanItemForDisplay(item)}
                  </p>
                  {#if item.start_date !== item.end_date}
                    <p class="text-xs text-green-700 mt-1">
                      Started: {new Date(item.start_date).toLocaleDateString('en-GB', { 
                        timeZone: 'Asia/Jakarta', 
                        day: '2-digit', 
                        month: 'short' 
                      })}
                    </p>
                  {/if}
                </div>
                <div class="flex-shrink-0">
                  <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Completed Plan -->
      {#if donePlan.length > 0}
        <div>
          <div class="flex items-center mb-3">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
              ━━━━ Plan Selesai ({donePlan.length})
            </span>
          </div>
          <div class="space-y-2">
            {#each donePlan as item, index}
              <div class="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div class="flex-shrink-0 mt-0.5">
                  <div class="w-2 h-2 bg-gray-400 rounded-full"></div>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm text-gray-600">
                    {formatPlanItemForDisplay(item)}
                  </p>
                  <p class="text-xs text-gray-500 mt-1">
                    Completed: {new Date(item.end_date).toLocaleDateString('en-GB', { 
                      timeZone: 'Asia/Jakarta', 
                      day: '2-digit', 
                      month: 'short' 
                    })}
                  </p>
                </div>
                <div class="flex-shrink-0">
                  <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                    Done
                  </span>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    {:else}
      <!-- Empty state -->
      <div class="text-center py-8">
        <span class="text-4xl text-gray-300 mb-4 block">📋</span>
        <h3 class="text-sm font-medium text-gray-500 mb-2">No Treatment Plan</h3>
        <p class="text-xs text-gray-400 max-w-sm mx-auto">
          No plan items have been recorded yet. Use the natural language command box to add medications and treatments.
        </p>
      </div>
    {/if}
  </div>
</div>