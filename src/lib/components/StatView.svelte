<script lang="ts">
  import RollButton from "./RollButton.svelte";
  import {
    PlayerCharacterStore,
    calculateBonusForPlayerStat,
    calculateModifierForPlayerStat,
    calculateStatValueForPlayerStat,
  } from "../model/PlayerCharacter";
  import type { Stat } from "../types";

  import { t_Stat } from "../translations";

  export let forStat: Stat;
  const pc = PlayerCharacterStore;
  $: modifier = calculateModifierForPlayerStat($pc, forStat);
  $: currentTotalStat = calculateStatValueForPlayerStat($pc, forStat);
  $: bonus = calculateBonusForPlayerStat($pc, forStat);

  function onInput(e: Event) {
    const inputVal = parseInt((e.target as HTMLInputElement).value) || 10;
    // User inputs total value, we save base value
    $pc.stats[forStat] = inputVal - bonus;
  }
</script>

<div class="flex flex-col">
  <label>
    <h2>{t_Stat(forStat)}</h2>
    <div class="sheet-stat flex gap-1">
      <input
        id={`${forStat}-input}`}
        type="number"
        inputmode="numeric"
        value={currentTotalStat}
        on:input={onInput}
        min="1"
        max="20"
        class="w-1/2"
      />&nbsp;/&nbsp;<RollButton {modifier} />
    </div>
  </label>
</div>

<style>
</style>
