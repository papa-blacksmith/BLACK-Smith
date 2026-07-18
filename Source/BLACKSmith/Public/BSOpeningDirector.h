#pragma once
#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "BSOpeningDirector.generated.h"
class UNiagaraComponent; class UTextRenderComponent; class UStaticMeshComponent;
UCLASS() class BLACKSMITH_API ABSOpeningDirector:public AActor{GENERATED_BODY() public: ABSOpeningDirector(); UFUNCTION(BlueprintCallable) void SetOpeningMoment(float TimeSeconds); protected: UPROPERTY(VisibleAnywhere) TObjectPtr<USceneComponent> Root; UPROPERTY(VisibleAnywhere) TObjectPtr<UStaticMeshComponent> HeroWeapon; UPROPERTY(VisibleAnywhere) TObjectPtr<UNiagaraComponent> Sparks; UPROPERTY(VisibleAnywhere) TObjectPtr<UNiagaraComponent> Fire; UPROPERTY(VisibleAnywhere) TObjectPtr<UNiagaraComponent> Smoke; UPROPERTY(VisibleAnywhere) TObjectPtr<UTextRenderComponent> Caption;};
