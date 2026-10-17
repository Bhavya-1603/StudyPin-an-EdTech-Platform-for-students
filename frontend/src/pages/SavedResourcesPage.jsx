import CentralStudyPinsDashboard from '../components/dashboard/CentralStudyPinsDashboard'

export default function SavedResourcesPage() {
  return (
    <div className="space-y-6 pb-12">
      <CentralStudyPinsDashboard initialTab="saved" />
    </div>
  )
}
