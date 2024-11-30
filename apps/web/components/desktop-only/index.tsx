export function DesktopOnly(props: { children: React.ReactNode }) {
  const { children } = props;

  return <div className="hidden md:block">{children}</div>;
}
