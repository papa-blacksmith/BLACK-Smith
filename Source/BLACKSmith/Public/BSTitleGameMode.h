#pragma once

#include "CoreMinimal.h"
#include "GameFramework/GameModeBase.h"
#include "BSTitleGameMode.generated.h"

class ULevelSequence;
class UUserWidget;

UCLASS()
class BLACKSMITH_API ABSTitleGameMode : public AGameModeBase
{
    GENERATED_BODY()

public:
    ABSTitleGameMode();

protected:
    virtual void BeginPlay() override;

    UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category="BLACK Smith|Title")
    TSubclassOf<UUserWidget> TitleWidgetClass;

    UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category="BLACK Smith|Opening")
    TSoftObjectPtr<ULevelSequence> OpeningSequence;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="BLACK Smith|Opening")
    bool bPlayOpeningOnLaunch = true;

    UFUNCTION(BlueprintCallable, Category="BLACK Smith|Title")
    void ShowTitleScreen();
};
