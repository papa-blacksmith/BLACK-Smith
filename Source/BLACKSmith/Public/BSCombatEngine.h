#pragma once

#include "CoreMinimal.h"
#include "UObject/Object.h"
#include "BSBalanceTypes.h"
#include "BSCombatEngine.generated.h"

UCLASS(BlueprintType)
class BLACKSMITH_API UBSCombatEngine : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="BLACK Smith|Balance|Combat")
    FBSBattleResult SimulateBattle(
        const FBSCombatantProfile& CombatantA,
        const FBSCombatantProfile& CombatantB,
        EBSCombatMode Mode,
        int32 Seed = 0,
        bool bRecordLog = false
    ) const;

private:
    float CalculatePhysicalDamage(
        const FBSCombatantProfile& Attacker,
        const FBSCombatantProfile& Defender,
        FRandomStream& Random,
        bool& bCritical,
        bool& bGuarded
    ) const;

    float CalculateElementDamage(
        const FBSWeaponCombatStats& Weapon,
        const FBSCombatantProfile& Defender
    ) const;
};
