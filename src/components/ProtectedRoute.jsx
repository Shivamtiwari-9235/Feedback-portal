export default function ProtectedRoute({ allowed, loading, children }) {
  if (loading) {
    return <div className="inline-loading"><span className="spinner small" aria-hidden="true"></span><span>Checking access...</span></div>;
  }
  if (!allowed) {
    return <section className="panel access-denied" role="alert"><p className="eyebrow">Access restricted</p><h2>Reviewer access required</h2><p>Your account does not have permission to view this dashboard.</p></section>;
  }
  return children;
}
