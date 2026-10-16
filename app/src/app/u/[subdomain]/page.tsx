export default async function SubdomainPage(
  props: PageProps<'/u/[subdomain]'>,
) {
  const { subdomain } = await props.params;
  return (
    <main className="flex flex-1 items-center justify-center">
      <h1 className="text-3xl font-semibold">{subdomain}.rapport.computer</h1>
    </main>
  );
}
