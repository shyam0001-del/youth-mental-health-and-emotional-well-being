export default function Layout({ title, children }) {
    return (
      <>
        <div className="title-bar">{title}</div>
        <div className="page-wrap">{children}</div>
      </>
    );
  }