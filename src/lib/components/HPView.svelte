<script lang="ts">
  import {
    calculateTotalHitPointsForPlayer,
    PlayerCharacterStore as pc,
  } from "../model/PlayerCharacter";

  function incrMaxHp() {
    $pc.maxHitPoints += 1;
  }
  function decrMaxHp() {
    $pc.maxHitPoints = Math.max(1, $pc.maxHitPoints - 1);
    if ($pc.hitPoints > $pc.maxHitPoints) {
      $pc.hitPoints = $pc.maxHitPoints;
    }
  }
  function longRest() {
    $pc.hitPoints = $pc.maxHitPoints;
    $pc.spells = $pc.spells.map((s) => ({ name: s.name, failed: false }));
  }
</script>

<h2>生命值</h2>
<label for="hitpoints" />
<input
  id="hitpoints"
  type="number"
  inputmode="numeric"
  class="pirata text-5xl text-center"
  min="0"
  bind:value={$pc.hitPoints}
/>

<div class="flex gap-1 justify-between items-center text-sm mt-1">
  <div class="whitespace-nowrap">
    最大值: {calculateTotalHitPointsForPlayer($pc)}
  </div>
  <div class="flex items-center">
    <button class="hover:bg-gray-700 rounded" on:click={decrMaxHp}
      ><i class="material-icons text-base align-middle">remove</i></button
    >
    <button class="hover:bg-gray-700 rounded" on:click={incrMaxHp}
      ><i class="material-icons text-base align-middle">add</i></button
    >
  </div>
</div>

<button
  class="bg-black text-white rounded-md text-sm self-center px-2"
  on:click={longRest}>長休</button
>
