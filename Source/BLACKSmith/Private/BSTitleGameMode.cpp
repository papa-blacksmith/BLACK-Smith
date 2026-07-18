#include "BSTitleGameMode.h"

#include "Blueprint/UserWidget.h"
#include "Kismet/GameplayStatics.h"
#include "LevelSequence.h"
#include "LevelSequenceActor.h"
#include "LevelSequencePlayer.h"

ABSTitleGameMode::ABSTitleGameMode()
{
    DefaultPawnClass = nullptr;
}

void ABSTitleGameMode::BeginPlay()
{
    Super::BeginPlay();

    if (bPlayOpeningOnLaunch && !OpeningSequence.IsNull())
    {
        if (ULevelSequence* Sequence = OpeningSequence.LoadSynchronous())
        {
            FMovieSceneSequencePlaybackSettings Settings;
            Settings.bAutoPlay = false;

            ALevelSequenceActor* SequenceActor = nullptr;
            ULevelSequencePlayer* Player =
                ULevelSequencePlayer::CreateLevelSequencePlayer(
                    GetWorld(),
                    Sequence,
                    Settings,
                    SequenceActor
                );

            if (Player)
            {
                Player->OnFinished.AddDynamic(
                    this,
                    &ABSTitleGameMode::ShowTitleScreen
                );
                Player->Play();
                return;
            }
        }
    }

    ShowTitleScreen();
}

void ABSTitleGameMode::ShowTitleScreen()
{
    APlayerController* Controller =
        UGameplayStatics::GetPlayerController(this, 0);

    if (!Controller)
    {
        return;
    }

    if (TitleWidgetClass)
    {
        if (UUserWidget* Widget =
            CreateWidget<UUserWidget>(Controller, TitleWidgetClass))
        {
            Widget->AddToViewport(100);
        }
    }

    Controller->SetShowMouseCursor(true);

    FInputModeUIOnly InputMode;
    InputMode.SetLockMouseToViewportBehavior(
        EMouseLockMode::DoNotLock
    );
    Controller->SetInputMode(InputMode);
}
