import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  FolderKanban,
  Headphones,
  LogOut,
  Menu,
  MessageCircle,
  Search,
  ShieldCheck,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { ApiError, authApi, createAdminApi } from './api';
import { disputeExposure, formatMoney, sentenceCase } from './lib/format';
import type { Commission, Conversation, Dispute, Overview, Page, User } from './types';

const tokenKey = 'ruffl-admin-token';

const navigation: { page: Page; label: string; icon: typeof BarChart3 }[] = [
  { page: 'overview', label: 'Overview', icon: BarChart3 },
  { page: 'users', label: 'People', icon: Users },
  { page: 'commissions', label: 'Commissions', icon: FolderKanban },
  { page: 'disputes', label: 'Disputes', icon: ShieldCheck },
  { page: 'chats', label: 'Support chats', icon: MessageCircle },
];

interface DashboardData {
  overview: Overview | null;
  users: User[];
  commissions: Commission[];
  disputes: Dispute[];
  conversations: Conversation[];
}

const emptyData: DashboardData = {
  overview: null,
  users: [],
  commissions: [],
  disputes: [],
  conversations: [],
};

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem(tokenKey));
  const [admin, setAdmin] = useState<User | null>(null);
  const [page, setPage] = useState<Page>('overview');
  const [data, setData] = useState<DashboardData>(emptyData);
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const api = useMemo(() => (token ? createAdminApi(token) : null), [token]);

  const signOut = useCallback(() => {
    localStorage.removeItem(tokenKey);
    setToken(null);
    setAdmin(null);
    setData(emptyData);
  }, []);

  const refresh = useCallback(async () => {
    if (!api) return;
    setLoading(true);
    try {
      const me = await api.me();
      if (me.user.role !== 'admin') {
        throw new ApiError('This dashboard is only available to administrators.', 403, 'FORBIDDEN');
      }
      const [overview, users, commissions, disputes, conversations] = await Promise.all([
        api.overview(),
        api.users(),
        api.commissions(),
        api.disputes(),
        api.conversations(),
      ]);
      setAdmin(me.user);
      setData({
        overview,
        users: users.users,
        commissions: commissions.commissions,
        disputes: disputes.disputes,
        conversations: conversations.conversations.filter((conversation) => conversation.kind === 'admin'),
      });
      setError('');
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Could not reach the Ruffl API.';
      setError(message);
      if (caught instanceof ApiError && [401, 403].includes(caught.status)) {
        signOut();
      }
    } finally {
      setLoading(false);
    }
  }, [api, signOut]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (!token || !admin) {
    return (
      <Login
        externalError={error}
        onAuthenticated={(nextToken, user) => {
          localStorage.setItem(tokenKey, nextToken);
          setToken(nextToken);
          setAdmin(user);
          setError('');
        }}
      />
    );
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? 'sidebar--open' : ''}`}>
        <div className="brand">
          <div className="brand__mark">R</div>
          <div>
            <strong>ruffl</strong>
            <span>admin</span>
          </div>
          <button className="icon-button sidebar__close" onClick={() => setMenuOpen(false)} type="button">
            <X aria-hidden="true" size={20} />
            <span className="sr-only">Close navigation</span>
          </button>
        </div>
        <nav aria-label="Dashboard">
          {navigation.map((item) => {
            const Icon = item.icon;
            const count =
              item.page === 'disputes'
                ? data.disputes.filter((dispute) => ['open', 'under_review'].includes(dispute.status)).length
                : undefined;
            return (
              <button
                className={page === item.page ? 'nav-item nav-item--active' : 'nav-item'}
                key={item.page}
                onClick={() => {
                  setPage(item.page);
                  setMenuOpen(false);
                }}
                type="button">
                <Icon aria-hidden="true" size={19} />
                <span>{item.label}</span>
                {count ? <span className="nav-count">{count}</span> : null}
              </button>
            );
          })}
        </nav>
        <div className="sidebar__footer">
          <div className="admin-identity">
            <div className="avatar">{initials(admin.displayName)}</div>
            <div>
              <strong>{admin.displayName}</strong>
              <span>{admin.email}</span>
            </div>
          </div>
          <button className="nav-item" onClick={signOut} type="button">
            <LogOut aria-hidden="true" size={19} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
      {menuOpen ? <button aria-label="Close navigation" className="backdrop" onClick={() => setMenuOpen(false)} /> : null}
      <main className="main">
        <header className="mobile-header">
          <button className="icon-button" onClick={() => setMenuOpen(true)} type="button">
            <Menu aria-hidden="true" size={22} />
            <span className="sr-only">Open navigation</span>
          </button>
          <strong>Ruffl Admin</strong>
          <div className="avatar avatar--small">{initials(admin.displayName)}</div>
        </header>
        {error ? <div className="notice notice--error"><AlertTriangle size={18} />{error}</div> : null}
        {loading ? (
          <LoadingPanel />
        ) : (
          <DashboardPage
            data={data}
            onRefresh={refresh}
            page={page}
            setError={setError}
            token={token}
          />
        )}
      </main>
    </div>
  );
}

function Login({
  externalError,
  onAuthenticated,
}: {
  externalError: string;
  onAuthenticated: (token: string, user: User) => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(externalError);
  const [busy, setBusy] = useState(false);

  const submit = async (loginEmail = email, loginPassword = password) => {
    setBusy(true);
    setError('');
    try {
      const result = await authApi.login(loginEmail, loginPassword);
      if (result.user.role !== 'admin') {
        throw new ApiError('This account is not authorised for the admin dashboard.', 403, 'FORBIDDEN');
      }
      onAuthenticated(result.token, result.user);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not sign in.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="login">
      <section className="login__intro">
        <div className="brand brand--light">
          <div className="brand__mark">R</div>
          <div>
            <strong>ruffl</strong>
            <span>trust &amp; safety</span>
          </div>
        </div>
        <div>
          <span className="eyebrow eyebrow--light">Human decisions, clear context</span>
          <h1>Resolve marketplace issues without losing the story.</h1>
          <p>
            Review commission history, evidence, costs, warnings, and support messages before taking action.
          </p>
        </div>
        <div className="login__promise">
          <ShieldCheck aria-hidden="true" size={22} />
          <span>Admin access is granted at the database level and cannot be created through signup.</span>
        </div>
      </section>
      <section className="login__form-wrap">
        <form
          className="login__form"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}>
          <span className="eyebrow">Restricted area</span>
          <h2>Admin sign in</h2>
          <p>Use the same Ruffl email and password as the API account.</p>
          <label>
            Email
            <input
              autoComplete="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@example.com"
              type="email"
              value={email}
            />
          </label>
          <label>
            Password
            <input
              autoComplete="current-password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Your password"
              type="password"
              value={password}
            />
          </label>
          {error ? <div className="notice notice--error"><AlertTriangle size={18} />{error}</div> : null}
          <button className="button button--primary" disabled={busy} type="submit">
            {busy ? 'Signing in…' : 'Sign in securely'}
          </button>
          <div className="demo-box">
            <strong>Local demo</strong>
            <span>Start the backend, then use the seeded admin account.</span>
            <button
              className="button button--secondary"
              disabled={busy}
              onClick={() => void submit('admin@demo.ruffl', 'RufflDemo1!')}
              type="button">
              Use demo admin
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

function DashboardPage({
  data,
  onRefresh,
  page,
  setError,
  token,
}: {
  data: DashboardData;
  onRefresh: () => Promise<void>;
  page: Page;
  setError: (message: string) => void;
  token: string;
}) {
  const headings: Record<Page, [string, string]> = {
    overview: ['Overview', 'A live view of the marketplace and work needing attention.'],
    users: ['People', 'Search accounts and apply traceable moderation actions.'],
    commissions: ['Commissions', 'Read-only financial and lifecycle context across every project.'],
    disputes: ['Disputes', 'Review evidence and costs before making a human decision.'],
    chats: ['Support chats', 'Continue direct support conversations with Ruffl users.'],
  };
  const [title, subtitle] = headings[page];

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <span className="eyebrow">Ruffl operations</span>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        <button className="button button--secondary" onClick={() => void onRefresh()} type="button">
          Refresh data
        </button>
      </header>
      {page === 'overview' && data.overview ? <OverviewPage data={data} /> : null}
      {page === 'users' ? (
        <UsersPage onRefresh={onRefresh} setError={setError} token={token} users={data.users} />
      ) : null}
      {page === 'commissions' ? <CommissionsPage commissions={data.commissions} users={data.users} /> : null}
      {page === 'disputes' ? (
        <DisputesPage disputes={data.disputes} onRefresh={onRefresh} setError={setError} token={token} />
      ) : null}
      {page === 'chats' ? <ChatsPage conversations={data.conversations} users={data.users} /> : null}
    </div>
  );
}

function OverviewPage({ data }: { data: DashboardData }) {
  const overview = data.overview!;
  const stats = [
    { label: 'Total people', value: overview.counts.users, icon: Users, tone: 'green' },
    { label: 'Active commissions', value: overview.counts.activeCommissions, icon: FolderKanban, tone: 'blue' },
    { label: 'Open disputes', value: overview.counts.openDisputes, icon: ShieldCheck, tone: 'coral' },
    { label: 'Unread support chats', value: overview.counts.unreadAdminChats, icon: MessageCircle, tone: 'amber' },
  ];

  return (
    <>
      <section className="stat-grid">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <article className="stat-card" key={stat.label}>
              <div className={`stat-card__icon stat-card__icon--${stat.tone}`}><Icon size={21} /></div>
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
            </article>
          );
        })}
      </section>
      <section className="two-column">
        <article className="panel">
          <PanelHeader icon={FolderKanban} title="Recent commissions" />
          <div className="list">
            {data.commissions.slice(-5).reverse().map((commission) => (
              <div className="list-row" key={commission.id}>
                <div className="list-row__icon"><FolderKanban size={18} /></div>
                <div className="list-row__main">
                  <strong>{commission.title}</strong>
                  <span>{sentenceCase(commission.suitType)} · {formatMoney(commission.agreedTotal ?? commission.budget)}</span>
                </div>
                <Badge value={commission.status} />
              </div>
            ))}
            {!data.commissions.length ? <EmptyCopy>No commission records yet.</EmptyCopy> : null}
          </div>
        </article>
        <article className="panel">
          <PanelHeader icon={ShieldCheck} title="Disputes needing review" />
          <div className="list">
            {data.disputes
              .filter((dispute) => ['open', 'under_review'].includes(dispute.status))
              .slice(0, 5)
              .map((dispute) => (
                <div className="list-row" key={dispute.id}>
                  <div className="list-row__icon list-row__icon--coral"><AlertTriangle size={18} /></div>
                  <div className="list-row__main">
                    <strong>{dispute.commission?.title ?? 'Commission dispute'}</strong>
                    <span>{new Date(dispute.createdAt).toLocaleDateString('en-GB')}</span>
                  </div>
                  <Badge value={dispute.status} />
                </div>
              ))}
            {!data.disputes.length ? <EmptyCopy>No disputes need attention.</EmptyCopy> : null}
          </div>
        </article>
      </section>
    </>
  );
}

function UsersPage({
  onRefresh,
  setError,
  token,
  users,
}: {
  onRefresh: () => Promise<void>;
  setError: (message: string) => void;
  token: string;
  users: User[];
}) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [busyId, setBusyId] = useState('');
  const api = useMemo(() => createAdminApi(token), [token]);
  const filtered = users.filter(
    (user) =>
      (!status || user.status === status) &&
      (!search ||
        user.displayName.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase())),
  );

  const act = async (userId: string, action: () => Promise<unknown>) => {
    setBusyId(userId);
    setError('');
    try {
      await action();
      await onRefresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Moderation action failed.');
    } finally {
      setBusyId('');
    }
  };

  return (
    <section className="panel">
      <div className="toolbar">
        <div className="search-box">
          <Search aria-hidden="true" size={18} />
          <input
            aria-label="Search people"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name or email"
            value={search}
          />
        </div>
        <select aria-label="Filter by status" onChange={(event) => setStatus(event.target.value)} value={status}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="deleted">Deleted</option>
        </select>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Person</th><th>Role</th><th>Status</th><th>Joined</th><th><span className="sr-only">Actions</span></th></tr></thead>
          <tbody>
            {filtered.map((user) => (
              <tr key={user.id}>
                <td>
                  <div className="person-cell">
                    <div className="avatar avatar--small">{initials(user.displayName)}</div>
                    <div><strong>{user.displayName}</strong><span>{user.email}</span></div>
                  </div>
                </td>
                <td>{sentenceCase(user.role)}</td>
                <td><Badge value={user.status} /></td>
                <td>{new Date(user.createdAt).toLocaleDateString('en-GB')}</td>
                <td>
                  {user.role !== 'admin' ? (
                    <div className="actions">
                      <button
                        disabled={busyId === user.id}
                        onClick={() => {
                          const message = window.prompt('Warning shown to this user:');
                          if (message?.trim()) void act(user.id, () => api.warn(user.id, message));
                        }}
                        type="button">Warn</button>
                      {user.status === 'suspended' ? (
                        <button disabled={busyId === user.id} onClick={() => void act(user.id, () => api.unsuspend(user.id))} type="button">Unsuspend</button>
                      ) : (
                        <button
                          disabled={busyId === user.id}
                          onClick={() => {
                            const reason = window.prompt('Suspension reason:');
                            const hours = Number(window.prompt('Suspension duration in hours:', '24'));
                            if (reason?.trim() && hours > 0) void act(user.id, () => api.suspend(user.id, hours, reason));
                          }}
                          type="button">Suspend</button>
                      )}
                      {user.status === 'deleted' ? (
                        <button
                          className="danger-link"
                          disabled={busyId === user.id}
                          onClick={() => {
                            if (window.confirm('Permanently delete this account and associated data? This cannot be undone.')) {
                              void act(user.id, () => api.permanentlyDelete(user.id));
                            }
                          }}
                          type="button">Delete permanently</button>
                      ) : (
                        <button
                          className="danger-link"
                          disabled={busyId === user.id}
                          onClick={() => {
                            if (window.confirm('Soft-delete this account? Their data will remain for audit.')) {
                              void act(user.id, () => api.softDelete(user.id));
                            }
                          }}
                          type="button">Soft-delete</button>
                      )}
                    </div>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!filtered.length ? <EmptyCopy>No users match these filters.</EmptyCopy> : null}
    </section>
  );
}

function CommissionsPage({ commissions, users }: { commissions: Commission[]; users: User[] }) {
  const userName = (id: string) => users.find((user) => user.id === id)?.displayName ?? id;
  return (
    <section className="panel">
      <div className="table-wrap">
        <table>
          <thead><tr><th>Commission</th><th>Commissioner</th><th>Maker</th><th>Value</th><th>Deposit</th><th>Status</th></tr></thead>
          <tbody>
            {commissions.map((commission) => (
              <tr key={commission.id}>
                <td><strong>{commission.title}</strong><span className="cell-subtitle">{sentenceCase(commission.suitType)}</span></td>
                <td>{userName(commission.commissionerId)}</td>
                <td>{userName(commission.makerId)}</td>
                <td>{formatMoney(commission.agreedTotal ?? commission.budget)}</td>
                <td>{commission.depositPaid ? <span className="yes"><CheckCircle2 size={15} /> Recorded</span> : 'Not paid'}</td>
                <td><Badge value={commission.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!commissions.length ? <EmptyCopy>No commission records yet.</EmptyCopy> : null}
    </section>
  );
}

function DisputesPage({
  disputes,
  onRefresh,
  setError,
  token,
}: {
  disputes: Dispute[];
  onRefresh: () => Promise<void>;
  setError: (message: string) => void;
  token: string;
}) {
  const api = useMemo(() => createAdminApi(token), [token]);
  const [busyId, setBusyId] = useState('');

  const act = async (id: string, action: () => Promise<unknown>) => {
    setBusyId(id);
    try {
      await action();
      await onRefresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Dispute action failed.');
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="dispute-grid">
      {disputes.map((dispute) => {
        const exposure = disputeExposure(dispute);
        return (
          <article className="panel dispute-card" key={dispute.id}>
            <div className="dispute-card__header">
              <div>
                <span className="eyebrow">Case {dispute.id.slice(0, 8)}</span>
                <h2>{dispute.commission?.title ?? 'Commission dispute'}</h2>
              </div>
              <Badge value={dispute.status} />
            </div>
            <p>{dispute.explanation}</p>
            <div className="finance-grid">
              <div><span>Commission value</span><strong>{formatMoney(exposure.total)}</strong></div>
              <div><span>Logged materials</span><strong>{formatMoney(exposure.materialCost)}</strong></div>
              <div><span>Gross after materials</span><strong>{formatMoney(exposure.estimatedGrossAfterMaterials)}</strong></div>
            </div>
            {dispute.resolution ? <div className="resolution"><strong>Resolution</strong><span>{dispute.resolution}</span></div> : null}
            <div className="button-row">
              {dispute.status === 'open' ? (
                <button className="button button--primary" disabled={busyId === dispute.id} onClick={() => void act(dispute.id, () => api.assignDispute(dispute.id))} type="button">Assign to me</button>
              ) : null}
              {dispute.status === 'under_review' ? (
                <button
                  className="button button--primary"
                  disabled={busyId === dispute.id}
                  onClick={() => {
                    const outcome = window.prompt(
                      'Outcome: maker_favoured, commissioner_favoured, split_decision, commission_cancelled, or no_resolution',
                      'split_decision',
                    );
                    const resolution = window.prompt('Required written resolution:');
                    if (outcome && resolution?.trim()) {
                      void act(dispute.id, () => api.resolveDispute(dispute.id, outcome, resolution));
                    }
                  }}
                  type="button">Adjudicate</button>
              ) : null}
              {dispute.status === 'resolved' ? (
                <button className="button button--secondary" disabled={busyId === dispute.id} onClick={() => void act(dispute.id, () => api.closeDispute(dispute.id))} type="button">Close case</button>
              ) : null}
            </div>
          </article>
        );
      })}
      {!disputes.length ? <section className="panel"><EmptyCopy>No disputes have been raised.</EmptyCopy></section> : null}
    </div>
  );
}

function ChatsPage({ conversations, users }: { conversations: Conversation[]; users: User[] }) {
  return (
    <section className="panel">
      <PanelHeader icon={Headphones} title="User support inbox" />
      <div className="list">
        {conversations.map((conversation) => {
          const person = users.find(
            (user) => user.role !== 'admin' && conversation.participantIds.includes(user.id),
          );
          return (
            <button className="list-row list-row--button" key={conversation.id} type="button">
              <div className="avatar avatar--small">{initials(person?.displayName ?? 'User')}</div>
              <div className="list-row__main">
                <strong>{person?.displayName ?? 'Ruffl user'}</strong>
                <span>{conversation.lastMessage?.text ?? 'No messages yet'}</span>
              </div>
              <ChevronRight size={18} />
            </button>
          );
        })}
        {!conversations.length ? <EmptyCopy>No admin support conversations yet.</EmptyCopy> : null}
      </div>
    </section>
  );
}

function Badge({ value }: { value: string }) {
  const tone = ['active', 'complete', 'resolved'].includes(value)
    ? 'positive'
    : ['disputed', 'suspended', 'deleted'].includes(value)
      ? 'danger'
      : ['open', 'pending', 'under_review'].includes(value)
        ? 'warning'
        : 'neutral';
  return <span className={`badge badge--${tone}`}>{sentenceCase(value)}</span>;
}

function PanelHeader({ icon: Icon, title }: { icon: typeof UserRound; title: string }) {
  return (
    <header className="panel__header">
      <div><Icon size={19} /><h2>{title}</h2></div>
    </header>
  );
}

function EmptyCopy({ children }: { children: React.ReactNode }) {
  return <div className="empty-copy">{children}</div>;
}

function LoadingPanel() {
  return (
    <div className="loading-panel">
      <div className="spinner" />
      <strong>Loading Ruffl operations…</strong>
    </div>
  );
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}
