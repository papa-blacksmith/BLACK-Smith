#include "BSBalanceAI.h"

TArray<FBSBalanceRecommendation> UBSBalanceAI::AnalyzePvP(
    const FString& TargetName,
    const FBSSimulationSummary& Summary,
    float DesiredMinWinRate,
    float DesiredMaxWinRate
)
{
    TArray<FBSBalanceRecommendation> Output;

    if (Summary.WinRateA > DesiredMaxWinRate)
    {
        FBSBalanceRecommendation Recommendation;
        Recommendation.Target = TargetName;
        Recommendation.Category = TEXT("PvP Nerf");
        Recommendation.Severity = FMath::Clamp((Summary.WinRateA - DesiredMaxWinRate) / 0.1f, 0.0f, 1.0f);
        Recommendation.SuggestedPercentChange = -FMath::Clamp((Summary.WinRateA - 0.5f) * 45.0f, 1.0f, 12.0f);
        Recommendation.Recommendation = TEXT("攻撃力、速度、ガード性能のいずれかを段階的に下げる");
        Recommendation.Evidence = FString::Printf(TEXT("勝率 %.2f%% / 目標上限 %.2f%%"), Summary.WinRateA * 100.0f, DesiredMaxWinRate * 100.0f);
        Output.Add(Recommendation);
    }
    else if (Summary.WinRateA < DesiredMinWinRate)
    {
        FBSBalanceRecommendation Recommendation;
        Recommendation.Target = TargetName;
        Recommendation.Category = TEXT("PvP Buff");
        Recommendation.Severity = FMath::Clamp((DesiredMinWinRate - Summary.WinRateA) / 0.1f, 0.0f, 1.0f);
        Recommendation.SuggestedPercentChange = FMath::Clamp((0.5f - Summary.WinRateA) * 45.0f, 1.0f, 12.0f);
        Recommendation.Recommendation = TEXT("攻撃力、速度、リーチ、スタミナ効率のいずれかを段階的に上げる");
        Recommendation.Evidence = FString::Printf(TEXT("勝率 %.2f%% / 目標下限 %.2f%%"), Summary.WinRateA * 100.0f, DesiredMinWinRate * 100.0f);
        Output.Add(Recommendation);
    }

    if (Summary.AverageDuration < 8.0f)
    {
        FBSBalanceRecommendation Recommendation;
        Recommendation.Target = TargetName;
        Recommendation.Category = TEXT("TTK");
        Recommendation.Severity = 0.5f;
        Recommendation.SuggestedPercentChange = -5.0f;
        Recommendation.Recommendation = TEXT("瞬間火力を下げるか防御・体力を増やす");
        Recommendation.Evidence = FString::Printf(TEXT("平均決着時間 %.2f秒"), Summary.AverageDuration);
        Output.Add(Recommendation);
    }

    return Output;
}

TArray<FBSBalanceRecommendation> UBSBalanceAI::AnalyzePvE(
    const FString& TargetName,
    const FBSSimulationSummary& Summary,
    float DesiredClearRate
)
{
    TArray<FBSBalanceRecommendation> Output;
    const float Difference = Summary.WinRateA - DesiredClearRate;

    if (FMath::Abs(Difference) > 0.08f)
    {
        FBSBalanceRecommendation Recommendation;
        Recommendation.Target = TargetName;
        Recommendation.Category = Difference > 0.0f ? TEXT("PvE Enemy Buff") : TEXT("PvE Enemy Nerf");
        Recommendation.Severity = FMath::Clamp(FMath::Abs(Difference) / 0.25f, 0.0f, 1.0f);
        Recommendation.SuggestedPercentChange = FMath::Clamp(FMath::Abs(Difference) * 35.0f, 2.0f, 18.0f) * (Difference > 0.0f ? 1.0f : -1.0f);
        Recommendation.Recommendation = Difference > 0.0f
            ? TEXT("敵の体力、攻撃力、耐性を引き上げる")
            : TEXT("敵の体力、攻撃力、耐性を引き下げる");
        Recommendation.Evidence = FString::Printf(TEXT("討伐率 %.2f%% / 目標 %.2f%%"), Summary.WinRateA * 100.0f, DesiredClearRate * 100.0f);
        Output.Add(Recommendation);
    }

    return Output;
}

TArray<FBSBalanceRecommendation> UBSBalanceAI::AnalyzeEconomy(
    const FBSEconomySummary& Summary,
    float TargetAverageOrePrice
)
{
    TArray<FBSBalanceRecommendation> Output;

    const float Difference = Summary.AverageOrePrice - TargetAverageOrePrice;

    if (FMath::Abs(Difference) / FMath::Max(TargetAverageOrePrice, 1.0f) > 0.15f)
    {
        FBSBalanceRecommendation Recommendation;
        Recommendation.Target = TEXT("Ore Market");
        Recommendation.Category = Difference > 0.0f ? TEXT("Supply Shortage") : TEXT("Oversupply");
        Recommendation.Severity = FMath::Clamp(FMath::Abs(Difference) / FMath::Max(TargetAverageOrePrice, 1.0f), 0.0f, 1.0f);
        Recommendation.SuggestedPercentChange = FMath::Clamp(FMath::Abs(Difference) / FMath::Max(TargetAverageOrePrice, 1.0f) * 25.0f, 3.0f, 25.0f);
        Recommendation.Recommendation = Difference > 0.0f
            ? TEXT("探索ドロップ率または市場供給量を増やす")
            : TEXT("ドロップ率を下げるか鉱石消費先を増やす");
        Recommendation.Evidence = FString::Printf(TEXT("平均鉱石価格 %.2f / 目標 %.2f"), Summary.AverageOrePrice, TargetAverageOrePrice);
        Output.Add(Recommendation);
    }

    return Output;
}
