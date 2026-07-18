#pragma once

#include "CoreMinimal.h"
#include "Subsystems/GameInstanceSubsystem.h"
#include "BSBalanceTypes.h"
#include "BSBalanceDashboardSubsystem.generated.h"

UCLASS()
class BLACKSMITH_API UBSBalanceDashboardSubsystem : public UGameInstanceSubsystem
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="BLACK Smith|Balance|Dashboard")
    void RecordSimulation(const FString& Label, const FBSSimulationSummary& Summary);

    UFUNCTION(BlueprintCallable, Category="BLACK Smith|Balance|Dashboard")
    void RecordEconomy(const FString& Label, const FBSEconomySummary& Summary);

    UFUNCTION(BlueprintPure, Category="BLACK Smith|Balance|Dashboard")
    TMap<FString, FBSSimulationSummary> GetSimulationHistory() const;

    UFUNCTION(BlueprintCallable, Category="BLACK Smith|Balance|Dashboard")
    bool ExportSimulationCSV(const FString& FileName) const;

    UFUNCTION(BlueprintCallable, Category="BLACK Smith|Balance|Dashboard")
    bool ExportEconomyCSV(const FString& FileName) const;

private:
    UPROPERTY()
    TMap<FString, FBSSimulationSummary> SimulationHistory;

    UPROPERTY()
    TMap<FString, FBSEconomySummary> EconomyHistory;
};
