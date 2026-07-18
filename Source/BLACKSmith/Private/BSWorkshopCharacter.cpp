#include "BSWorkshopCharacter.h"

#include "BSWorkshopInteractable.h"
#include "Camera/CameraComponent.h"
#include "EnhancedInputComponent.h"
#include "EnhancedInputSubsystems.h"
#include "GameFramework/CharacterMovementComponent.h"
#include "GameFramework/PlayerController.h"
#include "GameFramework/SpringArmComponent.h"
#include "InputActionValue.h"

ABSWorkshopCharacter::ABSWorkshopCharacter()
{
    PrimaryActorTick.bCanEverTick = false;

    bUseControllerRotationPitch = false;
    bUseControllerRotationYaw = false;
    bUseControllerRotationRoll = false;

    GetCharacterMovement()->bOrientRotationToMovement = true;
    GetCharacterMovement()->RotationRate =
        FRotator(0.0f, 540.0f, 0.0f);
    GetCharacterMovement()->JumpZVelocity = 520.0f;
    GetCharacterMovement()->AirControl = 0.28f;

    CameraBoom = CreateDefaultSubobject<USpringArmComponent>(
        TEXT("CameraBoom")
    );
    CameraBoom->SetupAttachment(RootComponent);
    CameraBoom->TargetArmLength = 420.0f;
    CameraBoom->bUsePawnControlRotation = true;
    CameraBoom->SetRelativeLocation(FVector(0.0f, 0.0f, 75.0f));

    FollowCamera = CreateDefaultSubobject<UCameraComponent>(
        TEXT("FollowCamera")
    );
    FollowCamera->SetupAttachment(
        CameraBoom,
        USpringArmComponent::SocketName
    );
    FollowCamera->bUsePawnControlRotation = false;
}

void ABSWorkshopCharacter::BeginPlay()
{
    Super::BeginPlay();

    GetCharacterMovement()->MaxWalkSpeed = WalkSpeed;

    if (APlayerController* PlayerController =
        Cast<APlayerController>(Controller))
    {
        if (UEnhancedInputLocalPlayerSubsystem* Subsystem =
            ULocalPlayer::GetSubsystem<
                UEnhancedInputLocalPlayerSubsystem
            >(PlayerController->GetLocalPlayer()))
        {
            if (DefaultMappingContext)
            {
                Subsystem->AddMappingContext(
                    DefaultMappingContext,
                    0
                );
            }
        }
    }
}

void ABSWorkshopCharacter::SetupPlayerInputComponent(
    UInputComponent* PlayerInputComponent
)
{
    Super::SetupPlayerInputComponent(PlayerInputComponent);

    // Enhanced Input is used when assets have been assigned.
    if (UEnhancedInputComponent* EnhancedInput =
        Cast<UEnhancedInputComponent>(PlayerInputComponent))
    {
        if (MoveAction)
        {
            EnhancedInput->BindAction(
                MoveAction,
                ETriggerEvent::Triggered,
                this,
                &ABSWorkshopCharacter::Move
            );
        }

        if (LookAction)
        {
            EnhancedInput->BindAction(
                LookAction,
                ETriggerEvent::Triggered,
                this,
                &ABSWorkshopCharacter::Look
            );
        }

        if (JumpAction)
        {
            EnhancedInput->BindAction(
                JumpAction,
                ETriggerEvent::Started,
                this,
                &ACharacter::Jump
            );
            EnhancedInput->BindAction(
                JumpAction,
                ETriggerEvent::Completed,
                this,
                &ACharacter::StopJumping
            );
        }

        if (SprintAction)
        {
            EnhancedInput->BindAction(
                SprintAction,
                ETriggerEvent::Started,
                this,
                &ABSWorkshopCharacter::StartSprint
            );
            EnhancedInput->BindAction(
                SprintAction,
                ETriggerEvent::Completed,
                this,
                &ABSWorkshopCharacter::StopSprint
            );
        }

        if (InteractAction)
        {
            EnhancedInput->BindAction(
                InteractAction,
                ETriggerEvent::Started,
                this,
                &ABSWorkshopCharacter::Interact
            );
        }
    }

    // Fallback mappings let the native class work before IA/IMC assets exist.
    PlayerInputComponent->BindAxis(
        TEXT("MoveForward"),
        this,
        &ABSWorkshopCharacter::MoveForwardLegacy
    );
    PlayerInputComponent->BindAxis(
        TEXT("MoveRight"),
        this,
        &ABSWorkshopCharacter::MoveRightLegacy
    );
    PlayerInputComponent->BindAxis(
        TEXT("Turn"),
        this,
        &ABSWorkshopCharacter::TurnLegacy
    );
    PlayerInputComponent->BindAxis(
        TEXT("LookUp"),
        this,
        &ABSWorkshopCharacter::LookUpLegacy
    );
    PlayerInputComponent->BindAction(
        TEXT("Jump"),
        IE_Pressed,
        this,
        &ACharacter::Jump
    );
    PlayerInputComponent->BindAction(
        TEXT("Jump"),
        IE_Released,
        this,
        &ACharacter::StopJumping
    );
    PlayerInputComponent->BindAction(
        TEXT("Sprint"),
        IE_Pressed,
        this,
        &ABSWorkshopCharacter::StartSprint
    );
    PlayerInputComponent->BindAction(
        TEXT("Sprint"),
        IE_Released,
        this,
        &ABSWorkshopCharacter::StopSprint
    );
    PlayerInputComponent->BindAction(
        TEXT("Interact"),
        IE_Pressed,
        this,
        &ABSWorkshopCharacter::Interact
    );
}

void ABSWorkshopCharacter::Move(const FInputActionValue& Value)
{
    const FVector2D Axis = Value.Get<FVector2D>();

    MoveForwardLegacy(Axis.Y);
    MoveRightLegacy(Axis.X);
}

void ABSWorkshopCharacter::Look(const FInputActionValue& Value)
{
    const FVector2D Axis = Value.Get<FVector2D>();

    AddControllerYawInput(Axis.X);
    AddControllerPitchInput(Axis.Y);
}

void ABSWorkshopCharacter::MoveForwardLegacy(float Value)
{
    if (!Controller || FMath::IsNearlyZero(Value))
    {
        return;
    }

    const FRotator ControlRotation = Controller->GetControlRotation();
    const FRotator YawRotation(
        0.0f,
        ControlRotation.Yaw,
        0.0f
    );

    AddMovementInput(
        FRotationMatrix(YawRotation).GetUnitAxis(EAxis::X),
        Value
    );
}

void ABSWorkshopCharacter::MoveRightLegacy(float Value)
{
    if (!Controller || FMath::IsNearlyZero(Value))
    {
        return;
    }

    const FRotator ControlRotation = Controller->GetControlRotation();
    const FRotator YawRotation(
        0.0f,
        ControlRotation.Yaw,
        0.0f
    );

    AddMovementInput(
        FRotationMatrix(YawRotation).GetUnitAxis(EAxis::Y),
        Value
    );
}

void ABSWorkshopCharacter::TurnLegacy(float Value)
{
    AddControllerYawInput(Value);
}

void ABSWorkshopCharacter::LookUpLegacy(float Value)
{
    AddControllerPitchInput(Value);
}

void ABSWorkshopCharacter::StartSprint()
{
    GetCharacterMovement()->MaxWalkSpeed = SprintSpeed;
}

void ABSWorkshopCharacter::StopSprint()
{
    GetCharacterMovement()->MaxWalkSpeed = WalkSpeed;
}

void ABSWorkshopCharacter::Interact()
{
    if (!FollowCamera)
    {
        return;
    }

    const FVector Start = FollowCamera->GetComponentLocation();
    const FVector End =
        Start + FollowCamera->GetForwardVector() * 450.0f;

    FHitResult Hit;
    FCollisionQueryParams Params(
        SCENE_QUERY_STAT(BSInteract),
        false,
        this
    );

    if (
        GetWorld()->LineTraceSingleByChannel(
            Hit,
            Start,
            End,
            ECC_Visibility,
            Params
        ) &&
        Hit.GetActor() &&
        Hit.GetActor()->Implements<UBSWorkshopInteractable>()
    )
    {
        IBSWorkshopInteractable::Execute_Interact(
            Hit.GetActor(),
            this
        );
    }
}
