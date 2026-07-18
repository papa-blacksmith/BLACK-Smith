#pragma once

#include "CoreMinimal.h"
#include "Kismet/BlueprintFunctionLibrary.h"
#include "BSBalanceTypes.h"
#include "BSEconomySimulator.generated.h"

UCLASS()
class BLACKSMITH_API UBSEconomySimulator : public UBlueprintFunctionLibrary
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="BLACK Smith|Balance|Economy")
    static FBSEconomySummary RunEconomySimulation(
        const FBSEconomyConfig& Config,
        const TMap<FName, float>& BaseDropRates,
        const TMap<FName, float>& BaseOrePrices,
        int32 Seed = 1000
    );
};
