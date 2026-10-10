export const site = {
  name: 'Dover Town & District Guide',
  short: 'Dover Guide',
  // TODO: add the address enquiries should go to (shown on the Add page when no form endpoint is set)
  contactEmail: '',
  // Form handler for "List your business" (e.g. Formspree). Set PUBLIC_FORM_ENDPOINT in .env.
  formEndpoint: import.meta.env.PUBLIC_FORM_ENDPOINT ?? '',
};
