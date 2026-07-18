#include "BSEconomySimulator.h"

FBSEconomySummary UBSEconomySimulator::RunEconomySimulation(
    const FBSEconomyConfig& Config,
    const TMap<FName, float>& BaseDropRates,
    const TMap<FName, float>& BaseOrePrices,
    int32 Seed
)
{
    FRandomStream Random(Seed);
    FBSEconomySummary Summary;

    const int32 Days = FMath::Clamp(Config.Days, 1, 3650);
    const int32 Players = FMath::Clamp(Config.Players, 1, 10000000);

    Summary.CurrencySupply = Players * Config.CurrencyInjectionPerDay * Days;

    for (int32 Day = 0; Day < Days; ++Day)
    {
        const int32 Explorations = FMath::RoundToInt(
            Players *
            Config.ExplorationRunsPerPlayer *
            Random.FRandRange(0.85f, 1.15f)
        );

        const int32 Forges = FMath::RoundToInt(
            Players *
            Config.ForgeAttemptsPerPlayer *
            Random.FRandRange(0.82f, 1.18f)
        );

        const int32 Trades = FMath::RoundToInt(
            Forges *
            Config.TradeRate *
            Random.FRandRange(0.8f, 1.2f)
        );

        Summary.TotalExplorations += Explorations;
        Summary.TotalForges += Forges;
        Summary.TotalTrades += Trades;

        for (const TPair<FName, float>& Drop : BaseDropRates)
        {
            const float Produced = Explorations * Drop.Value * Random.FRandRange(0.9f, 1.1f);
            Summary.OreSupply.FindOrAdd(Drop.Key) += Produced;
        }
    }

    float TotalOrePrice = 0.0f;
    int32 OrePriceCount = 0;

    for (const TPair<FName, float>& BasePrice : BaseOrePrices)
    {
        const float Supply = FMath::Max(Summary.OreSupply.FindRef(BasePrice.Key), 1.0f);
        const float Demand = FMath::Max(static_cast<float>(Summary.TotalForges) * 2.2f, 1.0f);
        const float Scarcity = FMath::Clamp(Demand / Supply, 0.25f, 5.0f);
        const float Price = BasePrice.Value * FMath::Pow(Scarcity, 0.42f);

        Summary.OrePrices.Add(BasePrice.Key, Price);
        TotalOrePrice += Price;
        ++OrePriceCount;
    }

    Summary.AverageOrePrice =
        OrePriceCount > 0 ? TotalOrePrice / OrePriceCount : 0.0f;

    Summary.AverageWeaponPrice =
        Summary.AverageOrePrice * 4.5f +
        80.0f +
        FMath::Loge(FMath::Max(static_cast<float>(Summary.TotalTrades), 1.0f)) * 12.0f;

    return Summary;
}
