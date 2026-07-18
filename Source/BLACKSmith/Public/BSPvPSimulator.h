#pragma once

#include "CoreMinimal.h"
#include "UObject/Object.h"
#include "BSBalanceTypes.h"
#include "BSPvPSimulator.generated.h"

class UBSCombatEngine;

UCLASS(BlueprintType)
class BLACKSMITH_API UBSPvPSimulator : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="BLACK Smith|Balance|PvP")
    FBSSimulationSummary RunSimulation(
        const FBSCombatantProfile& A,
        const FBSCombatantProfile& B,
        int32 Simulations,
        int32 BaseSeed = 1000
    );

private:
    UPROPERTY()
    TObjectPtr<UBSCombatEngine> CombatEngine;
};
