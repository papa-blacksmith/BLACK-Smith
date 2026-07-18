#include "BSMaterialCalculator.h"

FBSMaterialResult UBSMaterialCalculator::CombineOreSlots(
    const TArray<FBSOreSlotInput>& OreSlots
)
{
    FBSMaterialResult Result;
    const int32 Count = FMath::Clamp(OreSlots.Num(), 0, 5);

    if (Count == 0)
    {
        Result.SourceOres.Add(TEXT("DEFAULT_COMMON"));
        return Result;
    }

    float DensitySum = 0.0f;
    float HardnessSum = 0.0f;
    float WeightSum = 0.0f;

    for (int32 Index = 0; Index < Count; ++Index)
    {
        const FBSOreSlotInput& Ore = OreSlots[Index];
        const float RarityWeight = 1.0f + static_cast<int32>(Ore.Rarity) * 0.12f;

        DensitySum += Ore.Density * RarityWeight;
        HardnessSum += Ore.Hardness * RarityWeight;
        WeightSum += RarityWeight;

        Result.AttackFlat += Ore.AttackFlat;
        Result.AttackPercent += Ore.AttackPercent;
        Result.SpeedPercent += Ore.SpeedPercent;
        Result.DurabilityPercent += Ore.DurabilityPercent;
        Result.SourceOres.Add(Ore.OreId);

        if (!Ore.Element.IsNone())
        {
            Result.ElementWeights.FindOrAdd(Ore.Element) += RarityWeight;
        }
    }

    Result.Density = DensitySum / FMath::Max(WeightSum, 0.001f);
    Result.Hardness = HardnessSum / FMath::Max(WeightSum, 0.001f);

    // PvP safety caps are applied later by combat mode.
    return Result;
}

FBSWeaponCombatStats UBSMaterialCalculator::ApplyMaterialToWeapon(
    const FBSWeaponCombatStats& BaseStats,
    const FBSMaterialResult& Material,
    EBSCombatMode Mode
)
{
    FBSWeaponCombatStats Result = BaseStats;

    float FlatAttack = Material.AttackFlat;
    float AttackPercent = Material.AttackPercent;

    if (Mode == EBSCombatMode::PvP)
    {
        FlatAttack = FMath::Clamp(FlatAttack, -6.0f, 6.0f);
        AttackPercent = FMath::Clamp(AttackPercent, -5.0f, 5.0f);
    }

    Result.Attack = (Result.Attack + FlatAttack) * (1.0f + AttackPercent / 100.0f);
    Result.AttackSpeed *= 1.0f + FMath::Clamp(Material.SpeedPercent, -35.0f, 35.0f) / 100.0f;
    Result.Durability *= 1.0f + FMath::Clamp(Material.DurabilityPercent, -50.0f, 100.0f) / 100.0f;

    const float DensityRatio = Material.Density / 7.8f;
    Result.Weight *= FMath::Clamp(DensityRatio, 0.45f, 2.5f);
    Result.StaminaCost *= FMath::Clamp(FMath::Pow(DensityRatio, 0.35f), 0.7f, 1.55f);
    Result.GuardPower *= FMath::Clamp(0.85f + Material.Hardness * 0.15f, 0.65f, 1.6f);

    for (const TPair<FName, float>& Element : Material.ElementWeights)
    {
        Result.ElementDamage.FindOrAdd(Element.Key) += Element.Value * 2.5f;
    }

    Result.SourceOres = Material.SourceOres;
    return Result;
}
