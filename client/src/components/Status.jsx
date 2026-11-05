export const Loading = ({ text = 'Memuat...' }) => <p className="muted loading">{text}</p>;
export const ErrorText = ({ children }) => (children ? <p className="error" role="alert">{children}</p> : null);
export const Empty = ({ children }) => <p className="empty">{children}</p>;
