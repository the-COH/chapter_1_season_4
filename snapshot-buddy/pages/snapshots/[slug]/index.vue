<template>
  <section class="ring-1 ring-slate-300 md:max-w-2xl mx-auto md:px-6 md:py-8 p-4 pt-16 md:pt-14 rounded-lg shadow-xl relative overflow-hidden transition-opacity"
  :class="{'opacity-50': pending && reloadingFromFormatChange, 'pointer-events-none': pending}">

  <client-only>
    <div v-if="!showCopiedNote" @click="selectAndCopyUrl" class="cursor-pointer bg-slate-100 py-2 px-6 absolute top-0 left-0 right-0 flex flex-col md:flex-row text-xs justify-between shadow">
      <strong>Share:</strong>
      <input @click="selectAndCopyUrl" ref="urlField" disabled class="cursor-pointer mt-1 md:mt-0 grow text-right bg-transparent" type="url" v-model="currentUrl" />
    </div>    

    <div v-if="showCopiedNote" class="bg-slate-100 py-2 px-6 absolute top-0 left-0 right-0 flex flex-col md:flex-row text-xs justify-between shadow">
      <input class="mt-1 md:mt-0 grow w-full text-center bg-transparent pointer-events-none" value="📋 URL copied to clipboard!" />
    </div>        
  </client-only>
    
    <div class="text-left pt-2 md:pt-0">
      <div class="flex justify-center" v-if="pending && !reloadingFromFormatChange">
        <svg class="animate-spin h-10 w-10 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="black" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
      <div v-if="!pending || reloadingFromFormatChange" class="text-left">

        <div class="leading-tight">
          <small class="opacity-50">Contract Address</small>
          <h3><strong class="md:hidden">{{ truncateAddress }}</strong><strong class="hidden md:inline">{{ payload.contractAddress }}</strong></h3>
        </div>

        <div  v-if="payload.note"  class="leading-tight mt-2">
          <small class="opacity-50">Note</small>
          <h3>{{  payload.note }}</h3>
        </div>

        <div class="leading-tight mt-2">
          <small class="opacity-50">Snapshot Taken</small>
          <h3>{{  formattedDateTimeUtc }} UTC</h3>
        </div>        


        <div class="flex mt-2">
          <div class="leading-tight">
            <small class="opacity-50"># Addresses</small>
            <h3>{{  payload.numHolders }}</h3>
          </div>

          <div class="leading-tight ml-8">
            <small class="opacity-50"># Held Tokens</small>
            <h3>{{  payload.numTokens }}</h3>
          </div>        
        </div>
  
   



  
        <hr class="my-6" />

        <p class="mb-4">
          <small class="opacity-50 block">Snapshot Format</small>
          <label>
            <input type="radio" value="json" v-model="format" :checked="format === 'json'" class="mr-1" />
            JSON
          </label>
          <label class="ml-4">
            <input type="radio" value="csv" v-model="format" :checked="format === 'csv'" class="mr-1" />
            CSV
          </label>
        </p>

        <textarea @click="selectAll" spellcheck="false" ref="textarea" class="shadow-inner w-full font-mono text-xs h-[500px] p-2 ring-1 ring-slate-300 rounded r">{{ pending ? 'Loading...' : snapshotData }}</textarea>
        

      </div>    
    </div>
  </section>
</template>

<script setup>
  const route = useRoute();
  const { pending, refresh, data: payload } = useLazyAsyncData('snapshot', () => $fetch(`https://snapshot-buddy.buttsoncanto.club/api/show?requestId=${route.params.slug}&format=${format.value}`), {immediate: false})
  onMounted( () => {
    refresh()
  })

  const textarea = ref(null)
  const format = ref('json');
  const urlField = ref(null)

  const reloadingFromFormatChange = ref(false)

  // Watch the format for changes, and when changed refresh the payload
  watch(format, () => {
    reloadingFromFormatChange.value = true
    refresh()
  })

  const currentUrl = computed( () => {
    return window.location.href
  })

  const showCopiedNote = ref(false)

  const selectAndCopyUrl = () => {
    urlField.value.setSelectionRange(0, urlField.value.value.length)
    navigator.clipboard.writeText(window.location.href).then(() => {
      showCopiedNote.value = true
      setTimeout( () => {
        showCopiedNote.value = false
      }, 1000)
    })
  }

  const snapshotData = computed( () => {
    if (payload.value) {
      if (format.value === 'json') {
        return payload.value.json
      } else {
        return payload.value.csv
      }
    }
  })

  const truncateAddress = computed(() => {
    if (payload.value?.contractAddress) {
      return payload.value.contractAddress.slice(0, 6) + '...' + payload.value.contractAddress.slice(-6)
    }
  })

  const selectAll = () => {
    textarea.value.setSelectionRange(0, textarea.value.value.length)
  }

  const formattedDateTimeUtc = computed( () => {
    if (payload.value) {
      return new Date(payload.value.createdAt).toLocaleString('en-US', { timeZone: 'UTC', year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true })      
    }
  })

  const formattedDateTimeLocal = computed( () => {
    return new Date(payload.value.createdAt).toLocaleString('en-US', {  year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true })
  })
  

</script>

