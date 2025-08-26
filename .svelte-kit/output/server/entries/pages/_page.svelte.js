import { c as create_ssr_component, a as subscribe, v as validate_component, b as add_attribute, e as each, d as escape } from "../../chunks/ssr.js";
import { p as page } from "../../chunks/stores.js";
import "@sveltejs/kit/internal";
import "../../chunks/exports.js";
import "../../chunks/utils.js";
import "../../chunks/state.svelte.js";
import "../../chunks/toast.js";
import { L as LoadingSpinner, M as Modal } from "../../chunks/LoadingSpinner.js";
function goto(url, opts = {}) {
  {
    throw new Error("Cannot call goto(...) on the server");
  }
}
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $page, $$unsubscribe_page;
  $$unsubscribe_page = subscribe(page, (value) => $page = value);
  let hospitals = [];
  let bangsalList = [];
  let submitting = false;
  let selectedHospitalId = "";
  let selectedBangsalId = "";
  let searchTerm = "";
  let showPatientModal = false;
  let newPatient = {
    full_name: "",
    mrn: "",
    room_number: "",
    hospital_id: ""
  };
  function updateURLParams(hospitalId, bangsalId, search) {
    if (typeof window === "undefined") return;
    const url = new URL($page.url);
    {
      url.searchParams.delete("hospital");
    }
    {
      url.searchParams.delete("bangsal");
    }
    if (search.trim()) {
      url.searchParams.set("search", search.trim());
    } else {
      url.searchParams.delete("search");
    }
    goto(url.toString(), {});
  }
  function closePatientModal() {
    showPatientModal = false;
    newPatient = {
      full_name: "",
      mrn: "",
      room_number: "",
      hospital_id: "",
      bangsal_id: ""
    };
  }
  hospitals.find((h) => h.id === selectedHospitalId);
  bangsalList.filter((b) => b.hospital_id === selectedHospitalId);
  {
    updateURLParams(selectedHospitalId, selectedBangsalId, searchTerm);
  }
  $$unsubscribe_page();
  return `${$$result.head += `<!-- HEAD_svelte-1bnk1kx_START -->${$$result.title = `<title>Dashboard - SOAP Manager</title>`, ""}<!-- HEAD_svelte-1bnk1kx_END -->`, ""} <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8"> <div class="md:flex md:items-center md:justify-between mb-6"><div class="flex-1 min-w-0" data-svelte-h="svelte-gzo2ei"><h2 class="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">Dashboard Pasien</h2> <p class="mt-1 text-sm text-gray-500">Kelola dan cari pasien berdasarkan rumah sakit dan bangsal</p></div> <div class="mt-4 flex md:mt-0 md:ml-4"><button type="button" ${"disabled"} class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"><svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
				Tambah Pasien</button></div></div> ${`<div class="flex justify-center items-center py-12">${validate_component(LoadingSpinner, "LoadingSpinner").$$render($$result, { size: "lg" }, {}, {})} <span class="ml-2 text-gray-600" data-svelte-h="svelte-18l6m4c">Memuat data...</span></div>`}</div>  ${validate_component(Modal, "Modal").$$render(
    $$result,
    {
      isOpen: showPatientModal,
      title: "Tambah Pasien Baru",
      onClose: closePatientModal
    },
    {},
    {
      default: () => {
        return `<form><div class="space-y-4"><div><label for="patient-name" class="block text-sm font-medium text-gray-700 mb-2" data-svelte-h="svelte-11napxx">Nama Lengkap *</label> <input id="patient-name" type="text" placeholder="Masukkan nama lengkap pasien" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" ${""} required${add_attribute("value", newPatient.full_name, 0)}></div> <div><label for="patient-mrn" class="block text-sm font-medium text-gray-700 mb-2" data-svelte-h="svelte-c3hexv">Medical Record Number (MRN)</label> <input id="patient-mrn" type="text" placeholder="Opsional" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" ${""}${add_attribute("value", newPatient.mrn, 0)}></div> <div><label for="patient-room" class="block text-sm font-medium text-gray-700 mb-2" data-svelte-h="svelte-1lr3rhx">Nomor Ruangan</label> <input id="patient-room" type="text" placeholder="Opsional" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" ${""}${add_attribute("value", newPatient.room_number, 0)}></div> <div><label for="patient-hospital" class="block text-sm font-medium text-gray-700 mb-2" data-svelte-h="svelte-vd4yw8">Rumah Sakit *</label> <select id="patient-hospital" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" ${""} required><option value="" data-svelte-h="svelte-qte55x">Pilih rumah sakit...</option>${each(hospitals, (hospital) => {
          return `<option${add_attribute("value", hospital.id, 0)}>${escape(hospital.name)}</option>`;
        })}</select></div> <div><label for="patient-bangsal" class="block text-sm font-medium text-gray-700 mb-2" data-svelte-h="svelte-i1523t">Bangsal *</label> <select id="patient-bangsal" ${!newPatient.hospital_id || submitting ? "disabled" : ""} class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed" required><option value="" data-svelte-h="svelte-w6naa">Pilih bangsal...</option>${each(bangsalList.filter((b) => b.hospital_id === newPatient.hospital_id), (bangsal) => {
          return `<option${add_attribute("value", bangsal.id, 0)}>${escape(bangsal.name)}</option>`;
        })}</select></div></div> <div class="flex justify-end space-x-3 mt-6"><button type="button" ${""} class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">Batal</button> <button type="submit" ${""} class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">${`Simpan`}</button></div></form>`;
      }
    }
  )}`;
});
export {
  Page as default
};
