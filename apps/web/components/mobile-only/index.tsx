export function MobileOnly(props: { children: React.ReactNode }) {
  const { children } = props;

  return <div className="block md:hidden">{children}</div>;
}
