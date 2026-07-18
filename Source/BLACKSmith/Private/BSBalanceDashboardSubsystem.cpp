#include "BSBalanceDashboardSubsystem.h"
#include "HAL/PlatformFileManager.h"
#include "Misc/FileHelper.h"
#include "Misc/Paths.h"

void UBSBalanceDashboardSubsystem::RecordSimulation(
    const FString& Label,
    const FBSSimulationSummary& Summary
)
{
    SimulationHistory.Add(Label, Summary);
}

void UBSBalanceDashboardSubsystem::RecordEconomy(
    const FString& Label,
    const FBSEconomySummary& Summary
)
{
    EconomyHistory.Add(Label, Summary);
}

TMap<FString, FBSSimulationSummary> UBSBalanceDashboardSubsystem::GetSimulationHistory() const
{
    return SimulationHistory;
}

bool UBSBalanceDashboardSubsystem::ExportSimulationCSV(const FString& FileName) const
{
    FString CSV = TEXT("Label,Simulations,WinsA,WinsB,Draws,WinRateA,WinRateB,AverageDuration,AverageDamageA,AverageDamageB\n");

    for (const TPair<FString, FBSSimulationSummary>& Entry : SimulationHistory)
    {
        const FBSSimulationSummary& S = Entry.Value;
        CSV += FString::Printf(
            TEXT("\"%s\",%d,%d,%d,%d,%.6f,%.6f,%.4f,%.4f,%.4f\n"),
            *Entry.Key.ReplaceCharWithEscapedChar(),
            S.Simulations,
            S.WinsA,
            S.WinsB,
            S.Draws,
            S.WinRateA,
            S.WinRateB,
            S.AverageDuration,
            S.AverageDamageA,
            S.AverageDamageB
        );
    }

    const FString Directory = FPaths::ProjectSavedDir() / TEXT("BalanceExports");
    IPlatformFile& PlatformFile = FPlatformFileManager::Get().GetPlatformFile();
    PlatformFile.CreateDirectoryTree(*Directory);

    return FFileHelper::SaveStringToFile(
        CSV,
        *(Directory / FileName)
    );
}

bool UBSBalanceDashboardSubsystem::ExportEconomyCSV(const FString& FileName) const
{
    FString CSV = TEXT("Label,Explorations,Forges,Trades,CurrencySupply,AverageOrePrice,AverageWeaponPrice\n");

    for (const TPair<FString, FBSEconomySummary>& Entry : EconomyHistory)
    {
        const FBSEconomySummary& S = Entry.Value;
        CSV += FString::Printf(
            TEXT("\"%s\",%d,%d,%d,%.2f,%.2f,%.2f\n"),
            *Entry.Key.ReplaceCharWithEscapedChar(),
            S.TotalExplorations,
            S.TotalForges,
            S.TotalTrades,
            S.CurrencySupply,
            S.AverageOrePrice,
            S.AverageWeaponPrice
        );
    }

    const FString Directory = FPaths::ProjectSavedDir() / TEXT("BalanceExports");
    IPlatformFile& PlatformFile = FPlatformFileManager::Get().GetPlatformFile();
    PlatformFile.CreateDirectoryTree(*Directory);

    return FFileHelper::SaveStringToFile(
        CSV,
        *(Directory / FileName)
    );
}
