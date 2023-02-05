<template>


<section class="ring-1 ring-slate-300 md:max-w-lg mx-auto md:px-6 md:py-8 p-4 rounded-lg shadow-xl">

  <form @submit.prevent="postForm" :disabled="isLoading">

    <p class="text-left">
      <label>
        <span class="block mb-1"
        :class="!isAddressValid ? 'text-[#FF0000]' : 'text-black'"
        >Contract Address</span>
        <input
          :disabled="isLoading"
          v-model.trim="contractAddress"
          autofocus
          maxlength="42"
          type="text"
          placeholder="0x997306BEb36204E12A9A4B1783319cDD4C539aEB"
          class="focus:border-black focus:outline-0 w-full border-2 rounded-md rounded p-2"
          :class="!isAddressValid ? 'border-red-500 bg-red-50' : 'border-gray-300'"
        />
      </label>
    </p>
    
    <p class="text-left mt-6">
      <label>
        <span class="block mb-1">
          Contract Name or Note
        </span>
        <input maxlength="50" :disabled="isLoading"  v-model="note" autofocus type="text" placeholder="Butts on Canto for the $BONK Snapshot" class="focus:border-black focus:outline-0 w-full border-2 rounded-md border-gray-300 rounded p-2"  />
        <span class="text-xs block mt-1 opacity-75">This will public if you choose to share the snapshot results.</span>
      </label>
    </p>

    <p class="text-left mt-6">
      <button :disabled="isLoading || !allowSubmission"
      :class="{'opacity-50': !allowSubmission}"
      type="submit" class="
      shadow-xl
      w-full flex px-6 py-4 text-black bg-[#25d9ea] font-bold md:text-xl leading-tight uppercase rounded-md hover:bg-black hover:text-white focus:outline-none focus:ring-0 transition duration-150 ease-in-out text-center items-center justify-center flex text-center
      disabled:pointer-events-none
      ">
      <span class="inline scale-125 mr-3  origin-center animate-bounce scale-125" v-if="isLoading">
        📷
      </span>


    <template v-if="isLoading">
      Loading... 
    </template>
    <span class="inline scale-125 ml-3  origin-center animate-bounce scale-125" v-if="isLoading">
         📷
      </span>
    
    <template v-if="!isLoading">
      Generate Snapshot
    </template>
    
</button>
    </p>
    



  </form>
</section>

<div class="rounded shadow-xl bg-gray-100 md:max-w-lg mx-auto py-2 px-6 mt-10 text-xs font-mono flex flex-col md:flex-row justify-between
hover:scale-105 transition-all
" v-if="countData">
  <strong>Total Processed:</strong>
  <span class="block mt-2 md:mt-0">
    {{ countData.totalRequests.toLocaleString() }} contracts  &middot;
    {{ countData.totalHolders.toLocaleString() }} wallets  &middot;
    {{ countData.totalTokens.toLocaleString() }} tokens
  </span>
</div>

</template>

<script setup>
  import { ethers } from 'ethers'
  const contractAddress = ref("");
  const note = ref("");
  const isLoading = ref(false)
  const processedRequestId = ref(false)


  const { data: countData } = useLazyAsyncData('snapshot', () => $fetch(`https://snapshot-buddy.buttsoncanto.club/api/show?globalCountsOnly=1`))
  
  const router = useRouter();

  const allowSubmission = computed( () => {
    return isAddressValid.value && contractAddress.value !== ''
  })

  const isAddressValid = computed( () => {
    return contractAddress.value === '' || ethers.utils.isAddress(formattedAddress.value);
  })

  const formattedAddress = computed( () => {
    try {
      return ethers.utils.getAddress(contractAddress.value.toLowerCase())
    } catch {
      return false
    }
  })

  const postForm = () => {
    isLoading.value = true
    const url = "https://snapshot-buddy.buttsoncanto.club/api/index";
    const options = {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json;charset=UTF-8",
      },
      body: JSON.stringify({
        address: contractAddress.value,
        note: note.value,
      })
    };
    fetch(url, options)
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        router.push({ path: `/snapshots/${data.requestId}` });
        isLoading.value = false
      });
  }

</script>