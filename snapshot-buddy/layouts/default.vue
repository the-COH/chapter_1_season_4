<template>
  <Html class="h-full">
    <Head>
      <Title>Canto Snapshot Buddy</Title>
      <Meta name="description" content="Contract holder snapshots tool, on Canto"/>
    </Head> 
    <Body class="font-sans px-5 pt-10 text-center border-t-8 border-x-8 border-[#f04770] h-full">
      <header class="mb-10">
        <a href="/"><h1 class="text-6xl md:text-8xl font-bold tracking-tight title-text-shadow">Snapshot 📸 Buddy</h1></a>
        <h2 class="text-xl md:text-2xl font-bold mt-4 md:mt-6 leading-tight">A holders snapshot tool for the Canto blockchain</h2>
        <h3 class="mt-3 opacity-50">Brought to you by <a class="underline" href="https://buttsoncanto.club">ButtsOnCanto</a>, the #1 NFT for butts on-chain</h3>
      </header>

      <slot />

    </Body>
    <footer class="mt-12 text-center text-xs opacity-50">
      <p>Need something custom? <a href="https://twitter.com/ButtsOnCanto" class="underline">Get us on Twitter</a>.</p>
      <p class="mt-2">&copy; 2022 ButtsOnCanto</p>
      <span class="block mt-2">
        <a href="https://twitter.com/ButtsOnCanto">twitter.com/ButtsOnCanto</a>
      </span>
    </footer>
  </Html>
</template>