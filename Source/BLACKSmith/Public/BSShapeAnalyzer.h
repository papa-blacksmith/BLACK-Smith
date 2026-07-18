#pragma once

#include "CoreMinimal.h"
#include "Kismet/BlueprintFunctionLibrary.h"
#include "BSBalanceTypes.h"
#include "BSShapeAnalyzer.generated.h"

UCLASS()
class BLACKSMITH_API UBSShapeAnalyzer : public UBlueprintFunctionLibrary
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintPure, Category="BLACK Smith|Balance|Shape")
    static FBSShapeMetrics AnalyzeShape(const FBSShapeInput& Input);

    UFUNCTION(BlueprintPure, Category="BLACK Smith|Balance|Shape")
    static FBSWeaponCombatStats BuildBaseWeaponStats(
        const FBSShapeMetrics& Metrics,
        EBSWeaponClass WeaponClass,
        EBSRarity Rarity
    );
};
