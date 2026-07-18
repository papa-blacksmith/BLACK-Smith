#pragma once

#include "CoreMinimal.h"
#include "Kismet/BlueprintFunctionLibrary.h"
#include "BSBalanceTypes.h"
#include "BSMaterialCalculator.generated.h"

UCLASS()
class BLACKSMITH_API UBSMaterialCalculator : public UBlueprintFunctionLibrary
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintPure, Category="BLACK Smith|Balance|Material")
    static FBSMaterialResult CombineOreSlots(const TArray<FBSOreSlotInput>& OreSlots);

    UFUNCTION(BlueprintPure, Category="BLACK Smith|Balance|Material")
    static FBSWeaponCombatStats ApplyMaterialToWeapon(
        const FBSWeaponCombatStats& BaseStats,
        const FBSMaterialResult& Material,
        EBSCombatMode Mode
    );
};
