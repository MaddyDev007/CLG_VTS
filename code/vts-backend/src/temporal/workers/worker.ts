import { Worker } from '@temporalio/worker'
import path from 'path'

async function run() {
  const worker = await Worker.create({
    workflowsPath: path.join(__dirname, '../workflows'),
    activities: {
      async onTripStart(tripId: string) {
        console.log('Trip started', tripId)
      },
      async onTripProgress(tripId: string) {
        console.log('Trip progress', tripId)
      },
      async onOverspeed(tripId: string) {
        console.log('Overspeed detected', tripId)
      },
      async onTripEnd(tripId: string) {
        console.log('Trip ended', tripId)
      },
    },
    taskQueue: 'vts-trips',
  })

  await worker.run()
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
