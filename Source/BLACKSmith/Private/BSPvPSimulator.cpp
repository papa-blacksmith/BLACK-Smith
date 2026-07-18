#include "BSPvPSimulator.h"
#include "BSCombatEngine.h"

FBSSimulationSummary UBSPvPSimulator::RunSimulation(
    const FBSCombatantProfile& A,
    const FBSCombatantProfile& B,
    int32 Simulations,
    int32 BaseSeed
)
{
    FBSSimulationSummary Summary;
    Summary.Simulations = FMath::Clamp(Simulations, 1, 1000000);

    if (!CombatEngine)
    {
        CombatEngine = NewObject<UBSCombatEngine>(this);
    }

    double TotalDuration = 0.0;
    double TotalDamageA = 0.0;
    double TotalDamageB = 0.0;
    int64 CriticalsA = 0;
    int64 CriticalsB = 0;
    int64 GuardsA = 0;
    int64 GuardsB = 0;

    for (int32 Index = 0; Index < Summary.Simulations; ++Index)
    {
        const FBSBattleResult Result = CombatEngine->SimulateBattle(
            A,
            B,
            EBSCombatMode::PvP,
            BaseSeed + Index,
            false
        );

        if (Result.Winner == A.Name)
        {
            ++Summary.WinsA;
        }
        else if (Result.Winner == B.Name)
        {
            ++Summary.WinsB;
        }
        else
        {
            ++Summary.Draws;
        }

        TotalDuration += Result.DurationSeconds;
        TotalDamageA += Result.DamageByA;
        TotalDamageB += Result.DamageByB;
        CriticalsA += Result.CriticalsByA;
        CriticalsB += Result.CriticalsByB;
        GuardsA += Result.GuardsByA;
        GuardsB += Result.GuardsByB;
    }

    const double Divisor = FMath::Max(1, Summary.Simulations);
    Summary.WinRateA = static_cast<float>(Summary.WinsA / Divisor);
    Summary.WinRateB = static_cast<float>(Summary.WinsB / Divisor);
    Summary.AverageDuration = static_cast<float>(TotalDuration / Divisor);
    Summary.AverageDamageA = static_cast<float>(TotalDamageA / Divisor);
    Summary.AverageDamageB = static_cast<float>(TotalDamageB / Divisor);
    Summary.Metrics.Add(TEXT("CriticalsA"), static_cast<float>(CriticalsA / Divisor));
    Summary.Metrics.Add(TEXT("CriticalsB"), static_cast<float>(CriticalsB / Divisor));
    Summary.Metrics.Add(TEXT("GuardsA"), static_cast<float>(GuardsA / Divisor));
    Summary.Metrics.Add(TEXT("GuardsB"), static_cast<float>(GuardsB / Divisor));
    Summary.Metrics.Add(TEXT("TTK"), Summary.AverageDuration);

    return Summary;
}
