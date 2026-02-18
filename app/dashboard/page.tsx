import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { findUserById } from '@/lib/users'
import LogoutButton from './LogoutButton'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) {
    redirect('/login')
  }

  const user = findUserById(session.userId)
  if (!user) {
    redirect('/login')
  }

  const profile = user.profile
  const org = profile.Organisations[0]
  const addr = profile.ContactPostalAddress
  const portalBase = (process.env.TRADESTART_PORTAL_URL || 'https://staging.novusloyalty.com/portal/login?code=tradestart').trim()
  // SSO authorize: Novus will redirect back to Perspective /authorize, and since the user
  // already has a Perspective session, silent SSO issues an auth code immediately → portal
  const baseUrl = new URL(portalBase).origin
  const tradeStartSsoUrl = `${baseUrl}/api/auth/sso/authorize?tenant=tradestart`

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header style={{ backgroundColor: '#1a1a2e' }} className="px-6 py-4 flex items-center justify-between">
        <span className="text-white text-xl font-bold tracking-wide">Perspective</span>
        <div className="flex items-center gap-4">
          <span className="text-gray-300 text-sm">{profile.ContactFullName}</span>
          <LogoutButton />
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        {/* Welcome Banner */}
        <div
          className="rounded-xl p-6 mb-6 text-white"
          style={{ backgroundColor: '#1a1a2e' }}
        >
          <h1 className="text-2xl font-bold mb-1">Welcome to Perspective</h1>
          <p className="text-gray-300 text-sm">
            Your supply chain management portal for Eden Brae Homes and Connect Homes projects
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Profile Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">My Profile</h2>
            <dl className="space-y-3 text-sm">
              <ProfileRow label="Full Name" value={profile.ContactFullName} />
              <ProfileRow label="Email" value={profile.EmailAddress} />
              <ProfileRow label="Mobile" value={profile.MobileNumber} />
              <ProfileRow
                label="Address"
                value={[addr.AddressLineOne, addr.AddressLineTwo, addr.Suburb, addr.Poscode]
                  .filter(Boolean)
                  .join(', ')}
              />
              <div className="pt-3 border-t border-gray-100">
                <ProfileRow label="Company" value={org.OrganisationFullName} />
                <ProfileRow label="Trading Name" value={org.TradingName} />
                <ProfileRow label="ABN" value={org.ABN} />
                <ProfileRow label="Vendor ID" value={org.OrganisationAlternateKey} />
              </div>
            </dl>
          </div>

          {/* TradeStart Card */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div style={{ backgroundColor: '#FEC467' }} className="h-1.5" />
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">TradeStart Rewards</h2>
              <p className="text-sm text-gray-600 mb-5">
                Access your TradeStart rewards, check your points balance, and redeem rewards
              </p>
              <a
                href={tradeStartSsoUrl}
                style={{ backgroundColor: '#00AEEF' }}
                className="inline-block py-2.5 px-5 text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
              >
                Go to TradeStart Rewards
              </a>
            </div>
          </div>

          {/* My Jobs (placeholder) */}
          <PlaceholderCard title="My Jobs" description="View your current and completed projects" />

          {/* Invoices (placeholder) */}
          <PlaceholderCard title="Invoices" description="Track your invoice status and payments" />

          {/* Documents (placeholder) */}
          <PlaceholderCard title="Documents" description="Access project documentation" />
        </div>
      </main>
    </div>
  )
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="text-gray-500 w-28 flex-shrink-0">{label}</dt>
      <dd className="text-gray-900 font-medium">{value || '-'}</dd>
    </div>
  )
}

function PlaceholderCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 opacity-60">
      <h2 className="text-lg font-semibold text-gray-500 mb-2">{title}</h2>
      <p className="text-sm text-gray-400 mb-4">{description}</p>
      <span className="inline-block text-xs bg-gray-100 text-gray-400 px-3 py-1 rounded-full font-medium">
        Coming soon
      </span>
    </div>
  )
}
