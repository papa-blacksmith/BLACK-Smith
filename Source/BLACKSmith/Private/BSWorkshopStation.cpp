#include "BSWorkshopStation.h"

#include "Components/StaticMeshComponent.h"
#include "NiagaraComponent.h"

ABSWorkshopStation::ABSWorkshopStation()
{
    PrimaryActorTick.bCanEverTick = false;

    SceneRoot = CreateDefaultSubobject<USceneComponent>(TEXT("SceneRoot"));
    SetRootComponent(SceneRoot);

    Mesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("Mesh"));
    Mesh->SetupAttachment(SceneRoot);
    Mesh->SetCollisionProfileName(TEXT("BlockAllDynamic"));

    AmbientEffect = CreateDefaultSubobject<UNiagaraComponent>(
        TEXT("AmbientEffect")
    );
    AmbientEffect->SetupAttachment(SceneRoot);
    AmbientEffect->SetAutoActivate(true);

    StationDisplayName = NSLOCTEXT(
        "BLACKSmith",
        "DefaultStationName",
        "設備"
    );
}

void ABSWorkshopStation::Interact_Implementation(AActor* Interactor)
{
    OnStationInteracted.Broadcast(Interactor);
}

FText ABSWorkshopStation::GetInteractionText_Implementation() const
{
    return FText::Format(
        NSLOCTEXT(
            "BLACKSmith",
            "UseStationFormat",
            "{0}を使用"
        ),
        StationDisplayName
    );
}
