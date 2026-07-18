#pragma once

#include "CoreMinimal.h"
#include "BSBalanceTypes.generated.h"

UENUM(BlueprintType)
enum class EBSCombatMode : uint8
{
    PvP,
    PvE
};

UENUM(BlueprintType)
enum class EBSWeaponClass : uint8
{
    OneHandSword,
    GreatSword,
    Katana,
    DualBlades,
    Spear,
    Axe,
    Hammer,
    Dagger,
    Knuckle
};

UENUM(BlueprintType)
enum class EBSRarity : uint8
{
    Common,
    Uncommon,
    Rare,
    Epic,
    Legendary,
    Mythic,
    BlackSmith
};

UENUM(BlueprintType)
enum class EBSDamageType : uint8
{
    Slash,
    Pierce,
    Blunt,
    Fire,
    Ice,
    Lightning,
    Holy,
    Dark
};

USTRUCT(BlueprintType)
struct FBSShapeInput
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FString ShapeJson;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float LengthCm = 90.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float AverageWidthCm = 5.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float ThicknessCm = 0.8f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float Curvature = 0.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float Serration = 0.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float HoleRatio = 0.0f;
};

USTRUCT(BlueprintType)
struct FBSShapeMetrics
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float LengthCm = 0.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float AverageWidthCm = 0.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float ThicknessCm = 0.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float Curvature = 0.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float Serration = 0.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float SurfaceAreaCm2 = 0.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float VolumeCm3 = 0.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float CenterOfMass01 = 0.5f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float ReachScore = 1.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float WeightCoefficient = 1.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float DurabilityCoefficient = 1.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float SpeedCoefficient = 1.0f;
};

USTRUCT(BlueprintType)
struct FBSOreSlotInput
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FName OreId;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FName OreName;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    EBSRarity Rarity = EBSRarity::Common;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float Density = 7.8f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float Hardness = 1.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float AttackFlat = 0.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float AttackPercent = 0.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float SpeedPercent = 0.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float DurabilityPercent = 0.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FName Element;
};

USTRUCT(BlueprintType)
struct FBSMaterialResult
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float Density = 7.8f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float Hardness = 1.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float AttackFlat = 0.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float AttackPercent = 0.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float SpeedPercent = 0.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float DurabilityPercent = 0.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    TMap<FName, float> ElementWeights;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    TArray<FName> SourceOres;
};

USTRUCT(BlueprintType)
struct FBSWeaponCombatStats
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FGuid WeaponId;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FString DisplayName;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    EBSWeaponClass WeaponClass = EBSWeaponClass::OneHandSword;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    EBSRarity Rarity = EBSRarity::Common;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float Attack = 100.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float Defense = 20.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float AttackSpeed = 1.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float Reach = 1.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float Weight = 5.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float Durability = 100.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float CriticalChance = 0.05f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float CriticalMultiplier = 1.5f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float GuardPower = 0.2f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float StaminaCost = 12.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    TMap<FName, float> ElementDamage;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FString SourceShapeJson;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    TArray<FName> SourceOres;
};

USTRUCT(BlueprintType)
struct FBSCombatantProfile
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FString Name;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float MaxHealth = 1000.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float MaxStamina = 100.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float Armor = 20.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float Evasion = 0.08f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float GuardSkill = 0.35f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float Aggression = 0.6f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float ReactionSkill = 0.5f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    TMap<FName, float> Resistances;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FBSWeaponCombatStats Weapon;
};

USTRUCT(BlueprintType)
struct FBSCombatEvent
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float TimeSeconds = 0.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FString Actor;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FString Action;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float Value = 0.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    bool bCritical = false;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    bool bGuarded = false;
};

USTRUCT(BlueprintType)
struct FBSBattleResult
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FString Winner;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float DurationSeconds = 0.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float DamageByA = 0.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float DamageByB = 0.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    int32 CriticalsByA = 0;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    int32 CriticalsByB = 0;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    int32 GuardsByA = 0;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    int32 GuardsByB = 0;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    TArray<FBSCombatEvent> CombatLog;
};

USTRUCT(BlueprintType)
struct FBSSimulationSummary
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    int32 Simulations = 0;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    int32 WinsA = 0;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    int32 WinsB = 0;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    int32 Draws = 0;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float WinRateA = 0.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float WinRateB = 0.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float AverageDuration = 0.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float AverageDamageA = 0.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float AverageDamageB = 0.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    TMap<FString, float> Metrics;
};

USTRUCT(BlueprintType)
struct FBSEnemyProfile
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FName EnemyId;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FString DisplayName;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float Health = 3000.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float Armor = 40.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float Attack = 80.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float AttackInterval = 1.5f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float Evasion = 0.03f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    TMap<FName, float> Resistances;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    TMap<FName, float> Weaknesses;
};

USTRUCT(BlueprintType)
struct FBSPvEResult
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    bool bCleared = false;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float ClearTime = 0.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float DamageTaken = 0.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float RemainingHealth = 0.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    int32 AttacksUsed = 0;
};

USTRUCT(BlueprintType)
struct FBSEconomyConfig
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    int32 Days = 30;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    int32 Players = 1000;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float ExplorationRunsPerPlayer = 2.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float ForgeAttemptsPerPlayer = 1.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float TradeRate = 0.35f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float CurrencyInjectionPerDay = 100.0f;
};

USTRUCT(BlueprintType)
struct FBSEconomySummary
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    int32 TotalExplorations = 0;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    int32 TotalForges = 0;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    int32 TotalTrades = 0;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float CurrencySupply = 0.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float AverageOrePrice = 0.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float AverageWeaponPrice = 0.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    TMap<FName, float> OreSupply;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    TMap<FName, float> OrePrices;
};

USTRUCT(BlueprintType)
struct FBSBalanceRecommendation
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FString Target;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FString Category;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FString Recommendation;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float Severity = 0.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float SuggestedPercentChange = 0.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FString Evidence;
};
