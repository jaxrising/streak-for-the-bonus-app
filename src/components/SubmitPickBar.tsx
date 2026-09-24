import { useGameStore } from '../store/gameStore';

export default function SubmitPickBar() {
  const { pendingSelection, submittedPick, submitPick } = useGameStore();

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        backgroundColor: '#1d1e1f',
        boxShadow: '0px -2px 4px rgba(0,0,0,0.15)',
        /* Keeps the bar clear of the iOS home indicator */
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {/*
        Full-bleed on phone. The old `max-w-[1240px] md:pr-[330px]` existed
        only to dodge the 300px sidebar, which is gone.
      */}
      <div className="px-[10px] flex items-center justify-between h-[56px] gap-3">
        {/*
          pendingSelection checked first, not "was anything submitted
          today" — Streak runs several pick windows a day, so tapping a
          fresh, not-yet-submitted card must show ITS picking state even
          after an earlier window this same day was already submitted.
        */}
        {pendingSelection ? (
          <>
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-body font-medium text-white">
                Your pick: <span className="font-bold">{pendingSelection.chosenOption}</span>
              </span>
            </div>
            <button
              onClick={submitPick}
              className="flex items-center justify-center h-[32px] px-8 rounded-full text-[12px] leading-[14px] font-medium font-body transition-all"
              style={{ backgroundColor: '#5990f6', color: '#101113', cursor: 'pointer' }}
            >
              Submit My Pick
            </button>
          </>
        ) : submittedPick ? (
          <>
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-body font-medium text-white">
                Your pick: <span className="font-bold">{submittedPick.chosenOption}</span>
              </span>
            </div>
            <span className="text-[12px] font-body text-[#6C6D6F]">
              Pick submitted! Check today's other windows.
            </span>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2" />
            <button
              disabled
              className="flex items-center justify-center h-[32px] px-8 rounded-full text-[12px] leading-[14px] font-medium font-body transition-all"
              style={{ backgroundColor: '#3A3B3C', color: '#6C6D6F', cursor: 'not-allowed' }}
            >
              Submit My Pick
            </button>
          </>
        )}
      </div>
    </div>
  );
}
