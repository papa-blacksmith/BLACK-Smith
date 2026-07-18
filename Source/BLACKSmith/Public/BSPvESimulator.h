#pragma once

#include "CoreMinimal.h"
#include "Kismet/BlueprintFunctionLibrary.h"
#include "BSBalanceTypes.h"
#include "BSPvESimulator.generated.h"

UCLASS()
class BLACKSMITH_API UBSPvESimulator : public UBlueprintFunctionLibrary
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="BLACK Smith|Balance|PvE")
    static FBSPvEResult SimulateEncounter(
        const FBSCombatantProfile& Player,
        const FBSEnemyProfile& Enemy,
        int32 Seed = 1000
    );

    UFUNCTION(BlueprintCallable, Category="BLACK Smith|Balance|PvE")
    static FBSSimulationSummary RunBatch(
        const FBSCombatantProfile& Player,
        const FBSEnemyProfile& Enemy,
        int32 Simulations,
        int32 BaseSeed = 1000
    );
};
