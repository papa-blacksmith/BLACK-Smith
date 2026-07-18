#include "BSPvESimulator.h"

FBSPvEResult UBSPvESimulator::SimulateEncounter(
    const FBSCombatantProfile& Player,
    const FBSEnemyProfile& Enemy,
    int32 Seed
)
{
    FRandomStream Random(Seed);
    FBSPvEResult Result;

    float PlayerHealth = Player.MaxHealth;
    float EnemyHealth = Enemy.Health;
    float PlayerStamina = Player.MaxStamina;
    float NextPlayerAttack = 0.0f;
    float NextEnemyAttack = Enemy.AttackInterval;
    float Time = 0.0f;
    const float Step = 0.05f;

    while (PlayerHealth > 0.0f && EnemyHealth > 0.0f && Time < 600.0f)
    {
        PlayerStamina = FMath::Min(Player.MaxStamina, PlayerStamina + Step * 8.0f);

        if (Time >= NextPlayerAttack && PlayerStamina >= Player.Weapon.StaminaCost)
        {
            PlayerStamina -= Player.Weapon.StaminaCost;
            float Damage = Player.Weapon.Attack;

            const float ArmorReduction = Enemy.Armor / (Enemy.Armor + 180.0f);
            Damage *= 1.0f - ArmorReduction;

            for (const TPair<FName, float>& Element : Player.Weapon.ElementDamage)
            {
                const float Resistance = Enemy.Resistances.FindRef(Element.Key);
                const float Weakness = Enemy.Weaknesses.FindRef(Element.Key);
                Damage += Element.Value * (1.0f - Resistance + Weakness);
            }

            Damage *= Random.FRandRange(0.9f, 1.1f);
            EnemyHealth -= FMath::Max(0.0f, Damage);
            ++Result.AttacksUsed;

            NextPlayerAttack = Time + 1.0f / FMath::Max(Player.Weapon.AttackSpeed, 0.1f);
        }

        if (Time >= NextEnemyAttack && EnemyHealth > 0.0f)
        {
            float Damage = Enemy.Attack * Random.FRandRange(0.88f, 1.12f);
            Damage *= 1.0f - Player.Armor / (Player.Armor + 180.0f);
            PlayerHealth -= FMath::Max(0.0f, Damage);
            Result.DamageTaken += Damage;
            NextEnemyAttack = Time + FMath::Max(Enemy.AttackInterval, 0.1f);
        }

        Time += Step;
    }

    Result.bCleared = EnemyHealth <= 0.0f && PlayerHealth > 0.0f;
    Result.ClearTime = Time;
    Result.RemainingHealth = FMath::Max(0.0f, PlayerHealth);
    return Result;
}

FBSSimulationSummary UBSPvESimulator::RunBatch(
    const FBSCombatantProfile& Player,
    const FBSEnemyProfile& Enemy,
    int32 Simulations,
    int32 BaseSeed
)
{
    FBSSimulationSummary Summary;
    Summary.Simulations = FMath::Clamp(Simulations, 1, 1000000);

    double TotalTime = 0.0;
    double TotalDamageTaken = 0.0;
    int32 Clears = 0;

    for (int32 Index = 0; Index < Summary.Simulations; ++Index)
    {
        const FBSPvEResult Result = SimulateEncounter(Player, Enemy, BaseSeed + Index);
        Clears += Result.bCleared ? 1 : 0;
        TotalTime += Result.ClearTime;
        TotalDamageTaken += Result.DamageTaken;
    }

    const double Divisor = FMath::Max(1, Summary.Simulations);
    Summary.WinsA = Clears;
    Summary.WinsB = Summary.Simulations - Clears;
    Summary.WinRateA = static_cast<float>(Clears / Divisor);
    Summary.WinRateB = 1.0f - Summary.WinRateA;
    Summary.AverageDuration = static_cast<float>(TotalTime / Divisor);
    Summary.Metrics.Add(TEXT("ClearRate"), Summary.WinRateA);
    Summary.Metrics.Add(TEXT("AverageDamageTaken"), static_cast<float>(TotalDamageTaken / Divisor));

    return Summary;
}
