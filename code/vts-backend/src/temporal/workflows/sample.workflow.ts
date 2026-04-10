import { proxyActivities, sleep } from '@temporalio/workflow'

type TripActivities = {
  onTripStart: (tripId: string) => Promise<void>
  onTripProgress: (tripId: string) => Promise<void>
  onOverspeed: (tripId: string) => Promise<void>
  onTripEnd: (tripId: string) => Promise<void>
}

const { onTripStart, onTripProgress, onOverspeed, onTripEnd } = proxyActivities<TripActivities>({
  startToCloseTimeout: '1 minute',
})

export async function trackTripWorkflow(tripId: string): Promise<void> {
  await onTripStart(tripId)

  for (let step = 0; step < 3; step += 1) {
    await sleep('10s')
    await onTripProgress(tripId)
    if (step === 1) {
      await onOverspeed(tripId)
    }
  }

  await onTripEnd(tripId)
}
