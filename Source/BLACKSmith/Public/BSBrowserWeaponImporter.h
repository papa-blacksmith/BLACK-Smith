#pragma once

#include "CoreMinimal.h"
#include "Kismet/BlueprintFunctionLibrary.h"
#include "BSBalanceTypes.h"
#include "BSBrowserWeaponImporter.generated.h"

UCLASS()
class BLACKSMITH_API UBSBrowserWeaponImporter : public UBlueprintFunctionLibrary
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="BLACK Smith|Migration")
    static bool ImportBrowserWeaponJson(
        const FString& Json,
        FBSShapeInput& OutShape,
        TArray<FBSOreSlotInput>& OutOres,
        FString& OutWeaponName
    );
};
