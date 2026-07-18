#include "BSCombatEngine.h"

FBSBattleResult UBSCombatEngine::SimulateBattle(
    const FBSCombatantProfile& CombatantA,
    const FBSCombatantProfile& CombatantB,
    EBSCombatMode Mode,
    int32 Seed,
    bool bRecordLog
) const
{
    FRandomStream Random(Seed == 0 ? FMath::Rand() : Seed);
    FBSBattleResult Result;

    float HealthA = CombatantA.MaxHealth;
    float HealthB = CombatantB.MaxHealth;
    float StaminaA = CombatantA.MaxStamina;
    float StaminaB = CombatantB.MaxStamina;
    float NextAttackA = 0.0f;
    float NextAttackB = 0.0f;
    float Time = 0.0f;

    const float TimeStep = 0.05f;
    const float MaxDuration = Mode == EBSCombatMode::PvP ? 180.0f : 300.0f;

    while (HealthA > 0.0f && HealthB > 0.0f && Time < MaxDuration)
    {
        StaminaA = FMath::Min(CombatantA.MaxStamina, StaminaA + TimeStep * 8.0f);
        StaminaB = FMath::Min(CombatantB.MaxStamina, StaminaB + TimeStep * 8.0f);

        if (Time >= NextAttackA && StaminaA >= CombatantA.Weapon.StaminaCost)
        {
            StaminaA -= CombatantA.Weapon.StaminaCost;
            bool bCritical = false;
            bool bGuarded = false;

            const float Damage =
                CalculatePhysicalDamage(CombatantA, CombatantB, Random, bCritical, bGuarded) +
                CalculateElementDamage(CombatantA.Weapon, CombatantB);

            HealthB -= Damage;
            Result.DamageByA += Damage;
            Result.CriticalsByA += bCritical ? 1 : 0;
            Result.GuardsByB += bGuarded ? 1 : 0;

            if (bRecordLog)
            {
                FBSCombatEvent Event;
                Event.TimeSeconds = Time;
                Event.Actor = CombatantA.Name;
                Event.Action = TEXT("Attack");
                Event.Value = Damage;
                Event.bCritical = bCritical;
                Event.bGuarded = bGuarded;
                Result.CombatLog.Add(Event);
            }

            NextAttackA = Time + 1.0f / FMath::Max(CombatantA.Weapon.AttackSpeed, 0.1f);
        }

        if (HealthB <= 0.0f)
        {
            break;
        }

        if (Time >= NextAttackB && StaminaB >= CombatantB.Weapon.StaminaCost)
        {
            StaminaB -= CombatantB.Weapon.StaminaCost;
            bool bCritical = false;
            bool bGuarded = false;

            const float Damage =
                CalculatePhysicalDamage(CombatantB, CombatantA, Random, bCritical, bGuarded) +
                CalculateElementDamage(CombatantB.Weapon, CombatantA);

            HealthA -= Damage;
            Result.DamageByB += Damage;
            Result.CriticalsByB += bCritical ? 1 : 0;
            Result.GuardsByA += bGuarded ? 1 : 0;

            if (bRecordLog)
            {
                FBSCombatEvent Event;
                Event.TimeSeconds = Time;
                Event.Actor = CombatantB.Name;
                Event.Action = TEXT("Attack");
                Event.Value = Damage;
                Event.bCritical = bCritical;
                Event.bGuarded = bGuarded;
                Result.CombatLog.Add(Event);
            }

            NextAttackB = Time + 1.0f / FMath::Max(CombatantB.Weapon.AttackSpeed, 0.1f);
        }

        Time += TimeStep;
    }

    Result.DurationSeconds = Time;

    if (HealthA > HealthB && HealthA > 0.0f)
    {
        Result.Winner = CombatantA.Name;
    }
    else if (HealthB > HealthA && HealthB > 0.0f)
    {
        Result.Winner = CombatantB.Name;
    }
    else
    {
        Result.Winner = TEXT("Draw");
    }

    return Result;
}

float UBSCombatEngine::CalculatePhysicalDamage(
    const FBSCombatantProfile& Attacker,
    const FBSCombatantProfile& Defender,
    FRandomStream& Random,
    bool& bCritical,
    bool& bGuarded
) const
{
    const float HitChance = FMath::Clamp(
        0.88f +
        Attacker.ReactionSkill * 0.08f +
        Attacker.Weapon.Reach * 0.018f -
        Defender.Evasion,
        0.55f,
        0.98f
    );

    if (Random.FRand() > HitChance)
    {
        return 0.0f;
    }

    bCritical = Random.FRand() < Attacker.Weapon.CriticalChance;
    bGuarded = Random.FRand() < Defender.GuardSkill;

    float Damage = Attacker.Weapon.Attack;
    Damage *= Random.FRandRange(0.88f, 1.12f);

    if (bCritical)
    {
        Damage *= Attacker.Weapon.CriticalMultiplier;
    }

    const float ArmorReduction = Defender.Armor / (Defender.Armor + 180.0f);
    Damage *= 1.0f - ArmorReduction;

    if (bGuarded)
    {
        Damage *= 1.0f - FMath::Clamp(Defender.Weapon.GuardPower, 0.0f, 0.8f);
    }

    return FMath::Max(0.0f, Damage);
}

float UBSCombatEngine::CalculateElementDamage(
    const FBSWeaponCombatStats& Weapon,
    const FBSCombatantProfile& Defender
) const
{
    float Total = 0.0f;

    for (const TPair<FName, float>& Element : Weapon.ElementDamage)
    {
        const float Resistance = Defender.Resistances.FindRef(Element.Key);
        Total += Element.Value * (1.0f - FMath::Clamp(Resistance, -1.0f, 0.95f));
    }

    return FMath::Max(0.0f, Total);
}
