const LE = 'http://localhost:4001';
const body = {
  selected_modules: ['pos', 'crm'],
  billing_cycle: 'monthly',
  product_slug: 'waamto-erp',
};
for (const path of [
  '/api/v1/public/catalog/custom-packages/quote',
  '/api/v1/public/custom-packages/quote',
  '/api/v1/registrations/start',
]) {
  const res = await fetch(`${LE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(
      path.includes('registrations')
        ? {
            name: 'Probe',
            email: `probe.${Date.now()}@example.com`,
            password: 'Probe!23456xx',
            company_name: 'Probe Co',
            country: 'PK',
            package_type: 'custom',
            product_slug: 'waamto-erp',
            selected_modules: ['pos'],
            billing_cycle: 'monthly',
          }
        : body
    ),
  });
  const text = await res.text();
  console.log(path, res.status, text.slice(0, 400));
}
