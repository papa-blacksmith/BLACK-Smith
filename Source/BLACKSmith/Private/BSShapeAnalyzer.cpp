#include "BSShapeAnalyzer.h"

FBSShapeMetrics UBSShapeAnalyzer::AnalyzeShape(const FBSShapeInput& Input)
{
    FBSShapeMetrics Result;

    Result.LengthCm = FMath::Clamp(Input.LengthCm, 10.0f, 450.0f);
    Result.AverageWidthCm = FMath::Clamp(Input.AverageWidthCm, 0.5f, 120.0f);
    Result.ThicknessCm = FMath::Clamp(Input.ThicknessCm, 0.1f, 30.0f);
    Result.Curvature = FMath::Clamp(Input.Curvature, 0.0f, 2.0f);
    Result.Serration = FMath::Clamp(Input.Serration, 0.0f, 1.0f);

    const float HoleRatio = FMath::Clamp(Input.HoleRatio, 0.0f, 0.8f);
    const float CurvatureAreaFactor = 1.0f + Result.Curvature * 0.08f;
    const float SerrationAreaFactor = 1.0f + Result.Serration * 0.15f;

    Result.SurfaceAreaCm2 =
        Result.LengthCm *
        Result.AverageWidthCm *
        2.0f *
        CurvatureAreaFactor *
        SerrationAreaFactor;

    Result.VolumeCm3 =
        Result.LengthCm *
        Result.AverageWidthCm *
        Result.ThicknessCm *
        (1.0f - HoleRatio) *
        0.72f;

    Result.CenterOfMass01 = FMath::Clamp(
        0.42f +
        (Result.AverageWidthCm / FMath::Max(Result.LengthCm, 1.0f)) * 1.8f +
        Result.Curvature * 0.04f,
        0.25f,
        0.82f
    );

    Result.ReachScore = FMath::Clamp(Result.LengthCm / 90.0f, 0.35f, 3.0f);
    Result.WeightCoefficient = FMath::Clamp(Result.VolumeCm3 / 320.0f, 0.25f, 6.0f);

    Result.DurabilityCoefficient = FMath::Clamp(
        0.65f +
        Result.ThicknessCm * 0.22f +
        Result.AverageWidthCm * 0.018f -
        Result.Serration * 0.18f -
        HoleRatio * 0.35f,
        0.25f,
        3.0f
    );

    Result.SpeedCoefficient = FMath::Clamp(
        1.35f /
        FMath::Pow(Result.WeightCoefficient, 0.32f) *
        (1.0f - Result.CenterOfMass01 * 0.2f),
        0.35f,
        2.2f
    );

    return Result;
}

FBSWeaponCombatStats UBSShapeAnalyzer::BuildBaseWeaponStats(
    const FBSShapeMetrics& Metrics,
    EBSWeaponClass WeaponClass,
    EBSRarity Rarity
)
{
    FBSWeaponCombatStats Stats;
    Stats.WeaponId = FGuid::NewGuid();
    Stats.WeaponClass = WeaponClass;
    Stats.Rarity = Rarity;

    float ClassAttack = 1.0f;
    float ClassSpeed = 1.0f;
    float ClassGuard = 1.0f;
    float ClassStamina = 1.0f;

    switch (WeaponClass)
    {
        case EBSWeaponClass::GreatSword:
            ClassAttack = 1.35f; ClassSpeed = 0.72f; ClassGuard = 1.2f; ClassStamina = 1.35f; break;
        case EBSWeaponClass::Katana:
            ClassAttack = 1.08f; ClassSpeed = 1.12f; ClassGuard = 0.9f; ClassStamina = 0.95f; break;
        case EBSWeaponClass::DualBlades:
            ClassAttack = 0.72f; ClassSpeed = 1.65f; ClassGuard = 0.55f; ClassStamina = 0.82f; break;
        case EBSWeaponClass::Spear:
            ClassAttack = 0.96f; ClassSpeed = 0.96f; ClassGuard = 0.82f; ClassStamina = 1.02f; break;
        case EBSWeaponClass::Axe:
            ClassAttack = 1.22f; ClassSpeed = 0.8f; ClassGuard = 0.92f; ClassStamina = 1.18f; break;
        case EBSWeaponClass::Hammer:
            ClassAttack = 1.3f; ClassSpeed = 0.7f; ClassGuard = 1.05f; ClassStamina = 1.3f; break;
        case EBSWeaponClass::Dagger:
            ClassAttack = 0.65f; ClassSpeed = 1.8f; ClassGuard = 0.42f; ClassStamina = 0.68f; break;
        case EBSWeaponClass::Knuckle:
            ClassAttack = 0.82f; ClassSpeed = 1.5f; ClassGuard = 0.72f; ClassStamina = 0.78f; break;
        default:
            break;
    }

    const float RarityMultiplier = 1.0f + static_cast<int32>(Rarity) * 0.025f;

    Stats.Attack =
        (70.0f +
        Metrics.WeightCoefficient * 18.0f +
        Metrics.AverageWidthCm * 1.1f +
        Metrics.ThicknessCm * 4.0f) *
        ClassAttack *
        RarityMultiplier;

    Stats.AttackSpeed = Metrics.SpeedCoefficient * ClassSpeed;
    Stats.Reach = Metrics.ReachScore;
    Stats.Weight = Metrics.WeightCoefficient * 4.0f;
    Stats.Durability = 100.0f * Metrics.DurabilityCoefficient;
    Stats.GuardPower = FMath::Clamp(0.18f * Metrics.DurabilityCoefficient * ClassGuard, 0.05f, 0.72f);
    Stats.StaminaCost = FMath::Clamp((8.0f + Stats.Weight * 1.6f) * ClassStamina, 5.0f, 55.0f);
    Stats.CriticalChance = FMath::Clamp(0.04f + Metrics.Serration * 0.035f, 0.02f, 0.18f);
    Stats.CriticalMultiplier = 1.5f + Metrics.Serration * 0.12f;
    Stats.Defense = Stats.GuardPower * 100.0f;

    return Stats;
}
