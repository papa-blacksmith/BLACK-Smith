#pragma once
#include "CoreMinimal.h"
#include "UObject/Interface.h"
#include "BSWorkshopInteractable.generated.h"
UINTERFACE(Blueprintable) class BLACKSMITH_API UBSWorkshopInteractable:public UInterface{GENERATED_BODY()};
class BLACKSMITH_API IBSWorkshopInteractable{GENERATED_BODY() public: UFUNCTION(BlueprintNativeEvent,BlueprintCallable,Category="BLACK Smith|Interaction") void Interact(AActor* Interactor); UFUNCTION(BlueprintNativeEvent,BlueprintCallable,Category="BLACK Smith|Interaction") FText GetInteractionText() const;};
