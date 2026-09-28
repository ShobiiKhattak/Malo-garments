import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getAdminStats, getAllOrders } from '../../services/api'
import { Line, Doughnut } from 'react-chartjs-2'
import CountUp from '../../components/home/CountUp'
import StatDetail, { type StatKind } from '../../components/admin/StatDetail'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler } from 'chart.js'
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler)

const fmt = (n: number) => `Rs. ${Number(n).toLocaleString('en-PK')}`

export default function Dashboard() {
  const [detail, setDetail] = useState<StatKind | null>(null)
  const { data: stats } = useQuery({ queryKey: ['adminStats'], queryFn: getAdminStats })
  const { data: orders = [] } = useQuery({ queryKey: ['allOrders'], queryFn: getAllOrders })

  const toVerify = orders.filter(o => o.payment_status === 'submitted')

  const recent = [...orders].sort((a,b)=>new Date(b.created_at||b.createdAt||'').getTime()-new Date(a.created_at||a.createdAt||'').getTime()).slice(0,5)

  const revenueData = {
    labels: stats?.monthlyRevenue?.map(m=>m.label)||[],
    datasets: [{ label:'Revenue', data: stats?.monthlyRevenue?.map(m=>m.revenue)||[], borderColor:'#C97B7B', backgroundColor:'rgba(201,123,123,0.1)', tension:0.4, fill:true }]
  }

  const categoryData = {
    labels: stats?.productsByCategory?.map(c=>c.name)||[],
    datasets: [{ data: stats?.productsByCategory?.map(c=>c.count)||[], backgroundColor:['#C97B7B','#C9A96E','#87CEEB','#F2B5B5'] }]
  }

  return (
    <>
      {toVerify.length > 0 && (
        <Link to="/admin/orders" className="pay-alert big">
          <span className="pay-alert-dot" />
          <span><b>{toVerify.length} payment{toVerify.length > 1 ? 's' : ''} waiting for your confirmation</b> — {toVerify.slice(0, 3).map(o => `${o.id} (Rs. ${Number(o.total).toLocaleString('en-PK')})`).join(', ')}{toVerify.length > 3 ? '…' : ''}</span>
          <em>Review →</em>
        </Link>
      )}
      <div className="admin-stats-grid">
        {([['💰',stats?.totalRevenue||0,'Total Revenue','revenue',true],['📦',stats?.totalOrders||0,'Total Orders','orders',false],['👗',stats?.totalProducts||0,'Total Products','products',false],['👥',stats?.totalCustomers||0,'Total Customers','customers',false]] as const).map(([icon,val,label,cls,money],i)=>(
          <button type="button" key={label} className="admin-stat-card clickable" style={{['--i' as string]:i}} onClick={() => setDetail(cls)} aria-label={`${label}: open details`}>
            <div className={`admin-stat-icon ${cls}`}>{icon}</div>
            <div><div className="admin-stat-value"><CountUp key={`${label}-${val}`} to={Number(val)} group prefix={money?'Rs. ':''} /></div><div className="admin-stat-label">{label}</div></div>
            <span className="admin-stat-go">Details →</span>
          </button>
        ))}
      </div>

      <div className="admin-charts-grid">
        <div className="admin-card">
          <div className="admin-card-header"><h3>Revenue — Last 6 Months</h3></div>
          {stats?.monthlyRevenue && <Line data={revenueData} options={{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true}}}} />}
        </div>
        <div className="admin-card">
          <div className="admin-card-header"><h3>Products by Category</h3></div>
          {stats?.productsByCategory && <Doughnut data={categoryData} options={{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom'}}}} />}
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-header"><h3>Recent Orders</h3><a href="/admin/orders" style={{color:'var(--rose)',fontSize:'var(--fs-sm)'}}>View All</a></div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Order ID</th><th>Customer</th><th>Date</th><th>Total</th><th>Status</th></tr></thead>
            <tbody>
              {recent.length === 0 ? <tr><td colSpan={5} style={{textAlign:'center',color:'var(--text-muted)',padding:'var(--sp-xl)'}}>No orders yet.</td></tr>
              : recent.map(o=>(
                <tr key={o.id}>
                  <td data-label="Order ID"><strong>{o.id}</strong></td>
                  <td data-label="Customer">{o.customer?.name||o.customer_name}</td>
                  <td data-label="Date">{new Date(o.created_at||o.createdAt||'').toLocaleDateString()}</td>
                  <td data-label="Total">{fmt(o.total)}</td>
                  <td data-label="Status"><span className={`admin-badge ${o.status}`}>{o.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {detail && <StatDetail kind={detail} orders={orders} stats={stats} onClose={() => setDetail(null)} />}
    </>
  )
}
