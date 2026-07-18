#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "BSWorkshopInteractable.h"
#include "BSWorkshopStation.generated.h"

class UStaticMeshComponent;
class UNiagaraComponent;

UENUM(BlueprintType)
enum class EBSWorkshopStationType : uint8
{
    Forge,
    Anvil,
    Workbench,
    WeaponStorage,
    OreShelf,
    ExplorationGate,
    NPC
};

DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(
    FBSStationInteractedSignature,
    AActor*,
    Interactor
);

UCLASS()
class BLACKSMITH_API ABSWorkshopStation
    : public AActor
    , public IBSWorkshopInteractable
{
    GENERATED_BODY()

public:
    ABSWorkshopStation();

    virtual void Interact_Implementation(AActor* Interactor) override;
    virtual FText GetInteractionText_Implementation() const override;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="BLACK Smith|Station")
    EBSWorkshopStationType StationType = EBSWorkshopStationType::Workbench;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="BLACK Smith|Station")
    FText StationDisplayName;

    UPROPERTY(BlueprintAssignable, Category="BLACK Smith|Station")
    FBSStationInteractedSignature OnStationInteracted;

protected:
    UPROPERTY(VisibleAnywhere, BlueprintReadOnly)
    TObjectPtr<USceneComponent> SceneRoot;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly)
    TObjectPtr<UStaticMeshComponent> Mesh;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly)
    TObjectPtr<UNiagaraComponent> AmbientEffect;
};
