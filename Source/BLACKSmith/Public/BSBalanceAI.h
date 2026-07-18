#pragma once

#include "CoreMinimal.h"
#include "Kismet/BlueprintFunctionLibrary.h"
#include "BSBalanceTypes.h"
#include "BSBalanceAI.generated.h"

UCLASS()
class BLACKSMITH_API UBSBalanceAI : public UBlueprintFunctionLibrary
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintPure, Category="BLACK Smith|Balance|AI")
    static TArray<FBSBalanceRecommendation> AnalyzePvP(
        const FString& TargetName,
        const FBSSimulationSummary& Summary,
        float DesiredMinWinRate = 0.48f,
        float DesiredMaxWinRate = 0.52f
    );

    UFUNCTION(BlueprintPure, Category="BLACK Smith|Balance|AI")
    static TArray<FBSBalanceRecommendation> AnalyzePvE(
        const FString& TargetName,
        const FBSSimulationSummary& Summary,
        float DesiredClearRate = 0.65f
    );

    UFUNCTION(BlueprintPure, Category="BLACK Smith|Balance|AI")
    static TArray<FBSBalanceRecommendation> AnalyzeEconomy(
        const FBSEconomySummary& Summary,
        float TargetAverageOrePrice = 100.0f
    );
};
